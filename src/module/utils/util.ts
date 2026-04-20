import { type ADVNext } from '../data/model.ts';

/**
 * 如果提供一个变量，返回变量
 * 如果提供函数，返回函数运行的值
 * @param valueOrGetter
 */
export async function resolveValueAsync<T>(
    valueOrGetter: T | (() => T) | (() => Promise<T>) | Promise<T>,
): Promise<T> {
    if (typeof valueOrGetter === 'function') {
        const result = (valueOrGetter as () => T | Promise<T>)();
        return result instanceof Promise ? result : Promise.resolve(result);
    }
    return Promise.resolve(valueOrGetter);
}
export function resolveValue<T>(valueOrGetter: T | (() => T)): T {
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
