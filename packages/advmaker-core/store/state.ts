/**
 * 这个仓库用于储存玩家状态
 */

import { defineStore } from 'pinia';
import { type Ref, ref } from 'vue';
import { Game, RuntimeError } from '../game.ts';
import { useStoryStore } from './story.ts';
import { ADVCharacter, ADVGoods, type ADVNext } from '../data/model.ts';
import type { CharsIds, ItemIds, StatusIds } from '../type/user';

export const useStateStore = defineStore('state', () => {
    const location = ref('');
    const last: Ref<ADVNext> = ref('_START');

    const isDead = ref(false);
    const deadDesc = ref('');

    const backpack = ref(new Map<ItemIds, number>());
    const shop = ref(new Map<ItemIds, number>());
    const status = ref(new Map<StatusIds, number | string>());
    // 记录你认不认识这个角色
    const character = ref(new Map<CharsIds, ADVCharacter>());
    const goodsMap = ref(new Map<string, ADVGoods>());

    function obtainItem(item: ItemIds, number: number = 1) {
        const currentCount = backpack.value.get(item) || 0;
        if (currentCount + number < 0) {
            Game.error(new RuntimeError(1, 'Item count cannot be negative.'));
        }
        backpack.value.set(item, currentCount + number);
    }

    function obtainStatus(id: StatusIds, value: number | string) {
        const storyStore = useStoryStore();
        let ori: string | number = status.value.get(id)!;
        const obj = storyStore.statusMap.get(id);
        if (obj === undefined) {
            Game.error(new RuntimeError(2, `Can't Find Status: ${id}.`));
            return;
        }
        if (typeof ori === 'string' || typeof value === 'string') {
            // string 类型：直接设置值
            status.value.set(id, value);
            return;
        }
        ori += value;
        ori = Math.max(obj.min, ori);
        ori = Math.min(obj.max, ori);
        status.value.set(id, ori);
    }

    function qryItem(id: ItemIds) {
        const res = backpack.value.get(id);
        return res ?? 0;
    }

    function qryStatus(id: StatusIds): number | string {
        const res = status.value.get(id);
        if (res === undefined) {
            Game.error(new RuntimeError(2, `Can't Find Status name ${id}.`));
        }
        return res ?? 0;
    }

    return {
        location,
        obtainItem,
        isDead,
        deadDesc,
        obtainStatus,
        shop,
        qryItem,
        qryStatus,
        status,
        backpack,
        last,
        character,
        goodsMap,
    };
});
