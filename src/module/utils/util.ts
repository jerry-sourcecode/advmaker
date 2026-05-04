import { type ADVNext, type VlAndFn } from '../data/model.ts';

/**
 * 解析给定的值或获取函数，并返回实际的值。
 *
 * 如果传入的是一个函数，则调用该函数并返回其结果；如果传入的是一个直接的值，则直接返回该值。
 *
 * @param valueOrGetter 可以是任何类型的值或者返回指定类型值的函数。
 * @returns 返回解析后的值，无论输入是直接值还是通过函数获取的值。
 */
export function RV<T>(valueOrGetter: VlAndFn<T>): T {
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
