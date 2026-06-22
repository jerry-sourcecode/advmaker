<template>
    <AGoto :tgt="Adv.ending(props.desc)" />
</template>

<script setup lang="ts">
import { Adv } from '../api';
import AGoto from './AGoto.vue';

const props = defineProps<{
    desc: string;
}>();
</script>
