import { useStoryStore } from './store/story.ts';
import { useStateStore } from './store/state.ts';
import { useMessageStore } from './store/message.ts';
import { useEmitter } from './store/emitter.ts';

/**
 * 运行时错误类，错误码以 1 开头，可以调用 Game.error 抛出错误
 * - code：错误码（< 100），会自动在前面加上 1 前缀
 * - reason：错误原因
 *
 * 目前错误码有：
 * - 101：物品数量不能为负数
 * - 102：找不到场景
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

async function toNext(nextId: string) {
    const stateStore = useStateStore();
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
