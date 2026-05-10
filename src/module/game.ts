/**
 * 这个文件用于处理与游戏进程相关的逻辑
 */

import { useStoryStore } from './store/story.ts';
import { useStateStore } from './store/state.ts';
import { useMessageStore } from './store/message.ts';
import { useEmitter } from './store/emitter.ts';
import { ADVCharacter, ADVGoods, ADVItem, type ADVNext, ADVStatus } from './data/model.ts';
import { ADVMaker } from './api.ts';
import { dice } from './utils/dice.ts';
import { RV } from './utils/util.ts';
import { useSaveManager } from './store/saveManager.ts';
import type { CharsIds, GameConfig, GoodsIds, ItemIds, StatusIds } from './type/user';

/**
 * 运行时错误类，错误码以 1 开头，可以调用 Game.error 抛出错误
 * - code：错误码（< 100），会自动在前面加上 1 前缀
 * - reason：错误原因
 *
 * 目前错误码有：
 * - 101：物品数量不能为负数
 * - 102：找不到场景/属性
 * - 103：骰子错误
 * - 104：发现两个场景或对话、属性有相同的id
 * - 105：发现合成图谱的材料列表为空
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
        const saveManager = useSaveManager();

        console.log('Game Start!');

        // 初始化
        messageStore.messageList = [];
        // 获取默认物品
        storyStore.objectMap.forEach((value, key) => {
            stateStore.obtainItem(key, value.default);
        });
        if (saveManager.shouldRun !== null) {
            const run = saveManager.shouldRun;
            saveManager.shouldRun = null;
            saveManager.run(run);
        }
        // 进入初始场景
        else this.enter(storyStore.mainScene!);
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
        scene?.onEnter();
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
        dialog?.onStart();
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
        stateStore.last = nextAct;
        nextAct = RV(nextAct);
        if (typeof nextAct === 'string') {
            if (nextAct.startsWith('_END&')) {
                stateStore.isDead = true;
                stateStore.deadDesc = nextAct.slice(5);
                return;
            }
            const storyStore = useStoryStore();
            if (nextAct === '_START') {
                this.toNext(storyStore.mainScene);
            }
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

            const res = RV(nextAct.target);
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
    defineConfig(config: GameConfig) {
        const storyStore = useStoryStore();
        const stateStore = useStateStore();
        for (const key in config.items) {
            const itemsKey = key as ItemIds;
            const obj = config.items[itemsKey];
            storyStore.objectMap.set(itemsKey, new ADVItem(obj, itemsKey));
        }

        for (const key in config.goods) {
            const itemsKey = key as GoodsIds;
            const obj = new ADVGoods(config.goods[itemsKey], itemsKey);
            storyStore.goodsMap.set(itemsKey, obj);
            stateStore.shop.set(itemsKey, obj.inventory);
        }

        for (let key in config.character) {
            const itemsKey = key as CharsIds;
            const obj = new ADVCharacter(config.character[itemsKey], itemsKey);
            stateStore.character.set(itemsKey, obj);
        }

        for (const groupKey in config.status) {
            const itemsKey = groupKey as StatusIds;
            const obj = config.status[itemsKey];
            const name = obj.name ?? itemsKey;
            for (const statusKey in obj.content) {
                const statusId = statusKey as StatusIds;
                const status = obj.content[statusId];
                const newStatus = new ADVStatus(status, statusId, name);
                if (stateStore.status.has(statusId)) {
                    Game.error(
                        new RuntimeError(4, `There is already a status with the ID '${statusId}'.`),
                    );
                }
                stateStore.status.set(statusId, newStatus.default);
                storyStore.statusMap.set(statusId, newStatus);
            }
        }

        storyStore.mainScene = config.mainScene;
        storyStore.gameName = config.gameName ?? '新游戏';

        return config;
    },
};
