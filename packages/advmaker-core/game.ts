/**
 * 这个文件用于处理与游戏进程相关的逻辑
 */

import { useStoryStore } from './store/story.ts';
import { useStateStore } from './store/state.ts';
import { useMessageStore } from './store/message.ts';
import { useEmitter } from './store/emitter.ts';
import {
    ADVCharacter,
    ADVChoice,
    ADVCommand,
    ADVItem,
    type ADVNext,
    ADVStatus,
} from './data/model.ts';
import { Adv } from './api.ts';
import { RV } from './utils/util.ts';
import { useSaveManager } from './store/saveManager.ts';
import type { CharsIds, GameConfig, ItemIds, StatusIds } from './type/user';

let lastSceneId: string | null = null;

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
        else await this.toNext(storyStore.mainScene!);
    },
    /**
     * 进入一个场景
     * @param sceneId 场景 id
     * @param noNext 是否避免执行该场景的next
     */
    async enter(sceneId: string, noNext: boolean = false) {
        const stateStore = useStateStore();
        const storyStore = useStoryStore();
        const messageStore = useMessageStore();
        const scene = storyStore.sceneMap.get(sceneId);
        lastSceneId = sceneId;
        await scene?.onEnter();
        if (scene === undefined) {
            this.error(new RuntimeError(2, `Can't Find Scene, Id: '${sceneId}'.`));
            return;
        }

        stateStore.location = scene.name;
        messageStore.messageList = [];

        if (!noNext) await Game.toNext(scene.next);
    },
    /**
     * 进行一次对话
     * @param dialogId 对话 id
     */
    async speak(dialogId: string) {
        const storyStore = useStoryStore();
        const dialog = storyStore.dialogMap.get(dialogId);
        await dialog?.onStart();
        if (dialog === undefined) {
            this.error(new RuntimeError(2, `Can't Find Dialog, Id: '${dialogId}'.`));
            return;
        }
        if (!Array.isArray(dialog.script)) {
            dialog.script = [dialog.script];
        }
        if (Array.isArray(dialog.script))
            for (let id = 0; id < dialog.script.length; id++) {
                if (
                    dialog.script[id] instanceof ADVCommand &&
                    (dialog.script[id] as ADVCommand).type === 'return'
                ) {
                    break;
                }
                await Adv.print(dialog.script[id]);
            }
        else {
            // 不可能到达
            throw Error('Never Reach');
        }
        if (dialog.check) await Adv.check(dialog.check);
        dialog.onFinish();
        await Game.toNext(dialog.next);
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
     * @param act 下面要进行的动作
     */
    async toNext(act: ADVNext) {
        if (act === null) return;
        const stateStore = useStateStore();
        stateStore.last = act;
        const saveManager = useSaveManager();
        saveManager.autoSave();
        const nextAct = RV(act);
        if (typeof nextAct === 'string') {
            if (nextAct.startsWith('__END&')) {
                stateStore.isDead = true;
                stateStore.deadDesc = nextAct.slice(6);
                return;
            }
            const storyStore = useStoryStore();
            if (nextAct === '_START') {
                await this.toNext(storyStore.mainScene);
            }
            const next = storyStore.tryGet(nextAct);
            if (next === undefined)
                Game.error(new RuntimeError(2, `Can't Find Scene or Dialog, Id: '${nextAct}'.`));
            if (next?.type === 'Scene') {
                if (lastSceneId !== null) storyStore.sceneMap.get(lastSceneId)?.onLeave();
                await Game.enter(next.id);
            }
            if (next?.type === 'Dialog') {
                if (next.in !== undefined && lastSceneId !== next.in)
                    await Game.enter(next.in, true);
                await Game.speak(next.id);
            }
            return;
        } else if (Array.isArray(nextAct)) {
            await this.choice(nextAct);
        } else if (nextAct !== null && typeof nextAct !== 'function') {
            await Adv.check(nextAct);
        }
    },
    async choice(ls: ADVChoice[]) {
        const emitter = useEmitter();
        const res = await emitter.emit('make-choice', ls);
        ls[res].times++;
        await ls[res].onChoose();
        if (ls[res].check) await Adv.check(ls[res].check);
        await Game.toNext(ls[res].next);
    },
    defineConfig(config: GameConfig) {
        const storyStore = useStoryStore();
        const stateStore = useStateStore();
        for (const key in config.items) {
            const itemsKey = key as ItemIds;
            const obj = config.items[itemsKey];
            storyStore.objectMap.set(itemsKey, new ADVItem(obj, itemsKey));
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
        storyStore.judgmentMode = config.judgmentMode ?? 'd20';

        return config;
    },
};
