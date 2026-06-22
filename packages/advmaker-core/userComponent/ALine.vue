<script setup lang="ts">
import { inject, useSlots, onMounted, h, Fragment } from 'vue';
import { Adv } from '../api';

const registerContent = inject<(content: any) => void>('registerContent', () => {
    console.warn('[ALine] 必须在 <ADialog> 内部使用');
});

const slots = useSlots();

onMounted(() => {
    registerContent(async () => {
        const defaultSlot = slots.default?.();
        const vnode =
            defaultSlot && defaultSlot.length > 0 ? h(Fragment, null, defaultSlot) : h(Fragment);
        await Adv.print(vnode);
    });
});
</script>

<template>
    <slot />
</template>
