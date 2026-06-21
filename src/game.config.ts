import { Adv } from '@advmaker/core';

export default Adv.defineConfig({
    mainScene: 'main',
    gameName: '追书人',
    judgmentMode: 'percent',

    // 角色状态（理智与生命）
    status: {
        main: {
            name: '主要属性',
            content: {
                str: {
                    name: '力量',
                    max: 100,
                    default: 80,
                    isDisplay: 'hide',
                },
                con: {
                    name: '体质',
                    max: 100,
                    min: 0,
                    default: 60,
                    isDisplay: 'hide',
                },
                siz: {
                    name: '体型',
                    max: 100,
                    min: 0,
                    default: 60,
                    isDisplay: 'hide',
                },
                dex: {
                    name: '敏捷',
                    max: 100,
                    min: 0,
                    default: 70,
                    isDisplay: 'hide',
                },
                app: {
                    name: '外貌',
                    max: 100,
                    min: 0,
                    default: 40,
                    isDisplay: 'hide',
                },
                edu: {
                    name: '教育',
                    max: 100,
                    min: 0,
                    default: 50,
                    isDisplay: 'hide',
                },
                int: {
                    name: '智力',
                    max: 100,
                    min: 0,
                    default: 50,
                    isDisplay: 'hide',
                },
                pow: {
                    name: '意志',
                    max: 100,
                    min: 0,
                    default: 50,
                    isDisplay: 'hide',
                },
            },
        },
        secondary: {
            name: '次要属性',
            content: {
                hp: {
                    name: '耐久值',
                    max: 12,
                    min: 0,
                    default: 12,
                    color: '#ff0005',
                    isDisplay: 'process',
                },
                san: {
                    name: '理智',
                    max: 100,
                    min: 0,
                    default: 50,
                    color: '#5627ea',
                    isDisplay: 'process',
                },
                luck: {
                    name: '幸运',
                    max: 100,
                    min: 0,
                    default: 50,
                    color: '#035fe9',
                    isDisplay: 'process',
                },
                mp: {
                    name: '魔法值',
                    max: 24,
                    min: 0,
                    default: 10,
                    color: '#16c820',
                    isDisplay: 'process',
                },
            },
        },
        skills: {
            name: '技能',
            content: {
                // 一、社交交涉类
                Accounting: {
                    name: '会计',
                    max: 100,
                    default: 5, // 基础05% + 无加点
                    isDisplay: 'hide',
                },
                FastTalk: {
                    name: '花言巧语',
                    max: 100,
                    default: 30, // 基础05% + 最大加值25
                    isDisplay: 'hide',
                },
                Charm: {
                    name: '魅惑',
                    max: 100,
                    default: 30, // 基础15% + 最大加值15
                    isDisplay: 'hide',
                },
                CreditRating: {
                    name: '信用评级',
                    max: 100,
                    default: 40, // 基础00% + 最大加值40
                    isDisplay: 'hide',
                },
                Disguise: {
                    name: '伪装',
                    max: 100,
                    default: 5, // 基础05% + 无加点
                    isDisplay: 'hide',
                },
                Intimidate: {
                    name: '恐吓',
                    max: 100,
                    default: 65, // 基础15% + 最大加值50
                    isDisplay: 'hide',
                },
                Persuade: {
                    name: '说服',
                    max: 100,
                    default: 20, // 基础10% + 最大加值10
                    isDisplay: 'hide',
                },
                Psychology: {
                    name: '心理学',
                    max: 100,
                    default: 20, // 基础10% + 最大加值10
                    isDisplay: 'hide',
                },
                Psychoanalysis: {
                    name: '精神分析',
                    max: 100,
                    default: 1, // 基础01% + 无加点
                    isDisplay: 'hide',
                },
                Law: {
                    name: '法律',
                    max: 100,
                    default: 5, // 基础05% + 无加点
                    isDisplay: 'hide',
                },

                // 二、格斗与枪械战斗类
                FightingBrawl: {
                    name: '徒手搏斗',
                    max: 100,
                    default: 85, // 基础25% + 最大加值60
                    isDisplay: 'hide',
                },
                FirearmsHandgun: {
                    name: '手枪',
                    max: 100,
                    default: 40, // 基础20% + 最大加值20
                    isDisplay: 'hide',
                },
                FirearmsRifleShotgun: {
                    name: '步枪/霰弹枪',
                    max: 100,
                    default: 50, // 基础25% + 最大加值25
                    isDisplay: 'hide',
                },
                Dodge: {
                    name: '闪避',
                    max: 100,
                    default: 70, // 基础35 + 最大加值35（基础为敏捷一半，但此处直接使用给定数值）
                    isDisplay: 'hide',
                },
                Throw: {
                    name: '投掷',
                    max: 100,
                    default: 40, // 基础20% + 最大加值20
                    isDisplay: 'hide',
                },

                // 三、学术知识类
                Anthropology: {
                    name: '人类学',
                    max: 100,
                    default: 1, // 基础01% + 无加点
                    isDisplay: 'hide',
                },
                Archaeology: {
                    name: '考古学',
                    max: 100,
                    default: 1, // 基础01% + 无加点
                    isDisplay: 'hide',
                },
                ArtCraft: {
                    name: '艺术/手工艺',
                    max: 100,
                    default: 5, // 基础05% + 无加点
                    isDisplay: 'hide',
                },
                LibraryUse: {
                    name: '图书馆使用',
                    max: 100,
                    default: 40, // 基础20% + 最大加值20
                    isDisplay: 'hide',
                },
                History: {
                    name: '历史',
                    max: 100,
                    default: 5, // 基础05% + 无加点
                    isDisplay: 'hide',
                },
                Occult: {
                    name: '神秘学',
                    max: 100,
                    default: 10, // 基础05% + 最大加值5
                    isDisplay: 'hide',
                },
                Science: {
                    name: '科学',
                    max: 100,
                    default: 1, // 基础01% + 无加点
                    isDisplay: 'hide',
                },
                CthulhuMythos: {
                    name: '克苏鲁神话',
                    max: 100,
                    default: 0, // 基础00% + 无加点
                    isDisplay: 'hide',
                },

                // 四、侦查感知类
                Appraise: {
                    name: '估价鉴定',
                    max: 100,
                    default: 5, // 基础05% + 无加点
                    isDisplay: 'hide',
                },
                Listen: {
                    name: '聆听',
                    max: 100,
                    default: 40, // 基础20% + 最大加值20
                    isDisplay: 'hide',
                },
                Stealth: {
                    name: '潜行隐匿',
                    max: 100,
                    default: 60, // 基础20% + 最大加值40
                    isDisplay: 'hide',
                },
                SpotHidden: {
                    name: '搜寻隐藏物品',
                    max: 100,
                    default: 50, // 基础25% + 最大加值25
                    isDisplay: 'hide',
                },
                Track: {
                    name: '追踪',
                    max: 100,
                    default: 60, // 基础10% + 最大加值50
                    isDisplay: 'hide',
                },

                // 五、体能运动类
                Climb: {
                    name: '攀爬',
                    max: 100,
                    default: 60, // 基础20% + 最大加值40
                    isDisplay: 'hide',
                },
                Jump: {
                    name: '跳跃',
                    max: 100,
                    default: 70, // 基础20% + 最大加值50
                    isDisplay: 'hide',
                },
                NaturalWorld: {
                    name: '野外常识',
                    max: 100,
                    default: 20, // 基础10% + 最大加值10
                    isDisplay: 'hide',
                },
                Survival: {
                    name: '野外求生',
                    max: 100,
                    default: 10, // 基础10% + 无加点
                    isDisplay: 'hide',
                },
                Swim: {
                    name: '游泳',
                    max: 100,
                    default: 40, // 基础20% + 最大加值20
                    isDisplay: 'hide',
                },

                // 六、机械、驾驶、工程类
                Locksmith: {
                    name: '开锁',
                    max: 100,
                    default: 22, // 基础01% + 最大加值21
                    isDisplay: 'hide',
                },
                MechanicalRepair: {
                    name: '机械维修',
                    max: 100,
                    default: 80, // 基础10% + 最大加值70
                    isDisplay: 'hide',
                },
                DriveAuto: {
                    name: '驾驶汽车',
                    max: 100,
                    default: 60, // 基础20% + 最大加值40
                    isDisplay: 'hide',
                },
                HeavyMachineryRepair: {
                    name: '重型器械维修',
                    max: 100,
                    default: 50, // 基础10% + 最大加值40
                    isDisplay: 'hide',
                },
                OperateHeavyMachine: {
                    name: '重型机械操作',
                    max: 100,
                    default: 1, // 基础01% + 无加点
                    isDisplay: 'hide',
                },
                Navigate: {
                    name: '导航',
                    max: 100,
                    default: 50, // 基础10% + 最大加值40
                    isDisplay: 'hide',
                },
                Pilot: {
                    name: '飞行器驾驶',
                    max: 100,
                    default: 1, // 基础01% + 无加点
                    isDisplay: 'hide',
                },
                Ride: {
                    name: '骑乘',
                    max: 100,
                    default: 5, // 基础05% + 无加点
                    isDisplay: 'hide',
                },

                // 七、医疗救治类
                FirstAid: {
                    name: '急救',
                    max: 100,
                    default: 60, // 基础30% + 最大加值30
                    isDisplay: 'hide',
                },
                Medicine: {
                    name: '医学',
                    max: 100,
                    default: 1, // 基础01% + 无加点
                    isDisplay: 'hide',
                },

                // 八、语言类
                LanguageOwnEnglish: {
                    name: '母语（英语）',
                    max: 100,
                    default: 100, // 基础50% + 最大加值50 = 100
                    isDisplay: 'hide',
                },
                LanguageOtherItalian: {
                    name: '外语（意大利语）',
                    max: 100,
                    default: 26, // 基础01% + 最大加值25
                    isDisplay: 'hide',
                },

                // 九、巧手杂项
                SleightOfHand: {
                    name: '戏法/妙手',
                    max: 100,
                    default: 20, // 基础10% + 最大加值10
                    isDisplay: 'hide',
                },
            },
        },
    },

    // 物品（书籍）
    items: {
        forbiddenBook: {
            name: '死灵之书',
            summary: '一本充满禁忌知识的古书',
            desc: '封面刻有诡异的符号，散发着不祥的气息。',
            lore: '据说阅读此书会让人疯狂。',
        },
    },

    // 菜单显示
    menu: {
        bag: true,
        attu: true,
        shop: false,
        save: true,
        story: false,
    },
});
