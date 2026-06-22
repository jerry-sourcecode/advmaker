<template>
    <n-modal v-model:show="showModal">
        <n-card class="responsive-dialog responsive-non-fit" title="故事">
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

const showModal = defineModel({ type: Boolean });
</script>
