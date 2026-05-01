/**、
 * 这个文件用于处理提供给用户的API
 */

import { useStoryStore } from './store/story.ts';
import {
    ADVCheck,
    ADVChoice,
    ADVDialog,
    ADVItem,
    ADVMessage,
    type ADVNext,
    ADVScene,
    ADVUserDialog,
    ADVUserItem,
    type ADVUserNext,
    ADVUserScene,
    type MessageType,
} from './data/model.ts';
import { useStateStore } from './store/state.ts';
import { useMessageStore } from './store/message.ts';
import type { Component } from 'vue';
import { Game, RuntimeError } from './game.ts';

type GameConfig = {
    // 物品
    items: {
        // id 为物品的唯一标识符
        [id: string]: ADVUserItem;
    };
    status: {
        [id: string]: {
            // 默认数字
            defaultValue?: number;
            // 展示的名称
            name?: string;
            // 上限
            max?: number;
            // 下限
            min?: number;
            // 主题色
            color?: string;
        };
    };
    // 游戏入口，一个场景
    mainScene: string;
    // 游戏名称
    gameName: string;
};

export const ADVMaker = {
    defineConfig(config: GameConfig): GameConfig {
        const storyStore = useStoryStore();
        const stateStore = useStateStore();
        for (let itemsKey in config.items) {
            storyStore.objectMap.set(itemsKey, new ADVItem(config.items[itemsKey], itemsKey));
        }

        for (let itemsKey in config.status) {
            const obj = config.status[itemsKey];
            stateStore.status.set(itemsKey, {
                name: obj.name ?? itemsKey,
                id: itemsKey,
                min: obj.min ?? 0,
                max: obj.max ?? 100,
                value: obj.defaultValue ?? 0,
                color: obj.color ?? 'blue',
            });
        }

        storyStore.mainScene = config.mainScene;
        storyStore.gameName = config.gameName;

        return config;
    },
    obtainItem(item: string, number: number = 1) {
        const stateStore = useStateStore();
        const storyStore = useStoryStore();
        stateStore.obtainItem(item, number);
        const res = storyStore.objectMap.get(item)!;
        ADVMaker.appendMessage(`获取 ${res.name} ${number}个。`, 'user');
    },
    obtainStatus(item: string, number: number) {
        const stateStore = useStateStore();
        stateStore.obtainStatus(item, number);
        const res = stateStore.status.get(item)!;
        if (number >= 0)
            ADVMaker.appendMessage(
                `属性 ${res.name} 增加 ${number} 点，剩余 ${res.value} 点。`,
                'user',
            );
        else
            ADVMaker.appendMessage(
                `属性 ${res.name} 减少 ${-number} 点，剩余 ${res.value} 点。`,
                'user',
            );
    },
    getItem(item: string): number | undefined {
        const storyStore = useStoryStore();
        return storyStore.objectMap.get(item)?.number;
    },
    getStatue(item: string): number | undefined {
        const stateStore = useStateStore();
        return stateStore.status.get(item)?.value;
    },
    appendScene(id: string, config: ADVUserScene): ADVScene {
        const storyStore = useStoryStore();
        checkHasSameId(id);
        return storyStore.sceneMap.set(id, new ADVScene(id, config)).get(id)!;
    },
    appendDialog(id: string, config: ADVUserDialog): ADVDialog {
        const storyStore = useStoryStore();
        checkHasSameId(id);
        return storyStore.dialogMap.set(id, new ADVDialog(id, config)).get(id)!;
    },
    goto(next: ADVUserNext) {
        let newNext: ADVNext;
        if (typeof next === 'function') {
            next = next();
        }
        if (Array.isArray(next)) {
            newNext = [];
            next.forEach((v) => {
                (newNext as Array<ADVChoice>).push(new ADVChoice(v));
            });
        } else if (typeof next === 'string' || next === null) newNext = next;
        else {
            newNext = new ADVCheck(next);
        }
        Game.toNext(newNext);
    },
    end(desc: string): ADVScene {
        return {
            name: desc,
            next: '',
            id: `_END&${desc}`,
            type: 'Scene',
        };
    },
    appendMessage(content: string | Component, type: MessageType = 'story') {
        const message = useMessageStore();
        message.appendMessage(new ADVMessage(content, type));
    },
};

window.ADVMaker = ADVMaker;

function checkHasSameId(id: string) {
    const storyStore = useStoryStore();
    if (storyStore.usedSceneAndDialogId.has(id)) {
        Game.error(new RuntimeError(4, `There is already a dialog or scene with the ID '${id}'.`));
    }
    storyStore.usedSceneAndDialogId.add(id);
}
