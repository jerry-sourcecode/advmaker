import {
    type ADVBattle,
    ADVCElif,
    ADVCElse,
    ADVCEnd,
    ADVCharacter,
    ADVCIf,
    type ADVCReturn,
    ADVIf,
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

// ========== 状态代理 ==========
/** number 型返回 number，string 型返回 string；.base/.bonus 子代理读写基础值和加值 */
export type StatusProxy = StatusValueMap & {
    base: Record<StatusIds, number>;
    bonus: Record<StatusIds, number>;
};

interface IAdv {
    get bag(): MapProxy<Record<ItemIds, number>>;
    get status(): StatusProxy;
    get char(): MapProxy<Record<CharsIds, ADVCharacter>>;
    get goods(): MapProxy<Record<ItemIds, number>>;
    get clue(): MapProxy<Record<ClueIds, ClueSubjectProxy>>;
    get audio(): ReturnType<typeof useAudioStore>;
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
