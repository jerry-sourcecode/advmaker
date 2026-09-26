import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedState from 'pinia-plugin-persistedstate';
import { gameReady, Game } from '@advmaker/core';

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedState);
app.use(pinia);

// 等待游戏配置加载完成后再挂载，确保 App.vue 的 <script setup>
// 中可直接初始化 Adv.bag / Adv.status 等状态。
gameReady.then(() => {
    app.mount('#app');
    // 挂载完成后所有 AScene 已注册，此时再启动游戏进入初始场景。
    void Game.start();
});
