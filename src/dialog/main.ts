import { Adv } from '@advmaker/core';

// ==================== 入口对话 ====================
Adv.appendDialog('entrance-dialog')
    .say('你站在月泉森林的入口，据说这里藏着一颗能实现愿望的“月光宝石”。')
    .say('一位白发老者坐在树桩上，似乎早已知晓你的到来。')
    .say('老者抬起头，缓缓说道：“年轻人，你想寻找月光宝石？那可不是那么容易的事。”')
    .say('“你需要向我证明你的勇气、智慧或者毅力。去吧，完成三个试炼之一，然后回到这里。”')
    .next()
    .choice({
        content: '前往河畔，试试钓鱼的耐心',
        next: 'river-bank',
    })
    .choice({
        content: '攀上悬崖，采一株珍贵的月光草',
        next: 'cliff-path',
    })
    .choice({
        content: '进入洞穴，解开古老的符文谜题',
        next: 'ancient-cave',
    })
    .choice({
        content: '直接离开森林（结局）',
        next: Adv.end('你退缩了，月光宝石永远留在了传说中。'),
    });

// ==================== 河畔试炼 ====================
Adv.appendDialog('river-dialog', {
    script: ['你来到月牙河畔，河水清澈见底，偶尔有鱼儿跃出水面。'],
    next: [
        {
            content: '开始钓鱼（检定）',
            next: {
                dice: 'd20',
                target: () => 12 - Math.floor(Adv.status.sanity / 20), // 理智越高目标越低
                modifier: [
                    { name: '钓鱼工具', value: () => (Adv.bag.Tool > 0 ? 3 : 0) },
                    { name: '耐心不足', value: () => -2 },
                ],
                success: 'fish-success',
                fail: 'fish-fail',
                onSuccess: () => {
                    Adv.status.sanity += 5;
                    Adv.print('你的耐心得到了回报，理智略微上升。');
                },
                onFail: () => {
                    Adv.status.sanity -= 100;
                    Adv.print('一无所获让你烦躁，理智下降了。');
                },
            },
        },
        { content: '返回入口', next: 'forest-entrance' },
    ],
});

Adv.appendDialog('fish-success', {
    script: ['你钓起一尾闪着银光的月牙鱼！老者的考验通过了。'],
    next: 'back-to-oldman',
});

Adv.appendDialog('fish-fail', {
    script: ['你坐了一下午，连个鱼影都没看见，只好空手而归。'],
    next: 'back-to-oldman',
});

// ==================== 悬崖试炼（攀爬检定） ====================
Adv.appendDialog('cliff-dialog', {
    script: ['鹰喙悬崖陡峭险峻，山风呼啸而过。'],
    next: [
        {
            content: '尝试攀爬（检定）',
            next: {
                dice: '2d8', // 两个八面骰
                target: () => 10 + (100 - Adv.status.hp) / 10, // 生命越低目标越高
                modifier: [
                    { name: '体力加成', value: () => Math.floor(Adv.status.stamina / 10) },
                    { name: '恐惧影响', value: () => -Math.floor((100 - Adv.status.sanity) / 20) },
                ],
                success: 'climb-success',
                fail: 'climb-fail',
            },
        },
        { content: '返回入口', next: 'forest-entrance' },
    ],
});

Adv.appendDialog('climb-success', {
    script: ['你手脚并用，终于攀上崖顶，摘下一株发光的月光草。', '老者的考验通过了。'],
    next: 'back-to-oldman',
});

Adv.appendDialog('climb-fail', {
    script: ['爬到一半时岩石碎裂，你摔了下来，受了轻伤。'],
    next: 'back-to-oldman',
    onStart: () => {
        Adv.status.hp -= 15;
        Adv.print('你损失了15点生命值。');
    },
});

// ==================== 洞穴试炼（符文解谜） ====================
Adv.appendDialog('cave-dialog', {
    script: ['洞穴深处刻着三行符文，似乎需要按顺序点亮。'],
    next: [
        {
            content: '尝试解读符文（检定）',
            next: {
                dice: 'd12',
                target: 7,
                modifier: [
                    { name: '理智分析', value: () => Math.floor(Adv.status.sanity / 15) },
                    { name: '背包有工具', value: () => (Adv.bag.Tool > 0 ? 2 : 0) },
                ],
                success: 'rune-success',
                fail: 'rune-fail',
            },
        },
        { content: '返回入口', next: 'forest-entrance' },
    ],
});

Adv.appendDialog('rune-success', {
    script: ['你正确解开了符文，一道隐藏的门缓缓打开，里面躺着一颗暗淡的宝石。'],
    next: 'back-to-oldman',
    onStart: () => {
        Adv.bag.MoonGem = (Adv.bag.MoonGem || 0) + 1; // 提前获得宝石，但未激活
        Adv.status.moonAffinity += 5;
    },
});

Adv.appendDialog('rune-fail', {
    script: ['符文突然发出刺眼红光，你头痛欲裂，慌忙逃出洞穴。'],
    next: 'back-to-oldman',
    onStart: () => {
        Adv.status.sanity = Math.max(0, Adv.status.sanity - 20);
        Adv.print('你的理智大幅下降！');
    },
});

// ==================== 回到老者身边 ====================
Adv.appendDialog('back-to-oldman', {
    script: ['你回到了森林入口，老者微微一笑。'],
    next: {
        dice: 'd20',
        target: () => {
            // 根据完成试炼的情况，动态降低难度（直接记录隐藏标志）
            // 这里简单用背包里是否有月光草或者月牙鱼或者符文宝石来判断
            let bonus = 0;
            if (Adv.bag.MoonGem) bonus += 5;
            // 实际中应该用更精确的全局flag，这里为简化，用月泉亲和代替
            return 15 - Adv.status.moonAffinity;
        },
        modifier: [
            { name: '完成试炼', value: () => (Adv.bag.MoonGem ? 3 : Adv.bag.Herb ? 2 : 0) },
            { name: '理智影响', value: () => Math.floor((Adv.status.sanity - 50) / 10) },
        ],
        success: 'get-gem',
        fail: 'no-gem',
    },
});

Adv.appendDialog('get-gem', {
    script: [
        '老者满意地点头：“你确实有资格。这颗月光宝石，就交给你了。”',
        '他将一颗温润的宝石递给你，宝石散发出柔和的月光。',
        '“去月泉神庙吧，那里有你想要的答案。”',
    ],
    next: 'moon-temple',
    onStart: () => {
        Adv.bag.MoonGem = (Adv.bag.MoonGem || 0) + 1;
        Adv.char.oldMan.impression.push('他亲手将宝石托付给你，眼中充满希望。');
        Adv.status.moonAffinity += 10;
    },
});

Adv.appendDialog('no-gem', {
    script: ['老者叹了口气：“看来你的历练还不够，无法获得宝石……”', '“也许你该再去试试其他方法。”'],
    next: 'forest-entrance', // 回到入口重新选择
});

// ==================== 最终神庙 ====================
Adv.appendDialog('temple-dialog', {
    script: [
        '你来到月泉神庙，月光透过穹顶洒在中央的祭坛上。',
        '祭坛上有一个凹槽，形状恰好与月光宝石吻合。',
    ],
    next: [
        {
            content: '放入月光宝石（成功结局）',
            visible: () => Adv.bag.MoonGem > 0,
            next: 'ending-good',
        },
        {
            content: '尝试用其他物品代替',
            visible: () => Adv.bag.MoonGem === 0,
            next: 'alternative-check',
        },
        {
            content: '强行破坏祭坛（疯狂结局）',
            visible: () => Adv.status.sanity < 30,
            next: 'ending-mad',
        },
    ],
});

// 没有宝石时的替代检定（使用高难度合成或献祭）
Adv.appendDialog('alternative-check', {
    script: ['你决定试试其他方法激活祭坛……'],
    next: {
        dice: '2d10',
        target: 18, // 极高难度
        modifier: [
            { name: '月泉亲和', value: () => Adv.status.moonAffinity },
            { name: '理智之力', value: () => Math.floor(Adv.status.sanity / 10) },
            { name: '献祭草药', value: () => (Adv.bag.Herb >= 5 ? 3 : 0) },
        ],
        success: 'alt-success',
        fail: 'ending-bad',
        onSuccess: () => {
            Adv.bag.Herb -= 5; // 消耗草药
            Adv.status.hp -= 30; // 代价
            Adv.print('你献祭了5份草药，生命减少了30点，但奇迹发生了……');
        },
    },
});

Adv.appendDialog('alt-success', {
    script: [
        '祭坛泛起了微弱的蓝光，虽然不如月光宝石强烈，但足够打开神庙后方的秘库。',
        '你找到了一些古代遗物，也算不虚此行。',
    ],
    next: Adv.end('虽然没有得到宝石，但你发现了月泉的秘密文献，成为了学者。'),
});
