<script setup lang="ts">
import { onMounted, provide } from 'vue';
import { Adv } from '../api.ts';
import type { ADVUserNext } from '../data/model.ts';

const props = defineProps<{
    id: string;
    name: string;
    next: ADVUserNext;
}>();

provide('sceneId', props.id);

onMounted(() => {
    Adv.appendScene(props.id, {
        name: props.name,
        next: props.next,
    });
});
</script>

<template>
    <slot />
</template>
