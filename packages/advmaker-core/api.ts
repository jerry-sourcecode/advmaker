/**、
 * 这个文件用于处理提供给用户的API
 */

import { useStoryStore } from './store/story.ts';
import {
    ADVCElif,
    ADVCElse,
    ADVCEnd,
    ADVCharacter,
    ADVCheck,
    ADVChoice,
    ADVCIf,
    ADVCommand,
    ADVCReturn,
    ADVDialog,
    ADVGoods,
    ADVMessage,
    type ADVNext,
    type ADVRecipe,
    ADVScene,
    ADVUserCheck,
    ADVUserChoice,
    ADVUserDialog,
    ADVUserGoods,
    type ADVUserNext,
    ADVUserScene,
    fromUserNextToNext,
    type MessageContentType,
    type MessageType,
} from './data/model.ts';
import { useStateStore } from './store/state.ts';
import { useMessageStore } from './store/message.ts';
import { Game, RuntimeError } from './game.ts';
import type { CharsIds, GameConfig, IAdv, ItemIds, StatusIds } from './type/user';
import { createRestrictedMapProxy, type MapProxy, RV } from './utils/util.ts';
import { useEmitter } from './store/emitter.ts';
import { dice } from './utils/dice.ts';
import { useAudioStore } from './store/audio.ts';

let backpackCache: MapProxy<Record<ItemIds, number>> | null = null;
let statusCache: MapProxy<Record<StatusIds, number>> | null = null;
let charsCache: MapProxy<Record<CharsIds, ADVCharacter>> | null = null;
let goodsCache: MapProxy<Record<ItemIds, number>> | null = null;

export const Adv: IAdv = {
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
    get goods() {
        if (!goodsCache) {
            const stateStore = useStateStore();
            goodsCache = createRestrictedMapProxy<Record<ItemIds, number>>(stateStore.shop);
        }
        return goodsCache;
    },
    get audio() {
        return useAudioStore();
    },
    recipeControl(id: ItemIds) {
        return new ADVRecipeController(id);
    },
    defineConfig<TConfig extends GameConfig>(config: TConfig): TConfig {
        const storyStore = useStoryStore();
        storyStore.storyConfigObj = config;
        return config;
    },
    defineRecipe(id: ItemIds, gd: ADVUserGoods) {
        const obj = new ADVGoods(gd, id);
        if (obj.need.length === 0) {
            Game.error(new RuntimeError(5, `No recipe for goods id ${id}.`));
        }
        const stateStore = useStateStore();
        if (stateStore.goodsMap.has(id)) {
            this.recipeControl(id).defineRecipe(...obj.need);
        } else stateStore.goodsMap.set(id, obj);
        stateStore.shop.set(id, obj.default);
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
        } else newNext = next;
        void Game.toNext(newNext);
    },
    ending(desc: string): string {
        return `__END&${desc}`;
    },
    async print(content: MessageContentType, type: MessageType = 'story') {
        const message = useMessageStore();
        if (content instanceof ADVCommand) {
            if (content.type === 'else') {
                message.ifState.enterElse();
                return;
            } else if (content.type === 'end') {
                message.ifState.exitIf();
                return;
            } else if (content.type === 'elif') {
                message.ifState.enterElseIf(content.call!());
            }
        }
        if (!message.ifState.shouldExecute()) return;
        if (typeof content === 'function') await content();
        else if (Array.isArray(content)) {
            await Game.choice(content);
        } else if (content instanceof ADVCommand) {
            if (content.type === 'if') message.ifState.enterIf(await (content as ADVCIf).call());
        } else {
            if (content !== null) message.appendMessage(new ADVMessage(content, type));
            const emitter = useEmitter();
            await emitter.emit('wait-for-click-screen');
        }
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
    async check(check: ADVUserCheck) {
        const checker = new ADVCheck(check);
        const storyStore = useStoryStore();

        function isSucc(pt: number, dc: number) {
            if (storyStore.judgmentMode === 'd20') return pt >= dc;
            else return pt <= dc;
        }

        let dc = storyStore.diceInit(checker.dice);
        let pt = 0;
        let dc_name;
        if (typeof dc === 'object') {
            pt = dc.roll();
            dc_name = dc.name;
        } else {
            pt = dice(dc);
            dc_name = dc;
        }

        const ori = pt;

        const desc = checker.targetDesc !== '' ? checker.targetDesc + '，' : '';

        let tip = '';
        checker.modifier.forEach((v) => {
            const offset = v.value();
            pt += offset;
            tip += ` | ${v.name}`;
            if (offset >= 0) tip += ` <b>+${offset}</b>`;
            else tip += ` <b>${offset}</b>`;
        });

        const res = RV(checker.target);
        if (isSucc(pt, res)) {
            await Adv.print(
                `检定成功！${desc}目标 ${res} 点，【投掷 ${dc_name}】<b>${ori}</b>${tip}${tip === '' ? '' : ` =<b>${pt}</b>`} 点。`,
                'system',
            );
            await checker.onSuccess();
            await Game.toNext(checker.success);
            return true;
        } else {
            await Adv.print(
                `检定失败！${desc}目标 ${res} 点，【投掷 ${dc_name}】<b>${ori}</b>${tip}${tip === '' ? '' : ` =<b>${pt}</b>`} 点。`,
                'system',
            );
            await checker.onFail();
            await Game.toNext(checker.success);
            return false;
        }
    },
    if(condition: () => boolean | Promise<boolean>) {
        return new ADVCIf(condition);
    },
    else() {
        return new ADVCElse();
    },
    end() {
        return new ADVCEnd();
    },
    elif(condition: () => boolean | Promise<boolean>) {
        return new ADVCElif(condition);
    },
    return() {
        return new ADVCReturn();
    }
};

function checkHasSameId(id: string) {
    const storyStore = useStoryStore();
    if (storyStore.usedSceneAndDialogId.has(id)) {
        Game.error(new RuntimeError(4, `There is already a dialog or scene with the ID '${id}'.`));
    }
    storyStore.usedSceneAndDialogId.add(id);
}

export class ADVSceneBuilder {
    private readonly id: string;
    next(act: ADVUserNext = null): ADVChoiceBuilder {
        const storyStore = useStoryStore();
        storyStore.sceneMap.get(this.id)!.next = fromUserNextToNext(act);
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

export class ADVDialogBuilder {
    private readonly id: string;
    next(act: ADVUserNext = null): ADVChoiceBuilder {
        const storyStore = useStoryStore();
        storyStore.dialogMap.get(this.id)!.next = fromUserNextToNext(act);
        return new ADVChoiceBuilder(this.id);
    }
    say(word: MessageContentType = null): ADVDialogBuilder {
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

export class ADVChoiceBuilder {
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

export class ADVRecipeController {
    private readonly id: string;
    removeRecipe(recId: string) {
        const stateStore = useStateStore();
        const x = stateStore.goodsMap.get(this.id)!;
        x.need = x.need.filter((v) => {
            return v.id !== recId;
        });
        if (x.need.length === 0) {
            Game.error(new RuntimeError(5, `No recipe for goods id ${this.id}.`));
        }
    }
    defineRecipe(...rec: ADVRecipe[]) {
        const stateStore = useStateStore();
        stateStore.goodsMap.get(this.id)?.need.push(...rec);
    }
    constructor(id: ItemIds) {
        this.id = id;
    }
}
