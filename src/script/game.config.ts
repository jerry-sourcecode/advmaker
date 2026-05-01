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
        hp: {
            default: 100,
            name: '生命',
            color: 'red',
            min: 10,
        },
        sp: {
            default: 50,
            name: '魔力值',
        },
        aaap: {
            default: 50,
        },
        aap: {
            default: 50,
            group: '基础属性',
        },
        aaaap: {
            default: 50,
            group: '全局属性',
        },
        aaaaap: {
            default: 50,
        },
        aaaaaaap: {
            default: 50,
        },
        apaaaaa: {
            default: 50,
        },
    },
    mainScene: 'main',
    gameName: '新游戏',
});
