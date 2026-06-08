<template><slot /></template>

<script setup lang="ts">
import { inject, provide, onMounted, reactive } from 'vue';
import { ADVChoice } from '../data/model';
import type { ADVUserChoice, MessageContentType } from '../data/model';

const choices: ADVUserChoice[] = reactive([]);

function registerOption(option: ADVUserChoice) {
    choices.push(option);
}
provide('registerOption', registerOption);

const registerContent = inject<(content: MessageContentType) => void>('registerContent', () => {
    console.warn('[AOptions] 必须在 <ADialog> 内部使用');
});

onMounted(() => {
    const advChoices = choices.map((uc) => new ADVChoice(uc));
    registerContent(advChoices);
});
</script>
