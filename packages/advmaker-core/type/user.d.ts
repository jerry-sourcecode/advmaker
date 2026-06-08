import {
    ADVCharacter,
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
import type { VNode } from 'vue';
import { ADVDialogBuilder, ADVRecipeController, type ADVSceneBuilder } from '../api.ts';
import type { useAudioStore } from '../store/audio.ts';

type RecordWithoutId<V> = {
    [key: string]: V; // 允许任意字符串键
} & {
    id?: never; // 显式禁止 'id' 键（其值必须是 never/undefined）
};

// ========== 基础类型（唯一定义处） ==========
export interface GameConfig {
    items?: RecordWithoutId<ADVUserItem>;
    status?: Record<string, ADVUserStatusGroup>;
    character?: Record<string, ADVUserCharacter>;
    mainScene: string;
    gameName?: string;
    judgmentMode?: 'd20' | 'percent';
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

// ========== 提取 ID 类型（依然可用） ==========
type ItemIds = IdsOf<typeof gameConfig, 'items'>;
type StatusIds = StatusAttrIds<typeof gameConfig>;
type CharsIds = IdsOf<typeof gameConfig, 'character'>;

interface IAdv {
    get bag(): MapProxy<Record<ItemIds, number>>;
    get status(): MapProxy<Record<StatusIds, number>>;
    get char(): MapProxy<Record<CharsIds, ADVCharacter>>;
    get goods(): MapProxy<Record<ItemIds, number>>;
    get audio(): ReturnType<typeof useAudioStore>;
    recipeControl(id: ItemIds): ADVRecipeController;
    defineConfig<TConfig extends GameConfig>(config: TConfig): TConfig;
    defineRecipe(id: ItemIds, gd: ADVUserGoods): void;
    appendScene(id: string, config: ADVUserScene): ADVSceneBuilder;
    appendDialog(id: string, config: ADVUserDialog): ADVDialogBuilder;
    goto(next: ADVUserNext): void;
    end(desc: string): string;
    print(content: MessageContentType, type?: MessageType): Promise<void>;
    showShopPanel(): Promise<void>;
    showSavePanel(): Promise<void>;
    check(check: ADVUserCheck): Promise<boolean>;
}
