import type {
    BattleAction,
    BattleItem,
    CheckItem,
    Dialog,
    Document,
    EnemyEntry,
    IfItem,
    ModifierEntry,
    Option,
    RawGameConfig,
    Scene,
    ScriptItem,
    Target,
} from "./type";
import { parseArrowFunction } from "./utils";

/** 敌人模板中属于代码块的字段 */
const ENEMY_CODE_FIELDS = new Set(["move", "onUse"]);
/** 战斗动作中属于代码块的字段 */
const ACTION_CODE_FIELDS = new Set(["onUse"]);
/** 物品中属于代码块的字段 */
const ITEM_CODE_FIELDS = new Set(["onUse", "onDiscard"]);

export class Translater {
    /** 生成过程中收集的代码块常量定义（写入 <script setup>） */
    private codeDefs: string[] = [];
    private codeSeq = 0;
    /** 语法解析出的 game 配置（原始 AST 形态，输出时再按引擎模型翻译） */
    private config: RawGameConfig = {};

    /** 收集 game 配置块（来源：`Document.game`）。 */
    setGameConfig(obj: RawGameConfig) {
        this.config = mergeObjects(this.config, obj);
    }
    /**
     * 把一个 .adv 文件的 AST 翻译为 **不含 AShell** 的 Vue SFC 组件。
     *
     * 生成的组件内部只有 <AScene> / <ADialog>（平铺），由主文件 App.vue 统一
     * 用 <AShell> 包裹。这样可以安全地在一个 AShell 下组合多个 .adv 组件。
     */
    toVueComponent(obj: Document): string {
        this.codeDefs = [];
        this.codeSeq = 0;

        const scenes = this.mergeScene(obj.scenes);
        const globalCode = this.mergeGlobalCode(obj);
        const defs = this.codeDefs.join('\n');

        // 收集模板里用到的 A* 组件与 Adv
        const used = new Set<string>();               // ← 不再默认包含 AShell
        for (const m of scenes.matchAll(/<\/?(A[A-Za-z0-9]*)/g)) used.add(m[1]);

        const ALL = [
            'AScene', 'ADialog', 'ALine', 'AOptions', 'AOption',
            'AEnding', 'AIf', 'AElif', 'AElse', 'AGoto', 'ARun',
            'ACheck', 'ABattle', 'Adv',
        ];
        const imports = ALL.filter((n) => used.has(n)).join(', ');
        const importLine = imports.length > 0
            ? `import { ${imports} } from '@advmaker/core'`
            : '';

        return /* html */`
<template>
${scenes}
</template>

<script setup lang="ts">
${importLine}
${globalCode}
${defs}
</script>
`.trim();
    }
    /**
     * 把 game 模块配置翻译为引擎的 `GameConfig`（见 data/model.ts）。
     *
     * 与语法 AST 的差异（在此处对齐）：
     *  - item   : `{ name, props }` 展平为 `{ name, ...props }`（ADVUserItem）
     *  - status : 属性 `{ id, name, props }` -> `{ name, ...props }`；
     *             `range:{min,max}` 展开为 `min`/`max`，`display` 已改为 `isDisplay`
     *  - char   : 键 `character`，`{ name, props }` -> `{ name, desc, impression }`
     *  - clue   : 仅保留 `name`
     *  - enemy  : 不在 GameConfig 内，独立导出为 `enemies`
     *  - recipes: 不在 GameConfig 内，改用 `Adv.defineRecipe(id, goods)` 注册
     */
    toGameConfig(): string {
        const cfg = this.config || {};
        const configObj: Record<string, unknown> = {};

        if (cfg.gameName !== undefined) configObj.gameName = cfg.gameName;
        if (cfg.mainScene !== undefined) configObj.mainScene = cfg.mainScene;
        if (cfg.judgmentMode !== undefined) configObj.judgmentMode = cfg.judgmentMode;
        if (cfg.menu) configObj.menu = cfg.menu;
        if (cfg.time) configObj.time = cfg.time;

        if (cfg.items) {
            configObj.items = mapValues(cfg.items, (it) => ({ name: it.name, ...it.props }));
        }
        if (cfg.status) {
            configObj.status = mapValues(cfg.status, (g) => ({
                name: g.name,
                content: mapValues(g.content, (st) => ({ name: st.name, ...st.props })),
            }));
        }
        if (cfg.character) {
            configObj.character = mapValues(cfg.character, (c) => ({ name: c.name, ...c.props }));
        }
        if (cfg.clue) {
            configObj.clue = mapValues(cfg.clue, (c) => ({ name: c.name }));
        }

        const out: string[] = [`import { Adv } from '@advmaker/core'`, ''];

        // 主配置：代码块字段（onUse/onDiscard）内联为箭头函数
        out.push(`export default Adv.defineConfig(${this.objExpr(configObj, ITEM_CODE_FIELDS)})`);

        // 配方：不在 GameConfig 内，改用 Adv.defineRecipe 注册
        if (cfg.recipes) {
            out.push('');
            out.push(
                Object.entries(cfg.recipes)
                    .map(([id, r]) => `Adv.defineRecipe(${JSON.stringify(id)}, ${this.objExpr(r.props as Record<string, unknown>, new Set())})`)
                    .join('\n')
            );
        }

        return out.join('\n');
    }
    /** 把代码块注册为 <script setup> 中的常量并返回常量名。
     *  模板里只引用常量名，避免代码中的引号（" 或 '）破坏模板属性。 */
    private useCode(code: string): string {
        const name = `__code${this.codeSeq++}`;
        this.codeDefs.push(`const ${name} = ${code};`);
        return name;
    }
    /** HTML 属性值转义（用于普通属性与绑定表达式） */
    private esc(s: string): string {
        return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    }
    private mergeGlobalCode(obj: Document) {
        // 代码块是箭头函数源码（如 `() => { ... }`）
        return obj.codes ? obj.codes.map((c) => `${parseArrowFunction(c)?.body}`).join('\n') : '';
    }
    private mergeScene(obj: Scene[]) {
        let ret = "";
        obj.forEach((v) => {
            const attrs: string[] = [];
            if (v.props.onEnter) attrs.push(`:on-enter="${this.useCode(v.props.onEnter)}"`);
            if (v.props.onLeave) attrs.push(`:on-leave="${this.useCode(v.props.onLeave)}"`);

            // 场景 `=> X` 的归属：
            //  - 无对话：直接作为场景的 next；
            //  - 有对话：接到最后一个对话之后（场景自身交由 autoNext 指向第一个对话）。
            // 未写 `=>` 时不输出 :next —— 否则 AScene 会把 null 当成“显式 next”，
            // 覆盖 AStory 的 autoNext，导致该场景的对话永远不播放。
            if (v.props.next) {
                if (v.dialogs.length > 0) {
                    const last = v.dialogs[v.dialogs.length - 1];
                    if (last.props.next === undefined) last.props.next = v.props.next;
                } else {
                    attrs.unshift(`:next="${this.useCode(this.targetExpr(v.props.next))}"`);
                }
            }

            ret += /* html */`
<AScene id="${this.esc(v.id)}" name="${this.esc(v.displayName)}"${attrs.length ? " " + attrs.join(" ") : ""}>
    ${this.mergeDialog(v.dialogs)}
</AScene>
`.trim()
        })
        return ret;
    }
    private mergeDialog(dialogs: Dialog[]) {
        let ret = "";
        dialogs.forEach((v) => {
            const attrs: string[] = [];
            if (v.id) attrs.push(`id="${this.esc(v.id)}"`);
            if (v.in) attrs.push(`:in="${this.useCode(JSON.stringify(v.in))}"`);
            if (v.props.next !== undefined && v.props.next !== null) {
                attrs.push(`:next="${this.useCode(this.targetExpr(v.props.next))}"`);
            }
            if (v.props.onStart) attrs.push(`:on-start="${this.useCode(v.props.onStart)}"`);
            if (v.props.onFinish) attrs.push(`:on-finish="${this.useCode(v.props.onFinish)}"`);

            ret += /* html */`
<ADialog ${attrs.length ? " " + attrs.join(" ") : ""}>${this.mergeScript(v.script)}
</ADialog>
`.trim()
        })
        return ret;
    }

    /** 递归渲染脚本内容项 */
    private mergeScript(items: ScriptItem[] = []): string {
        let ret = "";
        items.forEach((it) => {
            switch (it.type) {
                case "line":
                    // 台词文本走插槽（可与其中 HTML 共存）
                    ret += `<ALine>${it.text}</ALine>`;
                    break;
                case "ending":
                    ret += `<AEnding desc="${it.text}" />`;
                    break;
                case "goto":
                    ret += `<AGoto :tgt="${this.useCode(this.targetExpr(it.target))}" />`;
                    break;
                case "run":
                    ret += `<ARun :run="${this.useCode(it.code)}" />`;
                    break;
                case "options":
                    ret += `<AOptions>${it.choices.map((c) => this.mergeOption(c)).join("")}\n</AOptions>`;
                    break;
                case "if":
                    ret += this.mergeIf(it);
                    break;
                case "check":
                    ret += this.mergeCheck(it);
                    break;
                case "battle":
                    ret += this.mergeBattle(it);
                    break;
            }
        });
        return ret;
    }

    private mergeOption(o: Option): string {
        const attrs: string[] = [];
        if (o.next !== undefined && o.next !== null) {
            attrs.push(`:next="${this.useCode(this.targetExpr(o.next))}"`);
        }
        if (o.maxTimes !== undefined) attrs.push(`:maxTimes="${o.maxTimes}"`);
        if (o.visible) attrs.push(`:visible="${this.useCode(o.visible)}"`);
        if (o.onChoose) attrs.push(`:onChoose="${this.useCode(o.onChoose)}"`);

        // 选项显示文字放在 #content 插槽（可含 HTML）；内部反馈脚本放默认插槽
        const content = `\n<template #content>${o.label}</template>`;
        return `\n<AOption${attrs.length ? " " + attrs.join(" ") : ""}>${content}${this.mergeScript(o.script)}\n</AOption>`;
    }

    private mergeIf(it: IfItem): string {
        let ret = `\n<AIf :condition="${this.useCode(`() => ${it.condition}`)}">${this.mergeScript(it.then)}\n</AIf>`;
        it.elifs.forEach((e) => {
            ret += `\n<AElif :condition="${this.useCode(`() => ${e.condition}`)}">${this.mergeScript(e.body)}\n</AElif>`;
        });
        ret += `\n<AElse>${this.mergeScript(it.else)}\n</AElse>`;
        return ret;
    }

    private mergeCheck(it: CheckItem): string {
        const attrs: string[] = [];
        if (it.dice) attrs.push(`:dice="${this.useCode(JSON.stringify(it.dice))}"`);
        if (it.target !== undefined) attrs.push(`:target="${it.target}"`);
        if (it.targetDesc) attrs.push(`:target-desc="${this.useCode(JSON.stringify(it.targetDesc))}"`);
        if (it.modifier) attrs.push(`:modifier="${this.useCode(this.modifierExpr(it.modifier))}"`);
        if (it.onSuccess) attrs.push(`:on-success="${this.useCode(it.onSuccess)}"`);
        if (it.onFail) attrs.push(`:on-fail="${this.useCode(it.onFail)}"`);

        let inner = "";
        if (it.success) inner += `\n<template #success>${this.mergeScript(it.success)}\n</template>`;
        if (it.fail) inner += `\n<template #fail>${this.mergeScript(it.fail)}\n</template>`;
        return `\n<ACheck ${attrs.length ? " " + attrs.join(" ") : ""}>${inner}\n</ACheck>`;
    }

    /** 渲染 modifier 为引擎要求的 `{ name: string; value: () => number }[]`。
     *  语法中的 `= 数值` 形式会包装成 `() => 数值`。 */
    private modifierExpr(list: ModifierEntry[]): string {
        const items = list.map(({ name, value }) => {
            const fn = typeof value === "number" ? `() => ${value}` : value;
            return `{ name: ${JSON.stringify(name)}, value: ${fn} }`;
        });
        return `[${items.join(", ")}]`;
    }

    /** 渲染战斗块：`<ABattle :setting="ADVUserBattle">` + 胜/败/逃 三个插槽。 */
    private mergeBattle(it: BattleItem): string {
        let inner = "";
        if (it.success) inner += `\n<template #success>${this.mergeScript(it.success)}\n</template>`;
        if (it.fail) inner += `\n<template #fail>${this.mergeScript(it.fail)}\n</template>`;
        if (it.flee) inner += `\n<template #flee>${this.mergeScript(it.flee)}\n</template>`;
        return `\n<ABattle :setting="${this.useCode(this.battleSettingExpr(it))}">${inner}\n</ABattle>`;
    }

    /** 组装 `ADVUserBattle` 对象字面量（`<ABattle>` 的 `setting` 属性）。 */
    private battleSettingExpr(it: BattleItem): string {
        const entries: string[] = [];
        if (it.enemies) entries.push(`enemies: ${this.enemiesExpr(it.enemies)}`);
        // ADVUserBattle 要求 ATKActions / initiativeOrder / isFinish 必须有值，
        // 未书写时补充默认值，保证生成的对象字面量类型合法。
        entries.push(`ATKActions: ${it.ATKActions ? this.actionsExpr(it.ATKActions) : "[]"}`);
        if (it.SPActions) entries.push(`SPActions: ${this.actionsExpr(it.SPActions)}`);
        if (it.otherActions) entries.push(`otherActions: ${this.actionsExpr(it.otherActions)}`);
        entries.push(`initiativeOrder: ${it.initiativeOrder ?? "() => []"}`);
        entries.push(`isFinish: ${it.isFinish ?? "() => null"}`);
        return `{ ${entries.join(", ")} }`;
    }

    /** 渲染敌方阵容为 `ADVUserEnemy[]`（与内联模板同形，不再包一层 template）。
     *
     *  - 引用模板（`enemy <id> [count n]`）：从 game 配置的敌人模板中查出并**展开**为
     *    完整的敌人对象（不输出 `ref`）。
     *  - 内联模板（`enemy { ... }`）：直接使用书写时的字段。
     *  - `count` 表示同种敌人的数量：`ADVUserEnemy` 没有数量字段，故展开为多个
     *    独立对象（各自持有独立 hp）。
     */
    private enemiesExpr(list: EnemyEntry[]): string {
        const items: string[] = [];
        for (const e of list) {
            if ("ref" in e) {
                const template = this.enemyTemplateExpr(e.ref);
                for (let i = 0; i < e.count; i++) items.push(template);
            } else {
                items.push(
                    this.objExpr(
                        { name: "", hp: 0, skill: [], move: "() => { }", ...(e.template as unknown as Record<string, unknown>) },
                        ENEMY_CODE_FIELDS,
                    ),
                );
            }
        }
        return `[${items.join(", ")}]`;
    }

    /** 从 game 配置中查出敌人模板并展开为对象字面量。
     *  未定义时退化为仅含 `name` 的模板，并给出告警。 */
    private enemyTemplateExpr(id: string): string {
        const def = this.config.enemy?.[id];
        if (!def) {
            console.warn(`[Translater] 未找到敌人模板 "${id}"，已展开为仅含 name 的空模板。`);
            return `{ "name": ${JSON.stringify(id)}, "hp": 0, "skill": [], "move": () => { } }`;
        }
        // 补齐 ADVUserEnemy 的必需字段（skill / move 等），未书写时给默认值
        return this.objExpr(
            { name: def.name, hp: 0, skill: [], move: "() => { }", ...def.props } as Record<string, unknown>,
            ENEMY_CODE_FIELDS,
        );
    }

    private actionsExpr(list: BattleAction[]): string {
        return `[${list.map((a) => this.objExpr(a as unknown as Record<string, unknown>, ACTION_CODE_FIELDS)).join(", ")}]`;
    }

    /** 把对象转为 JS 对象字面量；codeFields 中的字符串字段按箭头函数源码直接内联 */
    private objExpr(obj: Record<string, unknown>, codeFields: Set<string>): string {
        const entries = Object.entries(obj).map(([k, v]) => {
            const val = codeFields.has(k) && typeof v === "string" ? v : this.dataExpr(v, codeFields);
            return `${JSON.stringify(k)}: ${val}`;
        });
        return `{ ${entries.join(", ")} }`;
    }

    private dataExpr(v: unknown, codeFields: Set<string>): string {
        if (v === null || v === undefined) return "null";
        if (typeof v === "number" || typeof v === "boolean") return String(v);
        if (typeof v === "string") return JSON.stringify(v);
        if (Array.isArray(v)) return `[${v.map((x) => this.dataExpr(x, codeFields)).join(", ")}]`;
        return this.objExpr(v as Record<string, unknown>, codeFields);
    }

    /** 把 target 转为 JS 表达式：代码块（箭头源码）直接内联，其余作字符串 */
    private targetExpr(t: Target): string {
        if (t === null || t === undefined) return "null";
        const s = String(t);
        if (/^\s*\(/.test(s) && s.includes("=>")) return s;
        return JSON.stringify(s);
    }
}

/**
 * 判断一个值是否为“普通对象”（非 null、非数组）。
 */
function isPlainObject(value: unknown): value is Record<string, any> {
    return (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
    );
}

/**
 * 对对象的每个值做映射，返回同键的新对象。
 *
 * @param obj 源对象
 * @param fn 映射函数 (value, key) => newValue
 */
function mapValues<T, R>(obj: Record<string, T>, fn: (value: T, key: string) => R): Record<string, R> {
    const out: Record<string, R> = {};
    for (const key of Object.keys(obj)) out[key] = fn(obj[key], key);
    return out;
}

/**
 * 合并两个同类型的对象。
 *
 * 规则：
 * 1. 对于一般字段（非对象、非数组），取两者中不为 undefined 的值；
 *    若两者都非 undefined，则取第一个（a）。
 * 2. 对于 Record<string, T> 字段，递归合并两个对象。
 * 3. 不处理数组字段（假设不会出现）。
 *
 * @param a 第一个对象（优先）
 * @param b 第二个对象
 * @returns 合并后的新对象，不修改原对象
 */
export function mergeObjects<T extends Record<string, any>>(a: T, b: T): T {
    const result: Record<string, any> = {};

    // 收集两个对象的所有键
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

    for (const key of keys) {
        const hasA = Object.prototype.hasOwnProperty.call(a, key);
        const hasB = Object.prototype.hasOwnProperty.call(b, key);

        // 只存在于一个对象中的键，直接取该值
        if (!hasA) {
            result[key] = b[key];
            continue;
        }
        if (!hasB) {
            result[key] = a[key];
            continue;
        }

        const va = a[key];
        const vb = b[key];

        // 处理 undefined
        if (va === undefined) {
            result[key] = vb;
            continue;
        }
        if (vb === undefined) {
            result[key] = va;
            continue;
        }

        // 两者都非 undefined
        if (isPlainObject(va) && isPlainObject(vb)) {
            // Record<string, T> 字段：递归合并
            result[key] = mergeObjects(va, vb);
        } else {
            // 一般字段：取第一个（a）
            result[key] = va;
        }
    }

    return result as T;
}