import {
    type ADVBattle,
    ADVCElif,
    ADVCElse,
    ADVCEnd,
    ADVCharacter,
    ADVCIf,
    type ADVCReturn,
    ADVUserCharacter,
    ADVUserCheck,
    ADVUserDialog,
    ADVUserGoods,
    ADVUserItem,
    type ADVUserNext,
    ADVUserScene,
    ADVUserStatusGroup,
    type MessageType,
} from '../data/model.ts';
import gameConfig from '../../../src/game.config.ts';
import type { MapProxy } from '../utils/util.ts';
import { ADVDialogBuilder, ADVRecipeController, type ADVSceneBuilder } from '../api.ts';
import type { useAudioStore } from '../store/audio.ts';
import type { ClueItem } from '../store/clue.ts';

type RecordWithoutId<V> = {
    [key: string]: V; // 允许任意字符串键
} & {
    id?: never; // 显式禁止 'id' 键（其值必须是 never/undefined）
};

/** 线索专题配置 */
export interface ADVUserClueSubject {
    name: string;
}

/** 线索专题代理（每个专题提供 add/set/rm 方法，并可通过索引访问 ClueItem[]） */
export interface ClueSubjectProxy {
    add(content: string, id?: string): string;
    set(id: string, content: string): void;
    rm(id: string): boolean;
    /** 获取该专题下所有线索（用于迭代/展示） */
    readonly items: ClueItem[];
}

// ========== 基础类型（唯一定义处） ==========
export interface GameConfig {
    items?: RecordWithoutId<ADVUserItem>;
    status?: Record<string, ADVUserStatusGroup>;
    character?: Record<string, ADVUserCharacter>;
    mainScene: string;
    gameName?: string;
    judgmentMode?: 'd20' | 'percent';
    clue?: RecordWithoutId<ADVUserClueSubject>;
    time?: {
        /** 游戏开始时间，格式 'YYYY-MM-DD HH:mm'，如 '1925-09-12 08:00' */
        start: string;
        /** 是否在状态栏显示日期（MM-DD），默认 false */
        showDate?: boolean;
    };
    menu?: {
        bag?: boolean;
        attu?: boolean;
        shop?: boolean;
        save?: boolean;
        story?: boolean;
    };
}

// ========== 工具类型 ==========
export type IdsOf<T, K extends string> = T[K] extends Record<string, any> ? keyof T[K] : string;

export type StatusAttrIds<T extends GameConfig> =
    T['status'] extends Record<string, any>
        ? {
              [K in keyof NonNullable<T['status']>]: NonNullable<T['status']>[K] extends {
                  content: infer C;
              }
                  ? keyof C
                  : string;
          }[keyof NonNullable<T['status']>]
        : string;

type ValueOf<T> = T[keyof T];

/** 从配置中提取指定 status key 的精确类型（number 或 string），由 value 字段推断 */
export type ExtractStatusValueType<TConfig extends GameConfig, K extends string> =
    TConfig['status'] extends Record<string, any>
        ? ValueOf<{
              [G in keyof NonNullable<TConfig['status']>]: NonNullable<
                  TConfig['status']
              >[G] extends {
                  content: infer C;
              }
                  ? C extends Record<string, any>
                      ? K extends keyof C
                          ? C[K] extends { value: infer V }
                              ? V extends number
                                  ? number
                                  : V extends string
                                    ? string
                                    : number
                              : number
                          : never
                      : never
                  : never;
          }>
        : number;

/** 每个 status key 到其精确类型的映射 */
type StatusValueMap = {
    [K in StatusIds]: ExtractStatusValueType<typeof gameConfig, K>;
};

// ========== 提取 ID 类型（依然可用） ==========
type ItemIds = IdsOf<typeof gameConfig, 'items'>;
export type StatusIds = StatusAttrIds<typeof gameConfig>;
type CharsIds = IdsOf<typeof gameConfig, 'character'>;
export type ClueIds = IdsOf<typeof gameConfig, 'clue'>;

// ========== 状态值访问器 ==========
/** 对 number 型状态的增强访问器。通过 `number & { ... }` 交叉类型使得 TypeScript 同时将其视为 number。 */
export type StatusValueAccessor = number & {
    /** 当前总值（base + bonus），只读 */
    readonly value: number;
    /** 基础值，可读写 */
    base: number;
    /** 加值，可读写 */
    bonus: number;
    /** CoC 困难成功阈值：Math.floor(总值 / 2)，只读 */
    readonly hard: number;
    /** CoC 极难成功阈值：Math.floor(总值 / 5)，只读 */
    readonly extreme: number;
};

// ========== 状态代理 ==========
/**
 * number 型返回 StatusValueAccessor（可当 number 使用），string 型返回 string。
 *
 * 推荐写法：Adv.status.FastTalk.hard（新）
 * 兼容写法：Adv.status.hard.FastTalk（旧，仍可用）
 */
export type StatusProxy = {
    [K in StatusIds]: StatusValueMap[K] extends string ? string : StatusValueAccessor;
} & {
    /** @deprecated 旧语法，推荐使用 Adv.status.xxx.base */
    base: Record<StatusIds, number>;
    /** @deprecated 旧语法，推荐使用 Adv.status.xxx.bonus */
    bonus: Record<StatusIds, number>;
    /** @deprecated 旧语法，推荐使用 Adv.status.xxx.hard */
    hard: Record<StatusIds, number>;
    /** @deprecated 旧语法，推荐使用 Adv.status.xxx.extreme */
    extreme: Record<StatusIds, number>;
};

interface IAdv {
    get bag(): MapProxy<Record<ItemIds, number>>;
    get status(): StatusProxy;
    get char(): MapProxy<Record<CharsIds, ADVCharacter>>;
    get goods(): MapProxy<Record<ItemIds, number>>;
    get clue(): MapProxy<Record<ClueIds, ClueSubjectProxy>>;
    get audio(): ReturnType<typeof useAudioStore>;
    get time(): TimeAPI;
    recipeControl(id: ItemIds): ADVRecipeController;
    defineConfig<TConfig extends GameConfig>(config: TConfig): TConfig;
    defineRecipe(id: ItemIds, gd: ADVUserGoods): void;
    appendScene(id: string, config: ADVUserScene): ADVSceneBuilder;
    appendDialog(id: string, config: ADVUserDialog): ADVDialogBuilder;
    goto(next: ADVUserNext): void;
    ending(desc: string): string;
    print(content: MessageContentType, type?: MessageType): Promise<void>;
    showShopPanel(): Promise<void>;
    showSavePanel(): Promise<void>;
    check(check: ADVUserCheck): Promise<{ res: boolean; nat: number; dirty: number }>;
    if(condition: () => boolean | Promise<boolean>): ADVCIf;
    elif(condition: () => boolean | Promise<boolean>): ADVCElif;
    else(): ADVCElse;
    end(): ADVCEnd;
    return(): ADVCReturn;
    startBattle(setting: ADVBattle): Promise<boolean | 'flee'>;
}

// ========== 时间系统 API ==========
export interface TimeAPI {
    /**
     * 推进游戏内时间
     * @param minutes 要增加的分钟数（正整数）
     */
    advance(minutes: number): void;
    /**
     * 当前时间字符串（不带秒）
     * 状态栏显示用：根据配置可能是 "HH:MM" 或 "MM-DD HH:MM"
     */
    readonly str: string;
    /** 完整日期时间字符串 "YYYY-MM-DD HH:MM 星期X"，用于 Menu Story 展示 */
    readonly full: string;
}
