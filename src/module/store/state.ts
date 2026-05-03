/**
 * 这个仓库用于储存玩家状态
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Game, RuntimeError } from '../game.ts';
import { useStoryStore } from './story.ts';

export const useStateStore = defineStore('state', () => {
    const location = ref('');

    const isDead = ref(false);
    const deadDesc = ref('');

    const backpack = ref(new Map<string, number>());
    const shop = ref(new Map<string, number>());
    const status = ref(new Map<string, number>());

    function obtainItem(item: string, number: number = 1) {
        const currentCount = backpack.value.get(item) || 0;
        if (currentCount + number < 0) {
            Game.error(new RuntimeError(1, 'Item count cannot be negative.'));
        }
        backpack.value.set(item, currentCount + number);
        if (currentCount + number === 0) backpack.value.delete(item);
    }

    function obtainStatus(id: string, number: number) {
        const storyStore = useStoryStore();
        let ori = status.value.get(id)!;
        const obj = storyStore.statusMap.get(id);
        if (obj === undefined) {
            Game.error(new RuntimeError(2, `Can't Find Status: ${id}.`));
            return;
        }
        ori += number;
        ori = Math.max(obj.min, ori);
        ori = Math.min(obj.max, ori);
        status.value.set(id, ori);
    }

    function qryItem(id: string) {
        const res = backpack.value.get(id);
        return res ?? 0;
    }

    function qryStatus(id: string) {
        const res = status.value.get(id);
        if (res === undefined) {
            Game.error(new RuntimeError(2, `Can't Find Status name ${id}.`));
        }
        return res ?? 0;
    }

    function init() {
        backpack.value.clear();
    }

    return {
        location,
        obtainItem,
        isDead,
        deadDesc,
        init,
        obtainStatus,
        shop,
        qryItem,
        qryStatus,
        status,
        backpack,
    };
});
