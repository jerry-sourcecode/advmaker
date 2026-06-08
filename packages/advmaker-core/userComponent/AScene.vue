<template>
    <slot />
</template>

<script setup lang="ts">
import { provide, inject, onMounted } from 'vue';
import type { ADVUserNext } from '../data/model';

const props = defineProps<{
    id: string;
    name: string;
    next?: ADVUserNext; // 改为可选
}>();

provide('sceneId', props.id);

const registerScene = inject<(id: string, name: string, userNext?: ADVUserNext) => void>(
    'registerScene',
    () => {
        console.warn('[AScene] 必须在 <AStory> 内部使用');
    },
);

onMounted(() => {
    registerScene(props.id, props.name, props.next);
});
</script>
