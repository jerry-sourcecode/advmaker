<template>
    <slot />
</template>

<script setup lang="ts">
import { provide, inject, onMounted, ref, type VNode } from 'vue';
import { useMessageStore } from '../store/message';
import type { ADVUserNext } from '../data/model';

const props = defineProps<{
    id?: string;
    next: ADVUserNext;
}>();

const message = useMessageStore();
const sceneId = inject<string | null>('sceneId', null);
const lines = ref<VNode[]>([]);

function registerLine(vnode: VNode) {
    lines.value.push(vnode);
}
provide('registerLine', registerLine);

const registerDialog = inject<
    (id: string, inScene: string | undefined, script: VNode[], userNext?: ADVUserNext) => void
>('registerDialog', () => {
    console.warn('[ADialog] 必须在 <AStory> 内部使用');
});

onMounted(() => {
    if (props.id === undefined) {
        message.dialogCount++;
    }
    const dialogId = props.id ?? `__DIALOG&NUM${message.dialogCount}`;

    registerDialog(dialogId, sceneId ?? undefined, lines.value, props.next);
});
</script>
