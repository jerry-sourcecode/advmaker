import './style.css';
import { Game } from './game';
import { useStoryStore } from './store/story';

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
