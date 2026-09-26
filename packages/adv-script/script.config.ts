import type { AdvBuildConfig } from "./index";

const config: AdvBuildConfig = {
    // ADVScript 源目录
    srcDir: "./src/script",

    // 生成的 Vue 组件输出目录
    outDir: "./src/dist",

    // 排除规则（简化版 glob）
    exclude: [
        "**/node_modules/**",
        "**/.git/**",
        "**/*.draft.adv",
        "**/_*/**",       // 下划线开头的目录/文件视为草稿
    ],

    // 保留源目录结构
    // true:  src/script/ch1/intro.adv → src/dist/ch1/intro.vue
    // false: src/script/ch1/intro.adv → src/dist/intro.vue
    preserveStructure: true,

    // 输出扩展名（默认 .vue）
    outputExt: ".vue",

    // 主文件已存在时是否覆盖
    overwriteMainFile: true,
};

export default config;