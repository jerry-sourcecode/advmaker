import { ADVMaker } from '../module/api.ts';

export default ADVMaker.appendDialog('main-dialog', {
    script: ['你好', "I'm your friend.", 'Hello World!', "Let's start"],
    next: [
        {
            content: '选择1',
            next: {
                target: 10,
                modifier: [{ name: '智慧', value: () => 4 }],
                success: 'main-dialog',
                fail: 'main-dialog',
                dice: '2d6',
            },
        },
        {
            content: '选择2',
            next: ADVMaker.end('游戏结束2'),
        },
    ],
});
