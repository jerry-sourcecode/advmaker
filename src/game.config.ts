import { Adv } from '@advmaker/core';

export default Adv.defineConfig({
    mainScene: 's1',
    gameName: 'ADVMaker 规范测试',
    judgmentMode: 'd20',

    // ========== 状态系统 ==========
    status: {
        combat: {
            name: '战斗属性',
            content: {
                hp: {
                    name: '生命值',
                    max: 100,
                    default: 85,
                    color: '#d32f2f',
                    isDisplay: 'process',
                },
                mp: {
                    name: '法力',
                    max: 60,
                    default: 40,
                    color: '#1976d2',
                    isDisplay: 'number',
                },
            },
        },
        survival: {
            name: '生存状态',
            content: {
                stamina: {
                    name: '体力',
                    max: 80,
                    default: 60,
                    color: '#388e3c',
                    isDisplay: 'process',
                },
                sanity: {
                    name: '理智',
                    max: 100,
                    min: 0,
                    default: 75,
                    color: '#7b1fa2',
                    isDisplay: 'process',
                },
            },
        },
    },

    // ========== 背包物品 ==========
    items: {
        Gold: {
            name: '金币',
            summary: '通用货币',
            default: 100,
        },
        Herb: {
            name: '草药',
            summary: '可用于合成药水',
            default: 3,
        },
        HealthPotion: {
            name: '治疗药水',
            summary: '恢复30生命值',
            desc: '饮用后立即恢复 <b>30</b> HP。',
            onUse: (num) => {
                const heal = 30 * num;
                Adv.status.hp = Math.min(Adv.status.hp + heal, 100);
                Adv.print(`你使用了 ${num} 瓶药水，恢复了 ${heal} 生命。`);
            },
        },
        MagicGem: {
            name: '魔法宝石',
            summary: '闪耀着神秘光芒',
            default: 0,
        },
    },

    // ========== 故事角色 ==========
    character: {
        alchemist: {
            name: '炼金术士',
            desc: '白发苍苍的老者，精通各种配方。',
            impression: ['他手中总拿着一本泛黄的手记。'],
        },
        shadow: {
            name: '暗影商人',
            desc: '兜帽下看不清面容，声音低沉。',
            impression: [],
        },
    },
});
