import { useStoryStore } from './store/story.ts';
import { useStateStore } from './store/state.ts';
import { useMessageStore } from './store/message.ts';
import { useEmitter } from './store/emitter.ts';
import { ADVCheck, type ADVNext } from './data/model.ts';
import { ADVMaker, toObjectId } from './api.ts';
import { dice } from './utils/dice.ts';
import { instanceType } from './utils/util.ts';

async function resolveValueAsync<T>(
    valueOrGetter: T | (() => T) | (() => Promise<T>) | Promise<T>,
): Promise<T> {
    if (typeof valueOrGetter === 'function') {
        const result = (valueOrGetter as () => T | Promise<T>)();
        return result instanceof Promise ? result : Promise.resolve(result);
    }
    return Promise.resolve(valueOrGetter);
}

/**
 * 运行时错误类，错误码以 1 开头，可以调用 Game.error 抛出错误
 * - code：错误码（< 100），会自动在前面加上 1 前缀
 * - reason：错误原因
 *
 * 目前错误码有：
 * - 101：物品数量不能为负数
 * - 102：找不到场景
 * - 103：骰子错误
 */
export class RuntimeError extends Error {
    code: number;
    reason: string;
    constructor(code: number, reason: string) {
        code = (code % 100) + 100;
        super(`Error Code ${code}: ${reason}`);
        this.code = code;
        this.reason = reason;
    }
}

async function toNext(nextId: ADVNext) {
    const stateStore = useStateStore();
    const emitter = useEmitter();
    if (typeof nextId === 'string') {
        if (nextId.startsWith('_END&')) {
            stateStore.isDead = true;
            stateStore.deadDesc = nextId.slice(5);
            return;
        }
        const storyStore = useStoryStore();
        const next = storyStore.tryGet(nextId, storyStore.TP.SCENE | storyStore.TP.DIALOG);
        if (next === undefined)
            Game.error(new RuntimeError(2, `Can't Find Scene or Dialog, Id: '${nextId}'.`));
        if (next?.type === 'Scene') {
            await Game.enter(next.id);
        }
        if (next?.type === 'Dialog') {
            await Game.speak(next.id);
        }
        return;
    } else if (Array.isArray(nextId)) {
        const res = await emitter.emit('make-choice', nextId);
        if (instanceType(nextId[res].next) === 'Check') await toNext(nextId[res].next as ADVCheck);
        else await toNext(toObjectId(nextId[res].next as any));
    } else {
        const dc = nextId.dice ?? 'd6';
        let pt = 0;
        if (typeof dc === 'object') {
            pt = dc.func();
        } else {
            pt = dice(dc);
        }

        const ori = pt;

        nextId.modifier?.forEach((v) => {
            pt += v.value();
        });

        const diff = pt - ori;
        let diff_str = '';
        if (diff > 0) diff_str = `+${diff}`;
        else if (diff < 0) diff_str = `${diff}`;

        const res = await resolveValueAsync(nextId.target);
        if (pt >= res) {
            ADVMaker.appendMessage(
                `检定成功！掷出 ${ori}${diff_str}=${pt} 点，目标 ${res} 点。`,
                'system',
            );
            if (nextId.onSuccess) nextId.onSuccess();
            await toNext(nextId.success);
        } else {
            ADVMaker.appendMessage(
                `检定失败！掷出 ${ori}${diff_str}=${pt} 点，目标 ${res} 点。`,
                'system',
            );
            if (nextId.onFail) nextId.onFail();
            await toNext(nextId.fail);
        }
    }
}

export const Game = {
    async start() {
        const storyStore = useStoryStore();
        const stateStore = useStateStore();
        const messageStore = useMessageStore();

        console.log('Game Start!');

        // 初始化
        stateStore.init();
        messageStore.messageList = [];
        // 获取默认物品
        storyStore.objectMap.forEach((item) => {
            stateStore.obtainItem(item.name, item.number);
        });
        // 进入初始场景
        await this.enter(storyStore.mainScene!);
    },
    async enter(sceneId: string) {
        const stateStore = useStateStore();
        const storyStore = useStoryStore();
        const messageStore = useMessageStore();
        const scene = storyStore.sceneMap.get(sceneId);
        if (scene === undefined) {
            this.error(new RuntimeError(2, `Can't Find Scene, Id: '${sceneId}'.`));
            return;
        }

        stateStore.location = scene.name;
        messageStore.messageList = [];
        await toNext(scene.next);
    },
    async speak(dialogId: string) {
        const storyStore = useStoryStore();
        const messageStore = useMessageStore();
        const emitter = useEmitter();
        const dialog = storyStore.dialogMap.get(dialogId);
        if (dialog === undefined) {
            this.error(new RuntimeError(2, `Can't Find Dialog, Id: '${dialogId}'.`));
            return;
        }
        if (dialog.script instanceof String) {
            dialog.script = [dialog.script as string];
        }
        for (const v of dialog.script as string[]) {
            const id = (dialog.script as string[]).indexOf(v);
            messageStore.appendMessage(v);
            if (id !== dialog.script.length - 1) {
                await emitter.emit('wait-for-click-screen');
            }
        }
        await toNext(dialog.next);
    },
    /**
     * 抛出错误
     * @param err 错误对象
     */
    error(err: RuntimeError) {
        throw err;
    },
};
