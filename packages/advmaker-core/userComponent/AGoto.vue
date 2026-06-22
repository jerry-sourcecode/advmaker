<template>
    <ARun
        :run="
            () => {
                Adv.goto(props.tgt);
            }
        "
    />
    <AEndDialog />
</template>
<script setup lang="ts">
import { Adv } from '../api';
import ARun from './ARun.vue';
import AEndDialog from './AEndDialog.vue';

const props = defineProps<{
    tgt: string;
}>();
</script>
