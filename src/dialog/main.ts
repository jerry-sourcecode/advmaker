import { ADVMaker } from '../module/api.ts';
import Main from './main.vue';

export default ADVMaker.appendDialog('main-dialog', {
    script: ['你好', "I'm your friend.", 'Hello World!', "Let's start", Main],
    next: [
        {
            content: Main,
            next: {
                target: 10,
                modifier: [{ name: '智慧', value: () => 4 }],
                success: 'main-dialog',
                fail: 'main-dialog',
                dice: '2d6',
            },
            maxTimes: 3,
        },
        {
            content: '选择2',
            next: ADVMaker.end('游戏结束2').id,
        },
    ],
});
