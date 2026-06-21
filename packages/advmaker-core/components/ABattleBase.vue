<template></template>

<script setup lang="ts">
import { inject, onMounted } from 'vue';
import { Adv } from '../api';
import { ADVBattle, ADVUserBattle } from '../data/model';

const props = defineProps<{
    setting: ADVUserBattle;
}>();

const registerContent = inject<(content: any) => void>('registerContent', () => {
    console.warn('[ABattle] 必须在 <ADialog> 内部使用');
});

onMounted(() => {
    const endCallback = async () => {
        await Adv.startBattle(new ADVBattle(props.setting));
    };
    registerContent(endCallback);
});
</script>
