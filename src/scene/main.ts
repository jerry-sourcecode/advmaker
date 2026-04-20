import { ADVMaker } from '../module/api.ts';
import MAINDIALOG from '../dialog/main.ts';

export default ADVMaker.appendScene('main', {
    name: '家中',
    next: MAINDIALOG.id,
});
