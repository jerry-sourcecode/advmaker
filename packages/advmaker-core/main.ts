import './style.css';
import { Game } from './game';
import { useStoryStore } from './store/story';

// 在 Pinia 安装后动态导入游戏配置。
// 导出 gameReady Promise，供宿主应用在挂载前等待，确保配置与初始状态已就绪。
export const gameReady = import('./utils/import')
    .then(() => {
        console.log('游戏配置已加载');
        const storyStore = useStoryStore();
        if (storyStore.storyConfigObj === null) {
            console.error('config in NULL');
        } else Game.defineConfig(storyStore.storyConfigObj as any);
    })
    .catch((error) => {
        console.error('加载游戏配置时出错:', error);
    });
