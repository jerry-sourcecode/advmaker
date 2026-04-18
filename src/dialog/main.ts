import { ADVMaker } from '../module/api.ts';

export default ADVMaker.appendDialog('main-dialog', {
    script: ['你好', "I'm your friend.", 'Hello World!', "Let's start"],
    next: ADVMaker.end('游戏结束'),
});
