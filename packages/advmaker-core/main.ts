import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { Game } from './game';
import { useStoryStore } from './store/story';
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.mount('#app');

// 在 Pinia 安装后动态导入游戏配置
import('./utils/import')
    .then(() => {
        console.log('游戏配置已加载');
        const storyStore = useStoryStore();
        if (storyStore.storyConfigObj === null) {
            console.error('config in NULL');
        } else Game.defineConfig(storyStore.storyConfigObj as any);
        void Game.start();
    })
    .catch((error) => {
        console.error('加载游戏配置时出错:', error);
    });
