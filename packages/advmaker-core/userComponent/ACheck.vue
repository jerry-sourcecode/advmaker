<template>
    <AIf
        :condition="
            async () => {
                checkResult = await Adv.check({
                    target: props.target ?? 0,
                    success: null,
                    fail: null,
                    dice: props.dice,
                    targetDesc: props.targetDesc,
                    modifier: props.modifier,
                    onFail: props.onFail,
                    onSuccess: props.onSuccess,
                });
                emitter('check', checkResult.res, checkResult.nat, checkResult.dirty);
                return checkResult.res;
            }
        "
    >
        <slot name="success" :nat="checkResult?.nat ?? 0" :dirty="checkResult?.dirty ?? 0" />
    </AIf>
    <AElse>
        <slot name="fail" :nat="checkResult?.nat ?? 0" :dirty="checkResult?.dirty ?? 0" />
    </AElse>
</template>

<script setup lang="ts">
import { ref } from 'vue';
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

const checkResult = ref<{ res: boolean; nat: number; dirty: number } | null>(null);

const emitter = defineEmits<{
    check: [res: boolean, nat: number, dirty: number];
}>();
</script>

<style scoped></style>
