window.ADVMaker.defineConfig({
    items: {
        Water: {
            number: 10,
            name: '水',
            summary: '水是生命之源',
            onUse: (v) => {
                window.ADVMaker.obtainStatus('sp', 5 * v);
            },
            desc: '增加5点魔力',
        },
        Fire: {
            number: 5,
            name: '火',
            summary: '或是生命之源',
        },
        Au: {
            number: 5,
            name: '金',
            summary: '或是生命之源',
        },
        Wood: {
            number: 5,
            name: '木',
            summary: '或是生命之源',
        },
        Tu: {
            number: 5,
            name: '土',
            summary: '或是生命之源',
        },
    },
    status: {
        base: {
            name: '基础属性',
            content: {
                hp: {
                    name: '生命值',
                    default: 10,
                    isDisplay: 'process',
                },
                mp: {
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
