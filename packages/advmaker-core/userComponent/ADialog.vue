<script setup lang="ts">
import { provide, inject, onMounted, ref, type VNode } from 'vue';
import { Adv } from '../api.ts';
import { useMessageStore } from '../store/message.ts';
import type { ADVUserNext } from '../data/model.ts';

const message = useMessageStore();

const props = defineProps<{
    id?: string;
    next: ADVUserNext;
}>();

// 1. 判断是否在 Scene 内
const sceneId = inject<string | null>('sceneId', null);

// 2. 收集所有 ALine 传来的 VNode
const lines = ref<VNode[]>([]);

function registerLine(vnode: VNode) {
    lines.value.push(vnode);
}

provide('registerLine', registerLine);

// 3. 挂载完成后统一调用 API
onMounted(() => {
    if (props.id === undefined) {
        message.dialogCount++;
    }
    Adv.appendDialog(props.id ?? `__DIALOG&NUM${message.dialogCount}`, {
        in: sceneId ?? undefined,
        script: lines.value,
        next: props.next,
    });
});
</script>

<template>
    <slot />
</template>
