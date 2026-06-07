<script setup lang="ts">
import { inject, useSlots, onMounted, h, Fragment, type VNode } from 'vue';

const registerLine = inject<(vnode: VNode) => void>('registerLine', () => {
    console.warn('[ALine] 必须在 <ADialog> 内部使用');
});

const slots = useSlots();

onMounted(() => {
    const defaultSlot = slots.default?.();
    // 打包为一个 Fragment VNode（即使内容为空也保持数组元素统一）
    const vnode = defaultSlot ? h(Fragment, null, defaultSlot) : h(Fragment);
    registerLine(vnode);
});
</script>

<template>
    <slot />
</template>
