window.ADVMaker.defineConfig({
    items: {
        Water: {
            default: 10,
            name: '水',
            summary: '水是生命之源',
            onUse: (v) => {
                window.ADVMaker.obtainStatus('sp', 5 * v);
            },
            desc: '增加5点魔力',
        },
        Fire: {
            default: 0,
            name: '火',
            summary: '或是生命之源',
        },
        Au: {
            default: 10,
            name: '金',
            summary: '或是生命之源',
        },
        Wood: {
            default: 5,
            name: '木',
            summary: '或是生命之源',
        },
        Tu: {
            default: 10,
            name: '土',
            summary: '或是生命之源',
        },
    },
    goods: {
        Water: {
            need: [
                {
                    Au: 1,
                    Tu: 2,
                },
                {
                    Au: 3,
                    Tu: 3,
                },
                {
                    Au: 3,
                    Tu: 100,
                },
            ],
        },
    },
    status: {
        base: {
            name: '基础属性',
            content: {
                hp: {
                    name: '生命值',
                    default: 10,
                    isDisplay: 'number',
                },
                sp: {
                    name: '能量槽',
                    default: 10,
                    isDisplay: 'number',
                },
            },
        },
        now: {
            name: '当前属性',
            content: {
                hpn: {
                    name: '生命值n',
                    default: 10,
                    isDisplay: 'hide',
                },
                mpn: {
                    name: '能量槽n',
                    default: 10,
                    isDisplay: 'none',
                },
            },
        },
    },
    mainScene: 'main',
    gameName: '新游戏',
});
