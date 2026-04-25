import { ADVMaker } from '../module/api.ts';
import Main from './main.vue';

export default ADVMaker.appendDialog('main-dialog', {
    script: ['你好！', '我是你的向导。', '接下来，让我们一同<b>冒险</b>吧', "Let's go!", Main],
    next: [
        {
            content: '选择1',
            next: {
                target: 10,
                modifier: [{ name: '智慧', value: () => 4 }],
                success: 'succ',
                fail: 'fail',
                dice: '2d6',
            },
            maxTimes: 3,
        },
        {
            content: '选择2',
            next: ADVMaker.end('你失败了，游戏结束').id,
        },
    ],
});

ADVMaker.appendDialog('succ', {
    script: '恭喜你，成功了！',
    next: 'main-dialog',
});

ADVMaker.appendDialog('fail', {
    script: '很遗憾，失败了！',
    next: ADVMaker.end('游戏结束，你失败了').id,
});
