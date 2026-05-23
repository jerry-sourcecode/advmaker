import { Adv } from '@advmaker/core';

export default Adv.defineConfig({
    mainScene: 'forest-entrance', // 游戏入口场景
    gameName: '月泉秘语',

    // ========== 状态系统（角色属性） ==========
    status: {
        basic: {
            name: '基础状态',
            content: {
                hp: {
                    name: '生命值',
                    max: 100,
                    default: 80,
                    color: '#d32f2f',
                    isDisplay: 'process',
                },
                stamina: {
                    name: '体力',
                    max: 100,
                    default: 70,
                    color: '#388e3c',
                    isDisplay: 'process',
                },
                sanity: {
                    name: '理智',
                    max: 100,
                    min: 0,
                    default: 60,
                    color: '#7b1fa2',
                    isDisplay: 'number',
                },
            },
        },
        hidden: {
            name: '隐藏属性',
            content: {
                // 隐藏的“月泉亲和度”，影响结局
                moonAffinity: {
                    name: '月泉亲和',
                    default: 0,
                    min: -20,
                    max: 20,
                    isDisplay: 'none',
                },
            },
        },
    },

    // ========== 背包物品 ==========
    items: {
        Herb: {
            name: '草药',
            summary: '散发着清香的野生草药，可以恢复少量生命。',
            desc: '直接使用恢复 <b>15</b> 点生命值。<br>也可用于合成药水。',
            onUse: (num: number) => {
                Adv.status.hp = Math.min(Adv.status.hp + 15 * num);
                Adv.print(`你使用了 ${num} 份草药，恢复了 ${15 * num} 生命。`);
            },
        },
        Wood: {
            name: '木材',
            summary: '结实的松木，可以用来生火或制作工具。',
        },
        Stone: {
            name: '石块',
            summary: '普通的河卵石，或许有别的用途。',
        },
        Gold: {
            name: '金币',
            summary: '闪闪发光的金币，可以在商人那里购买物品。',
        },
        HealthPotion: {
            name: '生命药水',
            summary: '一瓶红色的药水，能瞬间恢复大量生命。',
            desc: '饮用后恢复 <b>50</b> 点生命值。',
            onUse: () => {
                Adv.status.hp = Math.min(Adv.status.hp + 50);
                Adv.print('你喝下生命药水，伤口快速愈合！');
            },
        },
        MoonGem: {
            name: '月光宝石',
            summary: '传说中的宝石，散发着柔和的月白色光芒。',
            desc: '蕴藏着月泉的神秘力量，是开启神庙的钥匙。',
        },
        Tool: {},
    },

    // ========== 商店/合成配方 ==========
    goods: {
        HealthPotion: {
            inventory: 3, // 限量3瓶
            need: { Herb: 2, Gold: 5 },
        },
        // 可以用木材+石块合成一个“临时工具”（非物品，直接触发检定增益）
        // 这里为了展示更复杂的need数组，再做一个“多功能工具”物品
        Tool: {
            inventory: Infinity,
            need: [{ Wood: 3 }, { Stone: 4 }], // 两种配方任选其一
        },
    },

    // ========== 角色故事 ==========
    character: {
        oldMan: {
            name: '神秘老者',
            desc: '住在森林深处的一位白发老人，似乎知道月泉的秘密。',
            impression: [],
        },
        forestSpirit: {
            name: '森林妖精',
            desc: '一只发着微光的小精灵，性格顽皮但心地善良。',
            impression: [],
        },
    },
});
