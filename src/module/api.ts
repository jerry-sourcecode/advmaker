import { useStoryStore } from './store/story.ts';
import { ADVChoice, ADVDialog, ADVItem, ADVScene, ADVStatus } from './data/model.ts';
import { useStateStore } from './store/state.ts';
import { useMessageStore } from './store/message.ts';

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
    mainScene: string | ADVScene;
    gameName: string;
};

export function toObjectId(scene: string | ADVScene | ADVDialog | ADVItem | ADVStatus): string {
    if (typeof scene === 'string') return scene;
    return scene.id;
}

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
                value: obj.defaultValue ?? 100,
                color: obj.color ?? 'blue',
            });
        }

        storyStore.mainScene = toObjectId(config.mainScene);
        storyStore.gameName = config.gameName;

        return config;
    },
    obtainItem(item: string | ADVItem, number: number = 1) {
        item = toObjectId(item);
        const stateStore = useStateStore();
        const storyStore = useStoryStore();
        const messageStore = useMessageStore();
        stateStore.obtainItem(item, number);
        const res = storyStore.objectMap.get(item)!;
        messageStore.appendMessage({ content: `获取 ${res.name} ${number}个。`, type: 'system' });
    },
    obtainStatus(item: string | ADVStatus, number: number) {
        item = toObjectId(item);
        const stateStore = useStateStore();
        const messageStore = useMessageStore();
        stateStore.obtainStatus(item, number);
        const res = stateStore.status.get(item)!;
        if (number >= 0)
            messageStore.appendMessage({
                content: `属性 ${res.name} 增加 ${number} 点，剩余 ${res.value} 点。`,
                type: 'system',
            });
        else
            messageStore.appendMessage({
                content: `属性 ${res.name} 减少 ${-number} 点，剩余 ${res.value} 点。`,
                type: 'system',
            });
    },
    getStatue(item: string | ADVStatus) {
        item = toObjectId(item);
        const stateStore = useStateStore();
        return stateStore.status.get(item)?.value;
    },
    appendScene(
        id: string,
        config: { name: string; next: ADVScene | ADVDialog | string },
    ): ADVScene {
        const storyStore = useStoryStore();
        return storyStore.sceneMap
            .set(id, {
                name: config.name,
                next: toObjectId(config.next),
                id,
                type: 'Scene',
            })
            .get(id)!;
    },
    appendDialog(
        id: string,
        config: { script: string | string[]; next: ADVScene | ADVDialog | string | ADVChoice[] },
    ): ADVDialog {
        const storyStore = useStoryStore();
        return storyStore.dialogMap
            .set(id, {
                script: config.script,
                next: Array.isArray(config.next) ? config.next : toObjectId(config.next),
                id,
                type: 'Dialog',
            })
            .get(id)!;
    },
    end(desc: string): ADVScene {
        return {
            name: desc,
            next: '',
            id: `_END&${desc}`,
            type: 'Scene',
        };
    },
};
