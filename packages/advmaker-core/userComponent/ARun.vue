<template></template>

<script setup lang="ts">
import { inject, onMounted } from 'vue';

const props = defineProps<{
    /** 需要执行的函数，支持同步或异步 */
    run: () => void | Promise<void>;
}>();

const registerContent = inject<(content: any) => void>('registerContent', () => {
    console.warn('[ARun] 必须在 <ADialog> 或 <AOption> 内部使用');
});

onMounted(() => {
    const wrappedRunner = async () => {
        await props.run();
    };
    registerContent(wrappedRunner);
});
</script>
