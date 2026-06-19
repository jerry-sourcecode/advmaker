<template />
<script setup lang="ts">
import { inject, onMounted } from 'vue';
import { ADVCReturn } from '../data/model';

const registerContent = inject<(content: any) => void>('registerContent', () => {
    console.warn('[AEndDialog] 必须在 <ADialog> 内部使用');
});

onMounted(() => {
    registerContent(new ADVCReturn());
});
</script>
