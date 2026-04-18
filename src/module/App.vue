<script setup lang="ts">
import Message from './components/Message.vue';
import ChoicePanel from './components/ChoicePanel.vue';
import { useStoryStore } from './store/story.ts';
import GameOver from './components/GameOver.vue';
import { useStateStore } from './store/state.ts';
import './api.ts';

const storyStore = useStoryStore();
const stateStore = useStateStore();
</script>

<template>
    <div v-if="!stateStore.isDead" style="height: 100%; display: flex; flex-direction: column">
        <n-page-header class="page-header">
            <template #title>
                <span style="color: white">{{ storyStore.gameName }}</span>
            </template>
        </n-page-header>
        <Message />
        <ChoicePanel />
    </div>
    <GameOver v-else />
</template>

<style>
.page-header {
    padding: 15px 30px;
    background-color: #494646;
}
</style>
