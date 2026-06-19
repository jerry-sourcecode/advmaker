<template>
    <AIf
        :condition="
            () =>
                Adv.check({
                    target: props.target ?? 0,
                    success: null,
                    fail: null,
                    dice: props.dice,
                    targetDesc: props.targetDesc,
                    modifier: props.modifier,
                    onFail: props.onFail,
                    onSuccess: props.onSuccess,
                })
        "
        ><slot name="success"
    /></AIf>
    <AElse><slot name="fail" /></AElse>
</template>

<script setup lang="ts">
import AIf from './AIf.vue';
import { Adv } from '../api';
import AElse from './AElse.vue';
import { ADVDice, type VlAndAsync, type VlAndFn } from '../data/model';
import type { DiceExpression } from '../utils/dice';

const props = defineProps<{
    dice?: ADVDice | DiceExpression;
    target?: VlAndFn<number>;
    targetDesc?: string;
    modifier?: { name: string; value: () => number }[];
    onSuccess?: () => VlAndAsync<void>;
    onFail?: () => VlAndAsync<void>;
}>();
</script>

<style scoped></style>
