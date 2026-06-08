<template></template>

<script setup lang="ts">
import { inject, onMounted } from 'vue';
import { Adv } from '../api';

const props = defineProps<{
    desc: string;
}>();

const registerContent = inject<(content: any) => void>('registerContent', () => {
    console.warn('[AEnding] 必须在 <ADialog> 内部使用');
});

onMounted(() => {
    const endCallback = () => {
        Adv.goto(Adv.end(props.desc));
    };
    registerContent(endCallback);
});
</script>
