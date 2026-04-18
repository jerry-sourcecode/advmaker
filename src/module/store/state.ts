import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Game, RuntimeError } from '../game.ts';

export const useStateStore = defineStore('state', () => {
    const location = ref('');

    const isDead = ref(false);
    const deadDesc = ref('');

    const backpack = ref(new Map<string, number>());

    function obtainItem(item: string, number: number = 1) {
        const currentCount = backpack.value.get(item) || 0;
        if (currentCount + number < 0) {
            Game.error(new RuntimeError(1, 'Item count cannot be negative.'));
        }
        backpack.value.set(item, currentCount + number);
    }

    function init() {
        backpack.value.clear();
    }

    return { location, backpack, obtainItem, isDead, deadDesc, init };
});
