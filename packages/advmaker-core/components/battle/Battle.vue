<template>
    <div class="outer">
        <div class="enemies">
            <div
                v-for="(it, idx) in battleStore.setting.enemies"
                class="enemy"
                :class="chosenId.has(idx) ? 'enemy-choose' : 'enemy-non-choose'"
            >
                <NThing @click="enemyClicked(it, idx)">
                    <p style="font-size: large; font-weight: bold">{{ it.name }}</p>
                    生命值：{{ it.hp }} / {{ it.maxhp }}
                    <p>攻击：{{ it.atk }} 防御：{{ it.def }}</p>
                </NThing>
            </div>
        </div>
        <div class="info" ref="mainDivRef">
            <p v-for="it in battleStore.log">{{ it }}</p>
        </div>
        <div class="action">
            <div v-if="battleStore.state !== 'playerChoose'">
                <NButton :disabled="!canAct" @click="showATKActions" class="btn">攻击</NButton>
                <NButton
                    :disabled="!canAct"
                    @click="showSPActions"
                    v-if="battleStore.setting.SPActions.length !== 0"
                    class="btn"
                >
                    技能
                </NButton>
                <NButton
                    :disabled="!canAct"
                    @click="showOtherSkills"
                    v-if="battleStore.setting.otherActions.length !== 0"
                    class="btn"
                >
                    特殊行动
                </NButton>
                <NButton :disabled="!canAct" class="btn" @click="flee">逃跑</NButton>
            </div>
            <div v-else>
                <span v-if="battleStore.chooseTargetNum < Infinity">
                    最多选择 {{ battleStore.chooseTargetNum }} 位敌人，
                </span>
                <span v-else>正在施展全体技能，</span>
                你已选择 {{ chosenId.size }} 位。
                <NButton
                    :disabled="battleStore.chooseTargetNum < chosenId.size || chosenId.size === 0"
                    @click="confirmObject"
                    type="success"
                >
                    确认
                </NButton>
            </div>
        </div>
    </div>
    <Enemy :enemy-info="enemyInfo" v-model:show="isShowEnemyDetail" />
    <Action :actions="actionInfo" v-model:show="isShowActionDetail" />
</template>

<script setup lang="ts">
import { useBattleStore } from '../../store/battle.ts';
import { computed, ref } from 'vue';
import Enemy from './Enemy.vue';
import type { ADVEnemy } from '../../data/model.ts';
import Action from './Action.vue';
import { useEmitter } from '../../store/emitter.ts';

const battleStore = useBattleStore();
const emitter = useEmitter();
const enemyInfo = ref();
const actionInfo = ref();
const isShowEnemyDetail = ref(false);
const isShowActionDetail = ref(false);
const chosenId = ref(new Set<number>());

const canAct = computed(() => {
    return battleStore.state === 'player';
});

function enemyClicked(it: ADVEnemy, idx: number) {
    if (battleStore.state === 'playerChoose') {
        if (chosenId.value.has(idx)) {
            chosenId.value.delete(idx);
        } else {
            chosenId.value.add(idx);
        }
    } else {
        enemyInfo.value = it;
        isShowEnemyDetail.value = true;
    }
}

function showATKActions() {
    actionInfo.value = battleStore.setting.ATKActions;
    isShowActionDetail.value = true;
}

function showSPActions() {
    actionInfo.value = battleStore.setting.SPActions;
    isShowActionDetail.value = true;
}

function showOtherSkills() {
    actionInfo.value = battleStore.setting.otherActions;
    isShowActionDetail.value = true;
}

const objectChooseRes = ref<(e: ADVEnemy[]) => void>();

emitter.on('choose-object', (num: number) => {
    if (num === 0) return new Promise((res) => res([]));
    battleStore.state = 'playerChoose';
    battleStore.chooseTargetNum = num;
    return new Promise((res) => {
        objectChooseRes.value = res as (e: ADVEnemy[]) => void;
    });
});

function confirmObject() {
    const res = ref<ADVEnemy[]>([]);
    chosenId.value.forEach((v) => {
        res.value.push(battleStore.setting.enemies[v]);
    });
    objectChooseRes.value!(res.value);
    chosenId.value.clear();
}

function flee() {
    battleStore.flee();
    battleStore.next();
}

const mainDivRef = ref<HTMLDivElement>();
emitter.on('scroll-to-end', () => {
    if (battleStore.isBattle) mainDivRef.value!.scrollTop = mainDivRef.value!.scrollHeight;
});
</script>

<style scoped>
.enemy {
    padding: 10px;
    margin: 10px;
    border-style: groove;
    border-color: #f56c6c;
    border-width: 10px;
    box-shadow: 0 5px 5px #888888;
}
.enemy-non-choose {
    border-style: groove;
    border-color: #f56c6c;
    border-width: 10px;
}
.enemy-choose {
    border-style: groove;
    border-color: #67c23a;
    border-width: 10px;
}
.enemy * {
    font-size: 16px;
}
.enemies {
    display: flex;
    justify-content: center;
}
.outer {
    padding: 10px;
    height: 83vh;
    display: flex;
    flex-direction: column;
}
.info {
    padding: 10px;
    margin: 10px;
    border-style: ridge;
    border-color: #409eff;
    border-width: 10px;
    flex: 1;
    font-size: 19px;
    overflow-y: auto;
}
.action {
    display: flex;
    justify-content: center;
}
.btn {
    margin-right: 10px;
}
</style>
