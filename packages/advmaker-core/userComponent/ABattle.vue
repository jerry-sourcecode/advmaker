<template>
    <ABattleBase :setting="props.setting" />
    <AIf :condition="() => battleStore.result === true">
        <slot name="success" />
    </AIf>
    <AElif :condition="() => battleStore.result === false">
        <slot name="fail" />
    </AElif>
    <AElse>
        <slot name="flee" />
    </AElse>
</template>

<script setup lang="ts">
import { ADVUserBattle } from '../data/model.ts';
import ABattleBase from '../components/ABattleBase.vue';
import AIf from './AIf.vue';
import AElse from './AElse.vue';
import AElif from './AElif.vue';
import { useBattleStore } from '../store/battle.ts';
const battleStore = useBattleStore();
const props = defineProps<{
    setting: ADVUserBattle;
}>();
</script>

<style scoped></style>
