/**
 * 这个文件用于处理与游戏进程相关的逻辑
 */

import { useStoryStore } from './store/story.ts';
import { useStateStore } from './store/state.ts';
import { useMessageStore } from './store/message.ts';
import { useEmitter } from './store/emitter.ts';
import { type ADVNext } from './data/model.ts';
import { ADVMaker } from './api.ts';
import { dice } from './utils/dice.ts';
import { resolveValue } from './utils/util.ts';

/**
 * 运行时错误类，错误码以 1 开头，可以调用 Game.error 抛出错误
 * - code：错误码（< 100），会自动在前面加上 1 前缀
 * - reason：错误原因
 *
 * 目前错误码有：
 * - 101：物品数量不能为负数
 * - 102：找不到场景
 * - 103：骰子错误
 * - 104：发现两个场景或对话有相同的id
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

export const Game = {
    /**
     * 游戏开始
     */
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
            stateStore.obtainItem(item.id, item.number);
        });
        // 进入初始场景
        this.enter(storyStore.mainScene!);
    },
    /**
     * 进入一个场景
     * @param sceneId 场景 id
     */
    enter(sceneId: string) {
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
        Game.toNext(scene.next);
    },
    /**
     * 进行一次对话
     * @param dialogId 对话 id
     */
    async speak(dialogId: string) {
        const storyStore = useStoryStore();
        const messageStore = useMessageStore();
        const emitter = useEmitter();
        const dialog = storyStore.dialogMap.get(dialogId);
        if (dialog === undefined) {
            this.error(new RuntimeError(2, `Can't Find Dialog, Id: '${dialogId}'.`));
            return;
        }
        if (!Array.isArray(dialog.script)) {
            dialog.script = [dialog.script];
        }
        if (Array.isArray(dialog.script))
            for (let id = 0; id < dialog.script.length; id++) {
                const v = dialog.script[id];
                messageStore.appendMessage(v);
                await emitter.emit('wait-for-click-screen');
            }
        else {
            // 不可能到达
            throw Error('Never Reach');
        }
        Game.toNext(dialog.next);
    },
    /**
     * 抛出错误
     * @param err 错误对象
     */
    error(err: RuntimeError) {
        throw err;
    },
    /**
     * 执行下一个动作
     * @param nextAct 下面要进行的动作
     */
    toNext(nextAct: ADVNext) {
        if (nextAct === null) return;
        const stateStore = useStateStore();
        const emitter = useEmitter();
        nextAct = resolveValue(nextAct);
        if (typeof nextAct === 'string') {
            if (nextAct.startsWith('_END&')) {
                stateStore.isDead = true;
                stateStore.deadDesc = nextAct.slice(5);
                return;
            }
            const storyStore = useStoryStore();
            const next = storyStore.tryGet(nextAct, storyStore.TP.SCENE | storyStore.TP.DIALOG);
            if (next === undefined)
                Game.error(new RuntimeError(2, `Can't Find Scene or Dialog, Id: '${nextAct}'.`));
            if (next?.type === 'Scene') {
                Game.enter(next.id);
            }
            if (next?.type === 'Dialog') {
                Game.speak(next.id);
            }
            return;
        } else if (Array.isArray(nextAct)) {
            emitter.emit('make-choice', nextAct).then((res) => {
                nextAct[res].times++;
                Game.toNext(nextAct[res].next);
            });
        } else if (nextAct !== null) {
            const dc = nextAct.dice;
            let pt = 0;
            if (typeof dc === 'object') {
                pt = dc.roll();
            } else {
                pt = dice(dc);
            }

            const ori = pt;

            nextAct.modifier.forEach((v) => {
                pt += v.value();
            });

            const diff = pt - ori;
            let diff_str = '';
            if (diff > 0) diff_str = `+${diff}`;
            else if (diff < 0) diff_str = `${diff}`;

            const res = resolveValue(nextAct.target);
            if (pt >= res) {
                ADVMaker.appendMessage(
                    `检定成功！掷出 ${ori}${diff_str}=${pt} 点，目标 ${res} 点。`,
                    'system',
                );
                nextAct.onSuccess();
                Game.toNext(nextAct.success);
            } else {
                ADVMaker.appendMessage(
                    `检定失败！掷出 ${ori}${diff_str}=${pt} 点，目标 ${res} 点。`,
                    'system',
                );
                nextAct.onFail();
                Game.toNext(nextAct.fail);
            }
        }
    },
};
