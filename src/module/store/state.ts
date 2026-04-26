/**
 * 这个仓库用于储存玩家状态
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Game, RuntimeError } from '../game.ts';
import type { ADVStatus } from '../data/model.ts';

export const useStateStore = defineStore('state', () => {
    const location = ref('');

    const isDead = ref(false);
    const deadDesc = ref('');

    const backpack = ref(new Map<string, number>());
    const status = ref(new Map<string, ADVStatus>());

    function obtainItem(item: string, number: number = 1) {
        const currentCount = backpack.value.get(item) || 0;
        if (currentCount + number < 0) {
            Game.error(new RuntimeError(1, 'Item count cannot be negative.'));
        }
        backpack.value.set(item, currentCount + number);
    }

    function obtainStatus(id: string, number: number) {
        const ori = status.value.get(id);
        if (ori === undefined) {
            Game.error(new RuntimeError(2, `Can't Find Status: ${id}.`));
            return;
        }
        ori.value += number;
        ori.value = Math.max(ori.min, ori.value);
        ori.value = Math.min(ori.max, ori.value);
        status.value.set(id, ori);
    }

    function init() {
        backpack.value.clear();
    }

    return { location, backpack, obtainItem, isDead, deadDesc, init, status, obtainStatus };
});
