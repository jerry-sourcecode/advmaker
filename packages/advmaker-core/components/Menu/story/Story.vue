<template>
    <n-modal v-model:show="showModal">
        <n-card class="responsive-dialog responsive-non-fit" title="故事">
            <div v-if="timeStore.enabled" class="time-display">日期：{{ timeStore.fullStr }}</div>
            <n-tabs animated>
                <n-tab-pane name="char" tab="人物"><Char /></n-tab-pane>
                <n-tab-pane name="clue" tab="线索"><Clue /></n-tab-pane>
            </n-tabs>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import Char from './Char.vue';
import Clue from './clue.vue';
import { useTimeStore } from '../../../store/time.ts';

const showModal = defineModel({ type: Boolean });

const timeStore = useTimeStore();
</script>

<style scoped>
.time-display {
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    padding: 8px 0 4px;
    margin-bottom: 8px;
}
</style>
