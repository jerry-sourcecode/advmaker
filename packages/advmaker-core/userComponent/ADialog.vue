<template>
    <slot />
</template>

<script setup lang="ts">
import { provide, inject, onMounted, ref, type VNode } from 'vue';
import { useMessageStore } from '../store/message';
import { ADVCommand, type ADVUserNext, type MessageContentType } from '../data/model';
import { Adv } from '../api'; // 用于 Adv.end()

const message = useMessageStore();

const props = defineProps<{
    id?: string;
    next?: ADVUserNext;
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

    // ── 补丁：自动闭合未配对的 if 块 ──
    autoCloseIfs(script.value);

    registerDialog(dialogId, sceneId ?? undefined, script.value, props.next);
});

function autoCloseIfs(arr: MessageContentType[]) {
    let depth = 0;
    for (const item of arr) {
        const type = (item as ADVCommand).type;
        if (type === 'if') depth++;
        else if (type === 'end') depth--;
        // elif 和 else 不改变深度
    }
    if (depth > 0) {
        const endToken = Adv.end();
        arr.push(endToken);
    }
}
</script>
