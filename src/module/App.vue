<script setup lang="ts">
import Message from './components/Message.vue';
import ChoicePanel from './components/ChoicePanel.vue';
import { useStoryStore } from './store/story.ts';
import { useStateStore } from './store/state.ts';
import './api.ts';
import StatusPanel from './components/StatusPanel.vue';
import GameOver from './components/GameOver.vue';
import { ref } from 'vue';
import Menu from './components/Menu.vue';
import { Icon } from '@iconify/vue';

const storyStore = useStoryStore();
const stateStore = useStateStore();

const active = ref(false);
</script>

<template>
    <div v-if="!stateStore.isDead" style="height: 100vh; display: flex; flex-direction: column">
        <div class="page-header">
            <n-button text color="white" @click="active = true">
                <template #icon>
                    <n-icon size="30">
                        <Icon icon="material-symbols:menu" />
                    </n-icon>
                </template>
            </n-button>
            <span style="color: white; font-size: 20px; font-weight: bold; margin-left: 20px">{{
                storyStore.gameName
            }}</span>
        </div>
        <StatusPanel />
        <Message />
        <ChoicePanel />

        <n-drawer v-model:show="active" :width="300" placement="left">
            <n-drawer-content title="菜单" closable>
                <Menu />
            </n-drawer-content>
        </n-drawer>
    </div>
    <GameOver v-else />
</template>

<style>
.page-header {
    padding: 10px 30px;
    display: flex;
    align-items: center;
    height: 50px;
    background-color: black;
}
</style>
