import { Adv } from '@advmaker/core';

// 森林入口（起点）
Adv.appendScene('forest-entrance', {
    name: '月泉森林·入口',
    next: 'entrance-dialog',
    onEnter: () => {
        Adv.print('林间吹来一阵凉风，带着草木的清香。');
    },
});

// 河岸边（含钓鱼检定）
Adv.appendScene('river-bank', {
    name: '月牙河畔',
    next: 'river-dialog',
});

// 悬崖小径（含攀爬检定）
Adv.appendScene('cliff-path', {
    name: '鹰喙悬崖',
    next: 'cliff-dialog',
});

// 古老洞穴
Adv.appendScene('ancient-cave', {
    name: '回声洞穴',
    next: 'cave-dialog',
});

// 月泉神庙（最终场景）
Adv.appendScene('moon-temple', {
    name: '月泉神庙',
    next: 'temple-dialog',
});

// 结局场景（直接展示结束语）
Adv.appendScene('ending-good', {
    name: '结局',
    next: Adv.end('你高举月光宝石，月泉光芒大盛，你成为新一代守护者……'),
});
Adv.appendScene('ending-bad', {
    name: '结局',
    next: Adv.end('你没能获得宝石，月泉干涸，你失落地离开了森林。'),
});
Adv.appendScene('ending-mad', {
    name: '结局',
    next: Adv.end('你精神崩溃，从此迷失在森林中，再也没有人见过你。'),
});
