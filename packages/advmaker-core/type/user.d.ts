import { ADVUserCharacter, ADVUserGoods, ADVUserItem, ADVUserStatusGroup } from '../data/model.ts';
import gameConfig from '../../../src/game.config.ts';
// ========== 基础类型（唯一定义处） ==========
export interface GameConfig {
    items?: Record<string, ADVUserItem>;
    status?: Record<string, ADVUserStatusGroup>;
    goods?: Record<string, ADVUserGoods>;
    character?: Record<string, ADVUserCharacter>;
    mainScene: string;
    gameName?: string;
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
type GoodsIds = IdsOf<typeof gameConfig, 'goods'>;
type StatusIds = StatusAttrIds<typeof gameConfig>;
type CharsIds = IdsOf<typeof gameConfig, 'character'>;
