import { ADVMaker } from './module/api.ts';
import MAIN from './scene/main.ts'

ADVMaker.defineConfig({
    items: {
        Water: {
            defaultNumber: 10,
            name: '水',
        },
    },
    mainScene: MAIN,
    gameName: '新游戏',
});
