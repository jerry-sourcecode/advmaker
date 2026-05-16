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
    ADVUserDialog,
    type ADVUserNext,
    ADVUserScene,
    type MessageType,
} from './data/model.ts';
import { useStateStore } from './store/state.ts';
import { useMessageStore } from './store/message.ts';
import type { VNode } from 'vue';
import { Game, RuntimeError } from './game.ts';
import type { CharsIds, ItemIds, StatusIds } from './type/user';
import { createRestrictedMapProxy, type MapProxy } from './utils/util.ts';
import { useEmitter } from './store/emitter.ts';

let backpackCache: MapProxy<Record<ItemIds, number>> | null = null;
let statusCache: MapProxy<Record<StatusIds, number>> | null = null;
let charsCache: MapProxy<Record<CharsIds, ADVCharacter>> | null = null;

export const ADVMaker = {
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

window.ADVMaker = ADVMaker;

function checkHasSameId(id: string) {
    const storyStore = useStoryStore();
    if (storyStore.usedSceneAndDialogId.has(id)) {
        Game.error(new RuntimeError(4, `There is already a dialog or scene with the ID '${id}'.`));
    }
    storyStore.usedSceneAndDialogId.add(id);
}
