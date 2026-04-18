import { useStoryStore } from './store/story.ts';
import { ADVDialog, ADVItem, ADVScene } from './data/model.ts';
import { useStateStore } from './store/state.ts';
import { useMessageStore } from './store/message.ts';

type GameConfig = {
    items: {
        [id: string]: {
            defaultNumber: number;
            name?: string;
        };
    };
    mainScene: string | ADVScene;
    gameName: string;
};

function toObjectId(scene: string | ADVScene | ADVDialog | ADVItem): string {
    if (typeof scene === 'string') return scene;
    return scene.id;
}

export const ADVMaker = {
    defineConfig(config: GameConfig): GameConfig {
        const storyStore = useStoryStore();
        for (let itemsKey in config.items) {
            storyStore.objectMap.set(itemsKey, {
                name: config.items[itemsKey].name ?? itemsKey,
                number: config.items[itemsKey].defaultNumber,
                id: itemsKey,
                type: 'Item',
            });
        }
        storyStore.mainScene = toObjectId(config.mainScene);

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
        config: { script: string | string[]; next: ADVScene | ADVDialog | string },
    ): ADVDialog {
        const storyStore = useStoryStore();
        return storyStore.dialogMap
            .set(id, {
                script: config.script,
                next: toObjectId(config.next),
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
