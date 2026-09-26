<template>
    <slot />
</template>

<script setup lang="ts">
import { provide, inject, onMounted } from 'vue';
import type { ADVUserNext, VlAndAsync } from '../data/model';

type SceneCallback = () => VlAndAsync<void>;

const props = defineProps<{
    id: string;
    name: string;
    next?: ADVUserNext;
    /** 设为 true 相当于 :next="null"，故事在此暂停，优先级高于 next */
    stop?: boolean;
    /** 进入该场景时触发 */
    onEnter?: SceneCallback;
    /** 离开该场景时触发 */
    onLeave?: SceneCallback;
}>();

provide('sceneId', props.id);

const registerScene = inject<
    (
        id: string,
        name: string,
        userNext?: ADVUserNext,
        onEnter?: SceneCallback,
        onLeave?: SceneCallback,
    ) => void
>('registerScene', () => {
    console.warn('[AScene] 必须在 <AStory> 内部使用');
});

onMounted(() => {
    registerScene(
        props.id,
        props.name,
        props.stop ? null : props.next,
        props.onEnter,
        props.onLeave,
    );
});
</script>
