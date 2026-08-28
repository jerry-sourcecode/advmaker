import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'ADVMaker docs',
    description: 'Documents for ADVMaker',
    head: [['link', { rel: 'icon', href: '/icon.png' }]],
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: '/icon.png',
        socialLinks: [
            {
                icon: "github",
                link: "https://github.com/jerry-sourcecode/advmaker"
            }
        ],
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Examples', link: '/markdown-examples' },
        ],

        sidebar: [
            {
                text: '第一章 快速开始',
                items: [
                    { text: '概况', link: '/1.guide/' },
                    { text: '安装', link: '/1.guide/1.1-install' },
                    { text: '配置', link: '/1.guide/1.2-config' },
                    { text: '场景、对话与结局', link: '/1.guide/1.3-diaSceEnd' },
                    { text: '选择', link: '/1.guide/1.4-choice' },
                    { text: '动作', link: '/1.guide/1.5-action' },
                    { text: '实战：创作你的第一个冒险故事', link: '/1.guide/1.6-work' },
                ],
            },
            {
                text: '第二章 检定',
                items: [
                    { text: '概况', link: '/2.check/' },
                    { text: '骰子', link: '/2.check/2.1-dice' },
                    { text: '检定对象', link: '/2.check/2.2-check' },
                    { text: '综合实例', link: '/2.check/2.3-example' },
                ],
            },
            {
                text: '第三章 状态记录',
                items: [
                    { text: '概况', link: '/3.state/' },
                    { text: '背包', link: '/3.state/3.1-bag' },
                    { text: '状态', link: '/3.state/3.2-status' },
                    { text: '商店与合成', link: '/3.state/3.3-shop' },
                    { text: '故事', link: '/3.state/3.4-story' },
                    { text: '记忆', link: '/3.state/3.5-memery' },
                    { text: '线索', link: '/3.state/3.6-clue' },
                    { text: '时间', link: '/3.state/3.7-time' },
                ],
            },
            {
                text: '第四章 内容进阶',
                items: [
                    { text: '概况', link: '/4.content/' },
                    { text: '音频', link: '/4.content/4.1-audio' },
                ],
            },
            {
                text: '第五章 故事组件',
                items: [
                    { text: '概况', link: '/5.component/' },
                    { text: '组件一览', link: '/5.component/5.1-overview' },
                    { text: '基础对话', link: '/5.component/5.2-basic-dialog' },
                    { text: '场景编排', link: '/5.component/5.3-scenes' },
                    { text: '选项系统', link: '/5.component/5.4-options' },
                    { text: '游戏结局', link: '/5.component/5.5-ending' },
                    { text: '高级技巧', link: '/5.component/5.6-advanced' },
                    { text: '程序控制语句', link: '/5.component/5.7-control' },
                    { text: '运行与检定', link: '/5.component/5.8-action' },
                    { text: '战斗系统', link: '/5.component/5.9-battle' },
                ],
            },
            {
                text: '第六章 错误处理',
                items: [
                    { text: '概况', link: '/6.error/' },
                    { text: 'RuntimeError 错误码参考', link: '/6.error/6.1-runtime-error' },
                ],
            },
        ],
    },
});
