<template>
    <div class="outer-div" v-if="isAllHide">
        <div v-for="item in stateStore.status" class="status-div">
            <div v-if="!['none', 'hide'].includes(RV(qryStatus(item[0]).isDisplay))">
                <n-statistic tabular-nums>
                    <template #prefix>
                        <span style="font-size: 14px"> {{ qryStatus(item[0]).name }}:</span>
                    </template>
                    <n-number-animation
                        :active="true"
                        :to="stateStore.qryStatus(qryStatus(item[0]).id) ?? 0"
                        :from="numberFrom.get(qryStatus(item[0]).id)"
                        @finish="onFinish(qryStatus(item[0]).id)"
                    />
                    <template #suffix v-if="qryStatus(item[0]).max < Infinity">
                        <span style="font-size: 12px">/ {{ qryStatus(item[0]).max }}</span>
                    </template>
                </n-statistic>
                <n-progress
                    type="line"
                    :color="RV(qryStatus(item[0]).color)"
                    :percentage="(item[1] * 100) / qryStatus(item[0]).max"
                    :show-indicator="false"
                    v-if="RV(qryStatus(item[0]).isDisplay) === 'process'"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useStateStore } from '../store/state.ts';
import { computed, ref } from 'vue';
import { RV } from '../utils/util.ts';
import { useStoryStore } from '../store/story.ts';
const stateStore = useStateStore();
const storyStore = useStoryStore();

const numberFrom = ref(new Map<string, number>());

function onFinish(id: string) {
    numberFrom.value.set(id, stateStore.qryStatus(id));
}

const isAllHide = computed(() => {
    let res = false;
    stateStore.status.forEach((_, id) => {
        if (!['none', 'hide'].includes(RV(qryStatus(id).isDisplay))) res = true;
    });
    return res;
});

function qryStatus(id: string) {
    return storyStore.statusMap.get(id)!;
}
</script>

<style scoped>
.outer-div {
    display: flex;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 10px;
    width: 100%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    gap: 10px;
    height: 61px;
}
.status-div {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
}
</style>
