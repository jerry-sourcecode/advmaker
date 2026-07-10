/**、
 * 这个文件用于处理提供给用户的API
 */

import { useStoryStore } from './store/story.ts';
import {
    type ADVBattle,
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
import type {
    CharsIds,
    ClueSubjectProxy,
    GameConfig,
    IAdv,
    TimeAPI,
    ItemIds,
    StatusIds,
    ClueIds,
    StatusProxy,
    StatusValueAccessor,
} from './type/user';
import { createRestrictedMapProxy, type MapProxy, RV } from './utils/util.ts';
import { useEmitter } from './store/emitter.ts';
import { dice } from './utils/dice.ts';
import { useAudioStore } from './store/audio.ts';
import { useBattleStore } from './store/battle.ts';
import { useClueStore } from './store/clue.ts';
import { useTimeStore } from './store/time.ts';

let backpackCache: MapProxy<Record<ItemIds, number>> | null = null;
let statusCache: StatusProxy | null = null;
let statusBaseProxy: StatusProxy | null = null;
let statusBonusProxy: StatusProxy | null = null;
let statusHardProxy: StatusProxy | null = null;
let statusExtremeProxy: StatusProxy | null = null;
let charsCache: MapProxy<Record<CharsIds, ADVCharacter>> | null = null;
let goodsCache: MapProxy<Record<ItemIds, number>> | null = null;
let clueCache: MapProxy<Record<ClueIds, ClueSubjectProxy>> | null = null;
/** 每个 status 的访问器缓存，确保 Adv.status.FastTalk === Adv.status.FastTalk */
const statusAccessorCache = new Map<StatusIds, StatusValueAccessor>();

/**
 * 为指定 status id 创建增强访问器对象。
 * 该对象可当 number 使用（valueOf/toString/Symbol.toPrimitive），
 * 同时提供 .value / .base / .bonus / .hard / .extreme 属性。
 */
function createStatusValueAccessor(
    id: StatusIds,
    stateStore: ReturnType<typeof useStateStore>,
): StatusValueAccessor {
    function getRaw(): { base: number; bonus: number } | string | undefined {
        return stateStore.getStatusRaw(id);
    }
    function getTotal(): number {
        const raw = getRaw();
        if (typeof raw === 'object' && raw !== null) return raw.base + raw.bonus;
        return 0;
    }

    return {
        get value() {
            return getTotal();
        },
        get base() {
            const raw = getRaw();
            return typeof raw === 'object' && raw !== null ? raw.base : 0;
        },
        set base(v: number) {
            stateStore.setStatusBase(id, v);
        },
        get bonus() {
            const raw = getRaw();
            return typeof raw === 'object' && raw !== null ? raw.bonus : 0;
        },
        set bonus(v: number) {
            stateStore.setStatusBonus(id, v);
        },
        get hard() {
            return Math.floor(getTotal() / 2);
        },
        get extreme() {
            return Math.floor(getTotal() / 5);
        },
        valueOf(): number {
            return getTotal();
        },
        toString(): string {
            return String(getTotal());
        },
        [Symbol.toPrimitive](hint: string): number | string {
            const total = getTotal();
            if (hint === 'string') return String(total);
            return total;
        },
    } as unknown as StatusValueAccessor;
}

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
            const allowedKeys = new Set(stateStore.status.keys());

            // 子代理：base
            if (!statusBaseProxy) {
                statusBaseProxy = new Proxy({} as StatusProxy, {
                    get(_, prop: string) {
                        const raw = stateStore.getStatusRaw(prop as StatusIds);
                        if (typeof raw === 'object' && raw !== null) return raw.base;
                        return 0;
                    },
                    set(_, prop: string, value: number) {
                        stateStore.setStatusBase(prop as StatusIds, value);
                        return true;
                    },
                    ownKeys() {
                        return Array.from(allowedKeys);
                    },
                    getOwnPropertyDescriptor(_, prop) {
                        if (typeof prop === 'string' && allowedKeys.has(prop as StatusIds))
                            return { enumerable: true, configurable: true };
                        return undefined;
                    },
                }) as StatusProxy;
            }
            // 子代理：bonus
            if (!statusBonusProxy) {
                statusBonusProxy = new Proxy({} as StatusProxy, {
                    get(_, prop: string) {
                        const raw = stateStore.getStatusRaw(prop as StatusIds);
                        if (typeof raw === 'object' && raw !== null) return raw.bonus;
                        return 0;
                    },
                    set(_, prop: string, value: number) {
                        stateStore.setStatusBonus(prop as StatusIds, value);
                        return true;
                    },
                    ownKeys() {
                        return Array.from(allowedKeys);
                    },
                    getOwnPropertyDescriptor(_, prop) {
                        if (typeof prop === 'string' && allowedKeys.has(prop as StatusIds))
                            return { enumerable: true, configurable: true };
                        return undefined;
                    },
                }) as StatusProxy;
            }
            // 子代理：hard（困难成功 = 总值 / 2，向下取整，只读）
            if (!statusHardProxy) {
                statusHardProxy = new Proxy({} as StatusProxy, {
                    get(_, prop: string) {
                        const raw = stateStore.getStatusRaw(prop as StatusIds);
                        if (typeof raw === 'object' && raw !== null)
                            return Math.floor((raw.base + raw.bonus) / 2);
                        if (typeof raw === 'string') return 0;
                        return 0;
                    },
                    set() {
                        return false;
                    },
                    ownKeys() {
                        return Array.from(allowedKeys);
                    },
                    getOwnPropertyDescriptor(_, prop) {
                        if (typeof prop === 'string' && allowedKeys.has(prop as StatusIds))
                            return { enumerable: true, configurable: true };
                        return undefined;
                    },
                }) as StatusProxy;
            }
            // 子代理：extreme（极难成功 = 总值 / 5，向下取整，只读）
            if (!statusExtremeProxy) {
                statusExtremeProxy = new Proxy({} as StatusProxy, {
                    get(_, prop: string) {
                        const raw = stateStore.getStatusRaw(prop as StatusIds);
                        if (typeof raw === 'object' && raw !== null)
                            return Math.floor((raw.base + raw.bonus) / 5);
                        if (typeof raw === 'string') return 0;
                        return 0;
                    },
                    set() {
                        return false;
                    },
                    ownKeys() {
                        return Array.from(allowedKeys);
                    },
                    getOwnPropertyDescriptor(_, prop) {
                        if (typeof prop === 'string' && allowedKeys.has(prop as StatusIds))
                            return { enumerable: true, configurable: true };
                        return undefined;
                    },
                }) as StatusProxy;
            }

            statusCache = new Proxy({} as StatusProxy, {
                get(_, prop: string) {
                    if (prop === 'base') return statusBaseProxy;
                    if (prop === 'bonus') return statusBonusProxy;
                    if (prop === 'hard') return statusHardProxy;
                    if (prop === 'extreme') return statusExtremeProxy;
                    if (!allowedKeys.has(prop as StatusIds)) {
                        throw new Error(`Status "${prop}" is not defined.`);
                    }
                    const id = prop as StatusIds;
                    const raw = stateStore.getStatusRaw(id);
                    if (typeof raw === 'string') return raw;
                    // number 型：返回增强访问器（带缓存，可当 number 使用）
                    let accessor = statusAccessorCache.get(id);
                    if (!accessor) {
                        accessor = createStatusValueAccessor(id, stateStore);
                        statusAccessorCache.set(id, accessor);
                    }
                    return accessor;
                },
                set(_, prop: string, value: any) {
                    const id = prop as StatusIds;
                    const obj = storyStore.statusMap.get(id);
                    if (!obj) return false;
                    // string 型
                    if (typeof obj.value === 'string') {
                        if (typeof value !== 'string') {
                            Game.error(
                                new RuntimeError(
                                    7,
                                    `Status "${id}" is a string type, cannot assign number.`,
                                ),
                            );
                        }
                        stateStore.status.set(id, value);
                        return true;
                    }
                    // number 型：设置总值
                    if (typeof value === 'number') {
                        stateStore.setStatusTotal(id, value);
                    } else if (
                        value &&
                        typeof value === 'object' &&
                        'base' in value &&
                        'bonus' in value
                    ) {
                        stateStore.setStatusBase(id, value.base);
                        stateStore.setStatusBonus(id, value.bonus);
                    }
                    return true;
                },
                ownKeys() {
                    return Array.from(allowedKeys);
                },
                getOwnPropertyDescriptor(_, prop) {
                    if (typeof prop === 'string' && allowedKeys.has(prop as StatusIds)) {
                        return { enumerable: true, configurable: true };
                    }
                    return undefined;
                },
            }) as StatusProxy;
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
    get clue() {
        if (!clueCache) {
            const clueStore = useClueStore();
            clueCache = createRestrictedMapProxy<Record<ClueIds, ClueSubjectProxy>>(
                clueStore.subjectProxyMap,
            );
        }
        return clueCache;
    },
    get audio() {
        return useAudioStore();
    },
    get time(): TimeAPI {
        const timeStore = useTimeStore();
        const stateStore = useStateStore();
        return {
            advance(minutes: number) {
                if (!timeStore.enabled) return;
                timeStore.advance(minutes);
                stateStore.status.set('__time__' as StatusIds, timeStore.barStr);
            },
            get str() {
                return timeStore.enabled ? timeStore.barStr : '';
            },
            get full() {
                return timeStore.enabled ? timeStore.fullStr : '';
            },
        };
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
        const battleStore = useBattleStore();
        const emitter = useEmitter();
        if (battleStore.isBattle) {
            if (typeof content === 'string') battleStore.appendLog(content);
            else throw 'Wrong Type, expect string only.';
            emitter.emit('scroll-to-end');
            return;
        }
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
            return { res: true, nat: ori, dirty: pt };
        } else {
            await Adv.print(
                `检定失败！${desc}目标 ${res} 点，【投掷 ${dc_name}】<b>${ori}</b>${tip}${tip === '' ? '' : ` =<b>${pt}</b>`} 点。`,
                'system',
            );
            await checker.onFail();
            await Game.toNext(checker.fail);
            return { res: false, nat: ori, dirty: pt };
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
    },
    async startBattle(setting: ADVBattle) {
        const battleStore = useBattleStore();
        battleStore.isBattle = true;
        battleStore.setting = setting;
        this.print('你遭遇了敌人。');
        const order = setting.initiativeOrder(battleStore.setting.enemies);
        order.forEach((v) => battleStore.queue.push(v));
        await battleStore.next(true);
        return new Promise<boolean | 'flee'>((res) => {
            const emitter = useEmitter();
            emitter.on('battle-over', (r) => {
                battleStore.isBattle = false;
                battleStore.result = r;
                res(r);
            });
        });
    },
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
            return v.id !== recId as any;
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
