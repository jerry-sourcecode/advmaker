import type { GameConfig } from './module/type/user';

const config = {
    mainScene: 'attic',
    gameName: '阁楼迷踪',
    items: {
        Water: {},
    },
    goods: {
        Water: {
            need: {},
        },
    },
} satisfies GameConfig;

export default config;
