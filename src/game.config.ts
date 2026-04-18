import { ADVMaker } from './module/api.ts';
import MAIN from './scene/main.ts';

ADVMaker.defineConfig({
    items: {
        Water: {
            defaultNumber: 10,
            name: '水',
        },
    },
    status: {
        hp: {
            defaultValue: 100,
            name: '生命',
            color: 'red',
        },
        sp: {
            defaultValue: 90,
            name: '魔力值',
        },
        ep: {
            defaultValue: 90,
            name: '什么值',
        },
    },
    mainScene: MAIN,
    gameName: '新游戏',
});
