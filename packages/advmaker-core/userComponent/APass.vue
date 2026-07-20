<template>
    <ARun
        :run="
            () => {
                Adv.time.advance(props.minutes);
            }
        "
    />
</template>

<script setup lang="ts">
import { Adv, ARun } from '@advmaker/core';
const props = defineProps<{
    /** 要流逝的分钟数（正整数） */
    minutes: number;
}>();
</script>
