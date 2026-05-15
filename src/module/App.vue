<script setup lang="ts">
import Message from './components/Message.vue';
import ChoicePanel from './components/ChoicePanel.vue';
import { useStoryStore } from './store/story.ts';
import { useStateStore } from './store/state.ts';
import './api.ts';
import StatusPanel from './components/StatusPanel.vue';
import GameOver from './components/GameOver.vue';
import { computed, ref } from 'vue';
import Menu from './components/Menu/Menu.vue';
import { Icon } from '@iconify/vue';
import type { GlobalThemeOverrides } from 'naive-ui';
import { useEmitter } from './store/emitter.ts';
import Shop from './components/Menu/Shop.vue';
import Memory from './components/Menu/Memory.vue';

const storyStore = useStoryStore();
const stateStore = useStateStore();

const active = ref(false);

const isMobile = computed(() => window.innerWidth < 768);

// 根据设备动态设置 common.fontSize
const themeOverrides = computed<GlobalThemeOverrides>(() => ({
    common: {
        fontSize: isMobile.value ? '14px' : '18px', // 默认14px，PC/平板用17px
    },
}));

const emitter = useEmitter();
const showShopModal = ref(false);
const showMemoryModal = ref(false);
emitter.on('open-shop', () => (showShopModal.value = true));
emitter.on('open-save', () => (showMemoryModal.value = true));
</script>

<template>
    <n-config-provider :theme-overrides="themeOverrides">
        <n-dialog-provider>
            <div
                v-if="!stateStore.isDead"
                style="height: 100vh; display: flex; flex-direction: column"
            >
                <div class="page-header">
                    <n-button text color="white" @click="active = true">
                        <template #icon>
                            <n-icon size="30">
                                <Icon icon="material-symbols:menu" />
                            </n-icon>
                        </template>
                    </n-button>
                    <span
                        style="color: white; font-size: 20px; font-weight: bold; margin-left: 20px"
                        >{{ storyStore.gameName }}</span
                    >
                </div>
                <StatusPanel />
                <Message />
                <ChoicePanel />

                <n-drawer v-model:show="active" :width="300" placement="left">
                    <n-drawer-content title="菜单" closable>
                        <Menu :shop="showShopModal" :memory="showMemoryModal" />
                    </n-drawer-content>
                </n-drawer>
                <Shop v-model="showShopModal" />
                <Memory v-model="showMemoryModal" />
            </div>
            <GameOver v-else />
        </n-dialog-provider>
    </n-config-provider>
</template>

<style>
.page-header {
    padding: 5px 30px;
    display: flex;
    align-items: center;
    height: 70px;
    background-color: black;
    box-shadow: 0 10px 10px -5px rgba(0, 0, 0, 0.5);
}
</style>
