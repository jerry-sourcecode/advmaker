<template>
    <slot />
</template>

<script setup lang="ts">
import { inject, provide, onMounted, ref, type VNode } from 'vue';
import type { MessageContentType } from '../data/model';
import { Adv } from '../api';

const parentRegister = inject<(content: MessageContentType) => void>('registerContent', () => {
    console.warn('[AElse] 必须在 <AIf> 的同级 <ADialog> 或 <AOption> 内部使用');
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
    // 提交 else 标记
    const elseToken = Adv.else() as any;
    parentRegister(elseToken);

    // 提交假分支内容
    myContent.value.forEach((item) => parentRegister(item));

    // 提交 end 标记，闭合条件块
    const endToken = Adv.end() as any;
    parentRegister(endToken);
});
</script>
