<template>
    <slot />
</template>

<script setup lang="ts">
import { provide, inject, onMounted, ref, type VNode } from 'vue';
import { useMessageStore } from '../store/message';
import type { ADVUserNext, MessageContentType } from '../data/model';

const message = useMessageStore();

const props = defineProps<{
    id?: string;
    next?: ADVUserNext; // 改为可选
}>();

const sceneId = inject<string | null>('sceneId', null);
const script = ref<MessageContentType[]>([]);

function registerContent(content: MessageContentType) {
    script.value.push(content);
}

function registerLine(vnode: VNode) {
    registerContent(vnode);
}

provide('registerLine', registerLine);
provide('registerContent', registerContent);

const registerDialog = inject<
    (
        id: string,
        inScene: string | undefined,
        script: MessageContentType[],
        userNext?: ADVUserNext,
    ) => void
>('registerDialog', () => console.warn('[ADialog] 必须在 <AStory> 内部使用'));

onMounted(() => {
    if (props.id === undefined) {
        message.dialogCount++;
    }
    const dialogId = props.id ?? `__DIALOG&NUM${message.dialogCount}`;

    registerDialog(dialogId, sceneId ?? undefined, script.value, props.next);
});
</script>
