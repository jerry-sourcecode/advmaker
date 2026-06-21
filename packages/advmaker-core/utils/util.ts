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

export class BoundedQueue<T> {
    private queue: T[];
    readonly maxSize: number;

    /**
     * @param maxSize 队列允许的最大长度，必须为正整数
     */
    constructor(maxSize: number) {
        if ((!Number.isInteger(maxSize) && Number.isFinite(maxSize)) || maxSize <= 0) {
            throw new Error('maxSize must be a positive integer');
        }
        this.maxSize = maxSize;
        this.queue = [];
    }

    /** 当前队列中的元素个数 */
    get size(): number {
        return this.queue.length;
    }

    /** 队列是否为空 */
    isEmpty(): boolean {
        return this.size === 0;
    }

    /** 队列是否已满 */
    isFull(): boolean {
        return this.size >= this.maxSize;
    }

    /** 查看队头元素（不删除） */
    peek(): T | undefined {
        return this.queue[0];
    }

    /** 入队：若已满则自动移除最早的元素，再添加新元素 */
    push(item: T): void {
        if (this.isFull()) {
            this.pop(); // 移除最旧元素
        }
        this.queue.push(item);
    }

    /** 出队：移除并返回队头元素 */
    pop(): T | undefined {
        return this.queue.shift();
    }

    /** 清空队列 */
    clear(): void {
        this.queue = [];
    }

    /** 返回队列的浅拷贝数组 */
    toArray(): T[] {
        return [...this.queue];
    }

    peekLast(): T | undefined {
        return this.queue[this.size - 1];
    }
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

export class Stack<T> {
    private items: T[] = [];

    /** 入栈 */
    push(element: T): void {
        this.items.push(element);
    }

    /** 出栈，返回栈顶元素，栈为空时抛出异常 */
    pop(): T {
        if (this.isEmpty()) {
            throw new Error('Stack is empty');
        }
        return this.items.pop()!;
    }

    /** 查看栈顶元素（不出栈） */
    peek(): T | undefined {
        return this.items[this.items.length - 1];
    }

    /** 栈大小 */
    get size(): number {
        return this.items.length;
    }

    /** 是否为空 */
    isEmpty(): boolean {
        return this.items.length === 0;
    }

    /** 清空栈 */
    clear(): void {
        this.items = [];
    }

    /** 转换为数组（从栈底到栈顶） */
    toArray(): T[] {
        return [...this.items];
    }
}

const IfState = {
    NORMAL: 'NORMAL',
    EXECUTING: 'EXECUTING',
    SKIPPING: 'SKIPPING',
    BLOCK_CONSUMED: 'BLOCK_CONSUMED',
} as const;

type IfState = 'NORMAL' | 'EXECUTING' | 'SKIPPING' | 'BLOCK_CONSUMED';

export class IfStateManager {
    private stateStack = new Stack<IfState>();

    constructor() {
        // 默认最外层为 NORMAL
        this.stateStack.push(IfState.NORMAL);
    }

    get currentState(): IfState {
        return this.stateStack.peek()!;
    }

    private setCurrentState(state: IfState): void {
        this.stateStack.pop();
        this.stateStack.push(state);
    }

    /** 进入一个新的 if 块 */
    enterIf(condition: boolean): void {
        // 预留新层
        if (condition) {
            this.stateStack.push(IfState.EXECUTING);
        } else {
            this.stateStack.push(IfState.SKIPPING);
        }
    }

    /** 遇到 else（无条件） */
    enterElse(): void {
        const state = this.currentState;
        if (state === IfState.EXECUTING) {
            this.setCurrentState(IfState.BLOCK_CONSUMED);
        } else if (state === IfState.SKIPPING) {
            this.setCurrentState(IfState.EXECUTING);
        }
        // BLOCK_CONSUMED 时不变
    }

    /** 遇到 else if */
    enterElseIf(condition: boolean): void {
        const state = this.currentState;
        if (state === IfState.EXECUTING) {
            this.setCurrentState(IfState.BLOCK_CONSUMED);
        } else if (state === IfState.SKIPPING) {
            if (condition) {
                this.setCurrentState(IfState.EXECUTING);
            }
            // 否则保持 SKIPPING
        }
        // BLOCK_CONSUMED 时不变
    }

    /** 退出当前 if 块（endif） */
    exitIf(): void {
        if (this.stateStack.size <= 1) {
            throw new Error('Unmatched endif');
        }
        this.stateStack.pop();
    }

    /** 当前指令是否应当执行 */
    shouldExecute(): boolean {
        const state = this.currentState;
        return (
            state === IfState.EXECUTING || (state === IfState.NORMAL && this.stateStack.size === 1)
        );
    }
}
