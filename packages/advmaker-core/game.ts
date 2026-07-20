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
import { useClueStore } from './store/clue.ts';
import { useTimeStore } from './store/time.ts';
import type { CharsIds, ClueIds, GameConfig, ItemIds, StatusIds } from './type/user';

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
 * - 106：尝试给 string 类型状态赋值 number
 * - 107：尝试给 number 类型状态赋值 string
 */
export class RuntimeError extends Error {
    code: number;
    reason: string;
    constructor(code: number, reason: string) {
        if (!Number.isInteger(code) || code < 1 || code > 99) {
            throw new Error(
                `RuntimeError code must be an integer in [1, 99], got: ${code}`,
            );
        }
        super(`Error Code ${code + 100}: ${reason}`);
        this.code = code + 100;
        this.reason = reason;
    }
}

export const Game = {
    /** 设为 true 可在控制台打印对话脚本结构表，便于调试 */
    debug: false,
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
        if (scene === undefined) {
            this.error(new RuntimeError(2, `找不到场景 / Scene not found, Id: '${sceneId}'.`));
            return;
        }
        await scene.onEnter();

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
        const messageStore = useMessageStore();
        const dialog = storyStore.dialogMap.get(dialogId);
        if (dialog === undefined) {
            this.error(new RuntimeError(2, `找不到对话 / Dialog not found, Id: '${dialogId}'.`));
            return;
        }
        await dialog.onStart();
        if (!Array.isArray(dialog.script)) {
            dialog.script = [dialog.script];
        }
        if (Array.isArray(dialog.script)) {
            // debug：打印脚本结构表
            if (Game.debug) {
                const rows = dialog.script.map((item, i) => {
                    let type;
                    let detail = '';
                    if (item instanceof ADVCommand) {
                        const cmd = item as ADVCommand;
                        type = `CMD:${cmd.type}`;
                        if (cmd.type === 'if') detail = '→ 条件分支入口';
                        else if (cmd.type === 'else') detail = '→ else 入口';
                        else if (cmd.type === 'elif') detail = '→ elif 入口';
                        else if (cmd.type === 'end') detail = '→ 分支结束';
                        else if (cmd.type === 'return') detail = '→ 终止脚本';
                    } else if (Array.isArray(item)) {
                        type = 'CHOICES';
                        detail = `${item.length} 个选项`;
                    } else if (typeof item === 'function') {
                        type = 'FN';
                        detail = '回调函数';
                    } else if (item !== null && typeof item === 'object' && 'type' in item) {
                        type = 'VNode';
                        detail = String((item as any).type?.__name ?? (item as any).type ?? '');
                    } else {
                        type = 'TEXT';
                        detail = String(item ?? '').slice(0, 40);
                    }
                    return { '#': i, type, detail };
                });
                console.groupCollapsed(`📜 对话脚本结构 — id="${dialogId}" (${rows.length} 项)`);
                console.table(rows, ['#', 'type', 'detail']);
                console.groupEnd();
            }
            for (let id = 0; id < dialog.script.length; id++) {
                if (
                    dialog.script[id] instanceof ADVCommand &&
                    (dialog.script[id] as ADVCommand).type === 'return' &&
                    messageStore.ifState.shouldExecute()
                ) {
                    if (Game.debug) console.log(`  🔚 [${id}] return → 终止脚本`);
                    return;
                }
                if (Game.debug) {
                    const item = dialog.script[id];
                    const exec = messageStore.ifState.shouldExecute();
                    let label = '?';
                    if (item instanceof ADVCommand) label = `CMD:${(item as ADVCommand).type}`;
                    else if (Array.isArray(item)) label = `CHOICES(${item.length})`;
                    else if (typeof item === 'function') label = 'FN';
                    else label = 'TEXT/VNode';
                    console.log(`  ${exec ? '▶️' : '⏭️'} [${id}] ${label}${exec ? '' : ' (跳过)'}`);
                }
                await Adv.print(dialog.script[id]);
            }
        } else {
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
        console.error(`[RuntimeError #${err.code}] ${err.reason}`);
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
        if (stateStore.location !== '') {
            // 为了防止在游戏开始时，进入初始场景就进行保存，此时场景为""，导致自动保存中地点为空
            saveManager.autoSave();
        }
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
            if (next === undefined) {
                Game.error(new RuntimeError(2, `找不到场景或对话 / Scene or Dialog not found, Id: '${nextAct}'.`));
                return;
            }
            if (next.type === 'Scene') {
                if (lastSceneId !== null) storyStore.sceneMap.get(lastSceneId)?.onLeave();
                await Game.enter(next.id);
            }
            if (next.type === 'Dialog') {
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
                        new RuntimeError(4, `已存在相同ID的状态 / Duplicate status ID: '${statusId}'.`),
                    );
                }
                stateStore.status.set(
                    statusId,
                    typeof newStatus.value === 'number'
                        ? {
                            base: newStatus.base ?? 0,
                            bonus: newStatus.value - (newStatus.base ?? 0),
                        }
                        : newStatus.value,
                );
                storyStore.statusMap.set(statusId, newStatus);
            }
        }

        // 初始化线索专题名称
        if (config.clue) {
            const clueStore = useClueStore();
            for (const subjectKey in config.clue) {
                const subject = config.clue[subjectKey];
                clueStore.subjectNames.set(subjectKey as ClueIds, subject.name ?? subjectKey);
                clueStore.getSubjectProxy(subjectKey as ClueIds);
            }
        }

        // 初始化游戏内时间（同时注册 __time__ 状态）
        if (config.time?.start) {
            const timeStore = useTimeStore();
            const match = config.time.start.match(
                /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})$/,
            );
            if (match) {
                const showDate = config.time.showDate ?? false;
                timeStore.init(
                    parseInt(match[1], 10),
                    parseInt(match[2], 10),
                    parseInt(match[3], 10),
                    parseInt(match[4], 10),
                    parseInt(match[5], 10),
                    showDate,
                );
                // 注册 __time__ 为 string 型状态，用于状态栏显示
                if (!stateStore.status.has('__time__' as StatusIds)) {
                    stateStore.status.set('__time__' as StatusIds, '');
                    const timeStatus = new ADVStatus(
                        { value: '', isDisplay: 'text', name: '' } as any,
                        '__time__' as StatusIds,
                        '',
                    );
                    storyStore.statusMap.set('__time__' as StatusIds, timeStatus);
                }
                // 同步初始值
                stateStore.status.set('__time__' as StatusIds, timeStore.barStr);
            }
        }

        storyStore.mainScene = config.mainScene;
        storyStore.gameName = config.gameName ?? '新游戏';
        storyStore.judgmentMode = config.judgmentMode ?? 'd20';

        return config;
    },
};
