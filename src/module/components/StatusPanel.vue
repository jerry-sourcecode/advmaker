<template>
    <div class="outer-div">
        <div v-for="item in stateStore.status" style="flex: 1">
            <n-statistic tabular-nums>
                <template #prefix>
                    <span style="font-size: 14px"> {{ item[1].name }}:</span>
                </template>
                <n-number-animation
                    :active="true"
                    :to="stateStore.status.get(item[1].id)?.value ?? 0"
                    :from="numberFrom.get(item[1].id)"
                    @finish="onFinish(item[1].id)"
                />
                <template #suffix>
                    <span style="font-size: 12px">/ {{ item[1].max }}</span>
                </template>
            </n-statistic>
            <n-progress
                type="line"
                :color="item[1].color"
                :percentage="(item[1].value * 100) / item[1].max"
                :show-indicator="false"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useStateStore } from '../store/state.ts';
import { ref } from 'vue';
const stateStore = useStateStore();

const numberFrom = ref(new Map<string, number>());

function onFinish(id: string) {
    numberFrom.value.set(id, stateStore.status.get(id)?.value!);
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
    gap: 5px;
    height: 61px;
}
</style>
