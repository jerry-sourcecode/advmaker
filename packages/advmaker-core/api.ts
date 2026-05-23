/**、
 * 这个文件用于处理提供给用户的API
 */

import { useStoryStore } from './store/story.ts';
import {
    ADVCharacter,
    ADVCheck,
    ADVChoice,
    ADVDialog,
    ADVMessage,
    type ADVNext,
    ADVScene,
    ADVUserChoice,
    ADVUserDialog,
    ADVUserGoods,
    type ADVUserNext,
    ADVUserScene,
    fromUserNectToNext,
    type MessageType,
} from './data/model.ts';
import { useStateStore } from './store/state.ts';
import { useMessageStore } from './store/message.ts';
import type { VNode } from 'vue';
import { Game, RuntimeError } from './game.ts';
import type { CharsIds, GameConfig, ItemIds, StatusIds } from './type/user';
import { createRestrictedMapProxy, type MapProxy } from './utils/util.ts';
import { useEmitter } from './store/emitter.ts';

let backpackCache: MapProxy<Record<ItemIds, number>> | null = null;
let statusCache: MapProxy<Record<StatusIds, number>> | null = null;
let charsCache: MapProxy<Record<CharsIds, ADVCharacter>> | null = null;

export const Adv = {
    get bag() {
        if (!backpackCache) {
            const stateStore = useStateStore();
            backpackCache = createRestrictedMapProxy<Record<ItemIds, number>>(stateStore.backpack);
        }
        return backpackCache;
    },
    get status() {
        if (!statusCache) {
            const stateStore = useStateStore();
            const storyStore = useStoryStore();
            statusCache = createRestrictedMapProxy<Record<StatusIds, number>>(
                stateStore.status,
                (k, v) => {
                    const obj = storyStore.statusMap.get(k as StatusIds)!;
                    return Math.max(Math.min(v, obj.max), obj.min);
                },
            );
        }
        return statusCache;
    },
    get char() {
        if (!charsCache) {
            const stateStore = useStateStore();
            charsCache = createRestrictedMapProxy<Record<CharsIds, ADVCharacter>>(
                stateStore.character,
            );
        }
        return charsCache;
    },
    defineConfig<
        TItems extends Record<string, any>,
        TConfig extends Omit<GameConfig, 'items' | 'goods'> & {
            items: TItems;
            goods?: { [K in keyof TItems]?: ADVUserGoods<Extract<keyof TItems, string>> };
        },
    >(config: TConfig): TConfig {
        const storyStore = useStoryStore();
        storyStore.storyConfigObj = config;
        return config;
    },
    appendScene(id: string, config: ADVUserScene): ADVSceneBuilder {
        const storyStore = useStoryStore();
        checkHasSameId(id);
        storyStore.sceneMap.set(id, new ADVScene(id, config));
        return new ADVSceneBuilder(id);
    },
    appendDialog(id: string, config: ADVUserDialog = {}): ADVDialogBuilder {
        const storyStore = useStoryStore();
        checkHasSameId(id);
        storyStore.dialogMap.set(id, new ADVDialog(id, config)).get(id);
        return new ADVDialogBuilder(id);
    },
    goto(next: ADVUserNext) {
        let newNext: ADVNext;
        if (typeof next === 'function') {
            next = next() ?? null;
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
        void Game.toNext(newNext);
    },
    end(desc: string): string {
        return `_END&${desc}`;
    },
    async print(content: string | VNode, type: MessageType = 'story') {
        const message = useMessageStore();
        message.appendMessage(new ADVMessage(content, type));
        const emitter = useEmitter();
        await emitter.emit('wait-for-click-screen');
    },
    async showShopPanel() {
        const emitter = useEmitter();
        emitter.emit('open-shop');
        await emitter.emit('wait-close-shop');
    },
    async showSavePanel() {
        const emitter = useEmitter();
        emitter.emit('open-save');
        await emitter.emit('wait-close-save');
    },
};

function checkHasSameId(id: string) {
    const storyStore = useStoryStore();
    if (storyStore.usedSceneAndDialogId.has(id)) {
        Game.error(new RuntimeError(4, `There is already a dialog or scene with the ID '${id}'.`));
    }
    storyStore.usedSceneAndDialogId.add(id);
}

class ADVSceneBuilder {
    private readonly id: string;
    next(act: ADVUserNext = null): ADVChoiceBuilder {
        const storyStore = useStoryStore();
        storyStore.sceneMap.get(this.id)!.next = fromUserNectToNext(act);
        return new ADVChoiceBuilder(this.id);
    }
    build(): ADVScene {
        const storyStore = useStoryStore();
        return storyStore.sceneMap.get(this.id)!;
    }
    constructor(id: string) {
        this.id = id;
    }
}

class ADVDialogBuilder {
    private readonly id: string;
    next(act: ADVUserNext = null): ADVChoiceBuilder {
        const storyStore = useStoryStore();
        storyStore.dialogMap.get(this.id)!.next = fromUserNectToNext(act);
        return new ADVChoiceBuilder(this.id);
    }
    say(word: string | VNode): ADVDialogBuilder {
        const storyStore = useStoryStore();
        storyStore.dialogMap.get(this.id)!.script.push(word);
        return this;
    }
    build(): ADVDialog {
        const storyStore = useStoryStore();
        return storyStore.dialogMap.get(this.id)!;
    }
    constructor(id: string) {
        this.id = id;
    }
}

class ADVChoiceBuilder {
    private readonly id: string;
    choice(choice: ADVUserChoice): ADVChoiceBuilder {
        const storyStore = useStoryStore();
        let obj = storyStore.dialogMap.get(this.id)!;
        if (!Array.isArray(obj.next)) obj.next = [];
        obj.next.push(new ADVChoice(choice));
        return this;
    }

    build(): ADVDialog {
        const storyStore = useStoryStore();
        return storyStore.dialogMap.get(this.id)!;
    }

    constructor(id: string) {
        this.id = id;
    }
}
