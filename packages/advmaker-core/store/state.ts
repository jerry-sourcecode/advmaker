/**
 * 这个仓库用于储存玩家状态
 */

import { defineStore } from 'pinia';
import { type Ref, ref } from 'vue';
import { Game, RuntimeError } from '../game.ts';
import { useStoryStore } from './story.ts';
import { ADVCharacter, ADVGoods, type ADVNext } from '../data/model.ts';
import type { CharsIds, ItemIds, StatusIds } from '../type/user';

// ========== number 型状态的内部存储结构 ==========
export interface StatusNumberData {
    base: number;
    bonus: number;
}

function clamp(v: number, min: number, max: number) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
}

export const useStateStore = defineStore('state', () => {
    const location = ref('');
    const last: Ref<ADVNext> = ref('_START');

    const isDead = ref(false);
    const deadDesc = ref('');

    const backpack = ref(new Map<ItemIds, number>());
    const shop = ref(new Map<ItemIds, number>());
    /** number 型存 {base,bonus}，string 型存 string */
    const status = ref(new Map<StatusIds, StatusNumberData | string>());
    // 记录你认不认识这个角色
    const character = ref(new Map<CharsIds, ADVCharacter>());
    const goodsMap = ref(new Map<string, ADVGoods>());

    function obtainItem(item: ItemIds, number: number = 1) {
        const currentCount = backpack.value.get(item) || 0;
        if (currentCount + number < 0) {
            Game.error(new RuntimeError(1, '物品数量不能为负数 / Item count cannot be negative.'));
            return;
        }
        backpack.value.set(item, currentCount + number);
    }


    function qryItem(id: ItemIds) {
        const res = backpack.value.get(id);
        return res ?? 0;
    }

    /** 返回总值（number 型=base+bonus，string 型=字符串） */
    function qryStatus(id: StatusIds): number | string {
        const res = status.value.get(id);
        if (res === undefined) {
            Game.error(new RuntimeError(2, `找不到状态 / Status not found: ${id}.`));
            return 0;
        }
        if (typeof res === 'string') return res;
        return res.base + res.bonus;
    }

    function getStatusBase(id: StatusIds): number {
        const res = status.value.get(id);
        if (typeof res === 'object' && res !== null) return res.base;
        return 0;
    }

    function getStatusBonus(id: StatusIds): number {
        const res = status.value.get(id);
        if (typeof res === 'object' && res !== null) return res.bonus;
        return 0;
    }

    function setStatusTotal(id: StatusIds, total: number) {
        const obj = useStoryStore().statusMap.get(id);
        if (!obj) return;
        const raw = status.value.get(id);
        const data = (typeof raw === 'object' && raw !== null) ? raw : { base: 0, bonus: 0 };
        const clamped = clamp(total, obj.min, obj.max);
        status.value.set(id, { base: data.base, bonus: clamped - data.base });
    }

    function setStatusBase(id: StatusIds, base: number) {
        const obj = useStoryStore().statusMap.get(id);
        if (!obj) return;
        const raw = status.value.get(id);
        const data = (typeof raw === 'object' && raw !== null) ? raw : { base: 0, bonus: 0 };
        const oldTotal = data.base + data.bonus;
        const newTotal = clamp(base + data.bonus, obj.min, obj.max);
        status.value.set(id, { base, bonus: newTotal - base });
        void oldTotal;
    }

    function setStatusBonus(id: StatusIds, bonus: number) {
        const obj = useStoryStore().statusMap.get(id);
        if (!obj) return;
        const raw = status.value.get(id);
        const data = (typeof raw === 'object' && raw !== null) ? raw : { base: 0, bonus: 0 };
        const total = clamp(data.base + bonus, obj.min, obj.max);
        status.value.set(id, { base: data.base, bonus: total - data.base });
    }

    function getStatusRaw(id: StatusIds): StatusNumberData | string | undefined {
        return status.value.get(id);
    }

    return {
        location,
        obtainItem,
        isDead,
        deadDesc,
        shop,
        qryItem,
        qryStatus,
        status,
        backpack,
        last,
        character,
        goodsMap,
        getStatusBase,
        getStatusBonus,
        setStatusTotal,
        setStatusBase,
        setStatusBonus,
        getStatusRaw,
    };
});
