import { ADVCheck, ADVDialog, ADVScene } from '../data/model.ts';

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
 * @returns 对应的类型字符串 "Scene" | "Check" | "Dialog" | "Other"
 * @throws 如果对象不符合任何已知类型，会返回 ”Other“
 */
export function instanceType(
    obj: ADVScene | ADVCheck | ADVDialog | any,
): 'Scene' | 'Check' | 'Dialog' | 'Other' {
    // 1. 优先检查是否具有 type 属性（ADVScene 和 ADVDialog 特有）
    if ('type' in obj) {
        if (obj.type === 'Scene') return 'Scene';
        if (obj.type === 'Dialog') return 'Dialog';
        // 如果 type 值不是预期值，继续往下抛错
    }

    // 2. 检查是否具有 target 属性（ADVCheck 特有）
    if ('target' in obj) {
        return 'Check';
    }

    // 3. 都不符合
    return 'Other';
}
