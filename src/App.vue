<template>
    <AShell>
        <AGoto tgt="jeff-n-success" />
        <Jim />
        <AskResident />
        <CheckSurroundings />
    </AShell>
</template>

<script setup lang="ts">
import Jim from './scene/jim.vue';
import AskResident from './scene/AskResident.vue';
import CheckSurroundings from './scene/CheckSurroundings.vue';
import { AShell, AGoto } from '@advmaker/core';
</script>
