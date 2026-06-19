<template>
    <slot />
</template>

<script setup lang="ts">
import { inject, provide, onMounted, ref, type VNode } from 'vue';
import type { MessageContentType } from '../data/model';
import { Adv } from '../api';

const props = defineProps<{
    condition: () => boolean | Promise<boolean>;
}>();

const parentRegister = inject<(content: MessageContentType) => void>('registerContent', () => {
    console.warn('[AIf] 必须在 <ADialog> 或 <AOption> 内部使用');
});

const myContent = ref<MessageContentType[]>([]);

function localRegister(content: MessageContentType) {
    myContent.value.push(content);
}
function localRegisterLine(vnode: VNode) {
    localRegister(vnode);
}

provide('registerLine', localRegisterLine);
provide('registerContent', localRegister);

onMounted(() => {
    const ifToken = Adv.if(props.condition);
    parentRegister(ifToken);

    myContent.value.forEach((item) => parentRegister(item));
});
</script>
