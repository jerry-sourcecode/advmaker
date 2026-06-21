import { defineStore } from 'pinia';
import { type Ref, ref } from 'vue';
import { ADVBattle } from '../data/model.ts';
import { BoundedQueue } from '../utils/util.ts';
import { Adv } from '../api.ts';
import { useEmitter } from './emitter.ts';
export const useBattleStore = defineStore('battle', () => {
    const isBattle = ref(false);
    const setting = ref<ADVBattle>(
        new ADVBattle({
            isFinish: () => null,
            enemies: [],
            ATKActions: [],
            initiativeOrder: () => [],
        }),
    );
    const chooseTargetNum = ref(0);
    const log = ref<string[]>([]);
    const state: Ref<'player' | 'enemy' | 'wait' | 'playerChoose' | 'flee'> = ref('wait');
    const queue = ref(new BoundedQueue<number>(Infinity));
    const result = ref<boolean | 'flee'>(true);

    function appendLog(script: string) {
        log.value.push(script);
    }

    /**
     *
     * @param first 是否是第一次（若是第一次，就不会更新queue，直接判定）
     */
    async function next(first: boolean = false) {
        if (queue.value.isEmpty()) throw 'Initiative Order is empty';
        if (!first) {
            const emitter = useEmitter();
            if (state.value === 'flee') {
                emitter.emit('battle-over', 'flee');
                return;
            }
            const res = setting.value.isFinish(setting.value.enemies);
            if (res !== null) {
                emitter.emit('battle-over', res);
                return;
            }
            queue.value.push(queue.value.peek()!);
            queue.value.pop();
        }
        const nxt = queue.value.peek()!;
        if (nxt < 0) {
            state.value = 'player';
            Adv.print('玩家回合。');
        } else {
            state.value = 'enemy';
            Adv.print(`敌人 ${setting.value.enemies[nxt].name} 回合。`);
            await setting.value.enemies[nxt].move(setting.value.enemies);
            next();
        }
    }

    function flee() {
        state.value = 'flee';
    }
    return {
        isBattle,
        setting,
        state,
        appendLog,
        log,
        chooseTargetNum,
        queue,
        next,
        flee,
        result,
    };
});
