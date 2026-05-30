import { type ADVNext, type VlAndFn } from '../data/model.ts';

/**
 * 解析给定的值或获取函数，并返回实际的值。
 *
 * 如果传入的是一个函数，则调用该函数并返回其结果；如果传入的是一个直接的值，则直接返回该值。
 *
 * @param valueOrGetter 可以是任何类型的值或者返回指定类型值的函数。
 * @returns 返回解析后的值，无论输入是直接值还是通过函数获取的值。
 */
export function RV<T>(valueOrGetter: VlAndFn<T>) {
    if (typeof valueOrGetter === 'function') {
        return (valueOrGetter as () => T)();
    }
    return valueOrGetter;
}
/**
 * 判断对象的类型
 * @param obj 要判断的对象
 * @returns 对应的类型字符串 'Array' | 'string' | 'Check'
 */
export function instanceType(obj: ADVNext): 'Array' | 'string' | 'Check' {
    if (typeof obj === 'string') return 'string';
    else if (Array.isArray(obj)) return 'Array';
    return 'Check';
}

export function formatDate(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const ss = date.getSeconds().toString().padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

export function formatDateWithMs(date: Date = new Date()): string {
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${formatDate(date)}.${ms}`;
}

// ============ 受限 Map 代理工厂 ============
export type MapProxy<T extends Record<string, any>> = {
    [K in keyof T]: T[K];
} & {
    size: number;
    has(key: keyof T): boolean;
    forEach(callback: (value: T[keyof T], key: keyof T) => void): void;
};

/**
 * 创建一个受限的 Map 代理：
 * - 只允许访问/修改预定义键
 * - 支持点语法 MP.id 读写，修改嵌套属性自动生效
 * - 对不存在的键抛出错误
 * - 使用：
 * ```
 * const backpack = createRestrictedMapProxy<Record<ItemIds, ADVUserItem>>(itemMap);
 * // 读取
 * console.log(backpack.Water.name);      // '水'
 * console.log(backpack.Water.count);     // 3
 *
 * // 修改嵌套属性
 * backpack.Water.count = 5;
 * console.log(itemMap.get('Water')?.count); // 5
 *
 * // 整体替换物品
 * backpack.Sword = { name: '黄金剑', count: 1, desc: '攻击力+20' };
 *
 * // 尝试访问不存在的键，运行时错误
 * // console.log(backpack.Potion); // Error: Key "Potion" is not allowed
 *
 * // 使用 Map 原生方法
 * console.log(backpack.size);          // 3
 * backpack.forEach((item, id) => {
 *   console.log(`${id}: ${item.name} x${item.count}`);
 * });
 * ```
 */
export function createRestrictedMapProxy<T extends Record<string, any>>(
    map: Map<keyof T, T[keyof T]>,
    beforeSet: (key: string, value: any) => any = (_, v) => v,
): MapProxy<T> {
    // 保存允许的键集合，用于运行时检查
    const allowedKeys = new Set(map.keys());

    return new Proxy(map, {
        // 读取属性：优先返回 Map 原生方法，否则作为 key 获取值
        get(target, prop, receiver) {
            if (prop === 'size') return target.size;
            if (prop === 'has') return (key: any) => target.has(key);
            if (prop === 'forEach') return target.forEach.bind(target);
            if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);

            const key = prop as string;
            if (!allowedKeys.has(key)) {
                throw new Error(`Key "${key}" is not allowed in this restricted map.`);
            }
            return target.get(key);
        },

        // 设置属性：只允许更新已存在的键，整体替换对象
        set(target, prop, value) {
            if (typeof prop !== 'string') return false;
            const key = prop;
            if (!allowedKeys.has(key)) {
                throw new Error(`Cannot set non-existent key "${key}".`);
            }
            value = beforeSet(key, value);
            value = target.set(key, value);
            return true;
        },

        // 让 Object.keys / for...in 枚举出所有允许的键
        ownKeys(target) {
            return Array.from(target.keys()) as string[];
        },

        // 描述符，使属性可枚举以支持智能提示
        getOwnPropertyDescriptor(target, prop) {
            if (typeof prop === 'string' && allowedKeys.has(prop)) {
                return {
                    enumerable: true,
                    configurable: true,
                    value: target.get(prop),
                };
            }
            return undefined;
        },
    }) as unknown as MapProxy<T>;
}
// ==================================================================
