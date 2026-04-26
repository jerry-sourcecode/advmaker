import { useStoryStore } from './store/story.ts';
import {
    ADVDialog,
    ADVMessage,
    ADVScene,
    ADVUserDialog,
    ADVUserScene,
    type MessageType,
} from './data/model.ts';
import { useStateStore } from './store/state.ts';
import { useMessageStore } from './store/message.ts';
import type { Component } from 'vue';

type GameConfig = {
    items: {
        [id: string]: {
            defaultNumber: number;
            name?: string;
        };
    };
    status: {
        [id: string]: {
            defaultValue?: number;
            name?: string;
            max?: number;
            min?: number;
            color?: string;
        };
    };
    mainScene: string;
    gameName: string;
};

export const ADVMaker = {
    defineConfig(config: GameConfig): GameConfig {
        const storyStore = useStoryStore();
        const stateStore = useStateStore();
        for (let itemsKey in config.items) {
            storyStore.objectMap.set(itemsKey, {
                name: config.items[itemsKey].name ?? itemsKey,
                number: config.items[itemsKey].defaultNumber,
                id: itemsKey,
                type: 'Item',
            });
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
        return storyStore.sceneMap.set(id, new ADVScene(id, config)).get(id)!;
    },
    appendDialog(id: string, config: ADVUserDialog): ADVDialog {
        const storyStore = useStoryStore();
        return storyStore.dialogMap.set(id, new ADVDialog(id, config)).get(id)!;
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
