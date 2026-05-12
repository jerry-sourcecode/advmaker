import { ADVUserCharacter, ADVUserGoods, ADVUserItem, ADVUserStatusGroup } from '../data/model.ts';
import gameConfig from '../../game.config.ts';

export type GameConfig = {
    // 物品
    items?: {
        // id 为物品的唯一标识符
        [id: string]: ADVUserItem;
    };
    status?: {
        [id: string]: ADVUserStatusGroup;
    };
    goods?: {
        [id: string]: ADVUserGoods;
    };
    character?: {
        [id: string]: ADVUserCharacter;
    };
    // 游戏入口，一个场景
    mainScene: string;
    // 游戏名称
    gameName?: string;
};

/**
 * 该类型用于从游戏配置对象中提取特定键的标识符。
 * @template T - 游戏配置对象的类型。
 * @template K - 配置对象中要提取标识符的键名，必须是字符串字面量类型。
 * 如果指定的键对应一个对象（即 Record<string, any>），则返回该对象的所有键名组成的联合类型。
 * 若指定键被省略，退化为 string 类型。
 */
export type IdsOf<T extends GameConfig, K extends string> =
    T[K] extends Record<string, any> ? keyof T[K] : string;

type StatusAttrIds<T extends GameConfig> =
    T['status'] extends Record<string, any>
        ? {
              [K in keyof NonNullable<T['status']>]: NonNullable<T['status']>[K] extends {
                  content: infer C;
              }
                  ? keyof C
                  : string;
          }[keyof NonNullable<T['status']>]
        : string;

type ItemIds = IdsOf<typeof gameConfig, 'items'>;
type StatusIds = StatusAttrIds<typeof gameConfig>;
type GoodsIds = IdsOf<typeof gameConfig, 'goods'>;
type CharsIds = IdsOf<typeof gameConfig, 'character'>;
