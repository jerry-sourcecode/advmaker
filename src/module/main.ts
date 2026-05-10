import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { Game } from './game.ts';
import config from '../script/game.config.ts';
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.mount('#app');

// 在 Pinia 安装后动态导入游戏配置
import('./utils/import.ts')
    .then(() => {
        console.log('游戏配置已加载');
        Game.defineConfig(config);
        Game.start();
    })
    .catch((error) => {
        console.error('加载游戏配置时出错:', error);
    });
