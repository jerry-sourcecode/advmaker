<template />
<script setup lang="ts">
import { inject, onMounted } from 'vue';
import { Adv } from '../api';
import { ADVCReturn } from '../data/model.ts';

const props = defineProps<{
    tgt: string;
}>();

const registerContent = inject<(content: any) => void>('registerContent', () => {
    console.warn('[AGoto] 必须在 <ADialog> 内部使用');
});

onMounted(() => {
    const endCallback = () => {
        Adv.goto(props.tgt);
    };
    registerContent(endCallback);
    registerContent(new ADVCReturn());
});
</script>
