// ============================================================
// ADVScript AST 类型定义
// ============================================================
// 对应 grammar/advscript.peggy 解析器产出的对象结构。
// 顶层入口为 `Document`（startRule: 'Document'）。
// ============================================================

// ---------- 基础类型 ----------

/** 标识符（语法层已去除引号）。如场景/对话/物品等的 id。 */
export type Identifier = string;

/** 字符串字面量（去引号后的内容），可包含 HTML。 */
export type StringValue = string;

/** 代码块的“指针函数”源码，如 `() => { ... }` 或 `(num) => { ... }`。 */
export type CodeBlock = string;

/** 条件表达式原始文本（如 `Adv.bag.goldKey >= 1`）。 */
export type CodeExpression = string;

/** 时间字符串，格式 `YYYY-MM-DD HH:mm`。 */
export type TimeString = string;

/** 动作目标。可能是标识符、字符串、代码块文本，或 null。 */
export type Target = Identifier | StringValue | CodeBlock | null;

/** 检定模式。 */
export type JudgmentMode = 'd20' | 'percent';

/** 状态显示方式。 */
export type StatusDisplay = 'text' | 'process' | 'hide' | 'none';

/** 数字型状态的取值范围（`[a..b]`）。 */
export interface RangeValue {
    /** 下限，默认 0。 */
    min: number;
    /** 上限，默认 Infinity。 */
    max: number;
}

/**
 * 通用数据值（用于 item/enemy/skill 等内部字段）。
 * 来自语法的 DataValue 规则。
 */
export type DataValue =
    | string
    | number
    | boolean
    | null
    | DataValue[]
    | { [key: string]: DataValue };

// ============================================================
// 1. 顶层文档
// ============================================================

/**
 * 解析整个 .adv 文件后得到的根对象。
 * 对应语法规则：Document。
 */
export interface Document {
    /** 唯一的 game 配置块（若文件未提供则为 null）。 */
    game: RawGameConfig | null;
    /** 所有顶层 scene。 */
    scenes: Scene[];
    /** 所有顶层 dialog（不属于任何 scene）。 */
    dialogs: Dialog[];
    codes?: CodeBlock[];
}

// ============================================================
// 2. Game 配置
// ============================================================

/**
 * 全局配置。等价于 `Adv.defineConfig({ ... })` 的入参。
 */
export interface GameConfig {
    /** 游戏标题。 */
    gameName?: StringValue;
    /** 入口场景 / 对话的 ID。 */
    mainScene?: Identifier;
    /** 检定模式，默认 'd20'。 */
    judgmentMode?: JudgmentMode;
    /** 菜单显示控制。 */
    menu?: MenuConfig;
    /** 时间系统配置。 */
    time?: TimeConfig;
    /** 状态组定义（按组 ID 索引）。 */
    status?: Record<Identifier, StatusGroup>;
    /** 物品定义（按物品 ID 索引）。 */
    items?: Record<Identifier, ItemDef>;
    /** 敌人模板（按模板 ID 索引）。GameConfig 不含此项，输出时独立导出。 */
    enemy?: Record<Identifier, EnemyDef>;
    /** 角色定义（按角色 ID 索引）。输出到 `character`。 */
    character?: Record<Identifier, CharacterDef>;
    /** 商店配方（按商品 ID 索引）。GameConfig 不含，输出时用 Adv.defineRecipe 注册。 */
    recipes?: Record<Identifier, RecipeDef>;
    /** 线索专题（按专题 ID 索引）。 */
    clue?: Record<Identifier, ClueDef>;
}

export interface MenuConfig {
    bag?: boolean;
    attu?: boolean;
    shop?: boolean;
    save?: boolean;
    story?: boolean;
}

export interface TimeConfig {
    /** 起始时间，格式 `YYYY-MM-DD HH:mm`。 */
    start: TimeString;
    /** true=显示 `MM-DD HH:MM`，false=仅显示 `HH:MM`。 */
    showDate?: boolean;
}

// ---------- 状态 ----------

export interface StatusGroup {
    /** 组 ID。 */
    id: Identifier;
    /** 组显示名（缺省取 id）。 */
    name: StringValue;
    /** 组内的状态属性（按属性 ID 索引）。对齐 ADVUserStatusGroup.content。 */
    content: Record<Identifier, StatusProp>;
}

export interface StatusProp {
    /** 属性 ID。 */
    id: Identifier;
    /** 属性显示名（缺省取 id）。 */
    name: StringValue;
    /** 属性详细配置。 */
    props: StatusDetailProps;
}

export interface StatusDetailProps {
    /** 数值上限，对应语法 `range` 的 b（默认 Infinity）。仅对 number 型生效。 */
    max?: number;
    /** 数值下限，对应语法 `range` 的 a（默认 0）。仅对 number 型生效。 */
    min?: number;
    /** 初始值。数字为 number 型，字符串为 string 型。 */
    value?: number | StringValue;
    /** 显示强调色（CSS 颜色字符串）。 */
    color?: StringValue;
    /** 显示方式（对齐 ADVUserStatus.isDisplay）。 */
    isDisplay?: StatusDisplay;
}

// ---------- 物品 ----------

export interface ItemDef {
    /** 物品 ID。 */
    id: Identifier;
    /** 显示名（缺省取 id）。 */
    name: StringValue;
    /** 物品配置。 */
    props: ItemProps;
}

export interface ItemProps {
    /** 一句话简介。 */
    summary?: StringValue;
    /** 详细用法描述（可含 HTML）。 */
    desc?: StringValue;
    /** 背景故事（可含 HTML）。 */
    lore?: StringValue;
    /** 初始持有数量。 */
    default?: number;
    /** 使用回调代码块；null 表示禁止使用。 */
    onUse?: CodeBlock | null;
    /** 丢弃回调代码块；null 表示禁止丢弃；省略表示允许且无副作用。 */
    onDiscard?: CodeBlock | null;
    /** 其他自定义字段。 */
    [key: string]: DataValue | undefined;
}

// ---------- 敌人模板 ----------

export interface EnemyDef {
    /** 模板 ID。 */
    id: Identifier;
    /** 显示名（缺省取 id）。 */
    name: StringValue;
    /** 敌人配置。 */
    props: EnemyProps;
}

export interface EnemyProps {
    name?: StringValue;
    desc?: StringValue;
    hp?: number;
    maxhp?: number;
    atk?: number;
    def?: number;
    dex?: number;
    /** 技能列表。 */
    skill?: BattleAction[];
    /** 敌方 AI 代码块。 */
    move?: CodeBlock;
    /** 其他自定义字段。 */
    [key: string]: DataValue | undefined;
}

// ---------- 角色 ----------

export interface CharacterDef {
    /** 角色 ID。 */
    id: Identifier;
    /** 显示名（缺省取 id）。 */
    name: StringValue;
    /** 角色配置。 */
    props: CharacterProps;
}

export interface CharacterProps {
    /** 背景描述（可含 HTML）。 */
    desc?: StringValue;
    /** 印象列表（语法关键字为 `impr`，输出键对齐 ADVUserCharacter.impression）。 */
    impression?: StringValue[];
    /** 其他自定义字段。 */
    [key: string]: DataValue | undefined;
}

// ---------- 商店配方 ----------

export interface RecipeDef {
    /** 商品 ID（对应物品 ID）。 */
    id: Identifier;
    /** 显示名（缺省取 id）。 */
    name: StringValue;
    /** 配方配置。 */
    props: RecipeProps;
}

export interface RecipeProps {
    /** 合成所需的材料，可为单组或多组可选。 */
    need: RecipeNeed;
    /** 默认库存数量，缺省为 Infinity。 */
    default?: number;
    /** 其他自定义字段。 */
    [key: string]: DataValue | undefined;
}

/** 单组需求：`{ 物品ID: 数量 }`。 */
export interface RecipeNeedObject {
    [itemId: string]: number;
}

/** 需求：单组对象，或对象数组（多组可选）。 */
export type RecipeNeed = RecipeNeedObject | RecipeNeedObject[];

// ---------- 线索 ----------

export interface ClueDef {
    /** 专题 ID。 */
    id: Identifier;
    /** 显示名（缺省取 id）。 */
    name: StringValue;
}

// ============================================================
// 2.1 Game 配置的“语法原始形态”
// ============================================================

/**
 * 语法解析得到的 game 配置**原始结构**（尚未按引擎模型展平/改名）。
 *
 * 与引擎的 {@link GameConfig}（data/model.ts）不同，仅表示 AST 形态，
 * 由 `Translater.toGameConfig()` 负责翻译后才能交给 `Adv.defineConfig`。
 *
 * 主要差异：
 *  - `items[id]` / `character[id]` 等带 `props` 包装（引擎侧是展平的）
 *  - `status[g].content[s]` 的属性带 `id` 与 `props` 包装
 *  - 角色键为 `character`、配方键为 `recipes`、敌人模板键为 `enemy`（引擎侧无后两者）
 */
export interface RawGameConfig {
    /** 游戏标题。 */
    gameName?: StringValue;
    /** 入口场景 / 对话的 ID。 */
    mainScene?: Identifier;
    /** 检定模式，默认 'd20'。 */
    judgmentMode?: JudgmentMode;
    /** 菜单显示控制。 */
    menu?: MenuConfig;
    /** 时间系统配置。 */
    time?: TimeConfig;
    /** 状态组定义（组 ID -> { name, content }）。 */
    status?: Record<Identifier, StatusGroup>;
    /** 物品定义（物品 ID -> { name, props }）。 */
    items?: Record<Identifier, ItemDef>;
    /** 敌人模板（模板 ID -> { name, props }）。 */
    enemy?: Record<Identifier, EnemyDef>;
    /** 角色定义（角色 ID -> { name, props }）。 */
    character?: Record<Identifier, CharacterDef>;
    /** 商店配方（商品 ID -> { name, props }）。 */
    recipes?: Record<Identifier, RecipeDef>;
    /** 线索专题（专题 ID -> { name }）。 */
    clue?: Record<Identifier, ClueDef>;
}

// ============================================================
// 3. Scene 场景
// ============================================================

export interface Scene {
    type: 'scene';
    /** 场景 ID。 */
    id: Identifier;
    /** 场景显示名（缺省取 id）。 */
    displayName: StringValue;
    /** 场景属性。 */
    props: SceneProps;
    /** 属于该场景的对话。 */
    dialogs: Dialog[];
}

export interface SceneProps {
    /** 进入场景后立即执行的目标。 */
    next?: Target;
    /** 进入场景时的回调代码块。 */
    onEnter?: CodeBlock;
    /** 离开场景时的回调代码块。 */
    onLeave?: CodeBlock;
}

// ============================================================
// 4. Dialog 对话
// ============================================================

export interface Dialog {
    type: 'dialog';
    /** 对话 ID（可选，省略时为 null）。 */
    id: Identifier | null;
    /** 强制所属场景的 ID（`in <sceneId>`）；未指定为 null。 */
    in: Identifier | null;
    /** 对话属性。 */
    props: DialogProps;
    /** 对话脚本（按书写顺序）。 */
    script: ScriptItem[];
}

export interface DialogProps {
    /** 对话结束后跳转的目标。 */
    next?: Target;
    /** 对话开始时的回调代码块。 */
    onStart?: CodeBlock;
    /** 对话结束时的回调代码块。 */
    onFinish?: CodeBlock;
}

// ============================================================
// 5. 脚本内容项
// ============================================================

/** 所有脚本内容项的联合类型，用 `type` 字段区分。 */
export type ScriptItem =
    | LineItem
    | OptionsItem
    | IfItem
    | RunItem
    | GotoItem
    | EndingItem
    | CheckItem
    | BattleItem;

/** 台词（字符串）。 */
export interface LineItem {
    type: 'line';
    /** 台词文本（可能含 HTML）。 */
    text: StringValue;
}

/** 选项列表。 */
export interface OptionsItem {
    type: 'options';
    choices: Option[];
}

/** 选项。 */
export interface Option {
    /** 显示文本。 */
    label: StringValue;
    /** 选择后跳转的目标。 */
    next?: Target;
    /** 最大可选次数（省略表示 Infinity）。 */
    maxTimes?: number;
    /** 是否可见的代码块。 */
    visible?: CodeBlock;
    /** 选择时的回调代码块。 */
    onChoose?: CodeBlock;
    /** 选项内部的反馈脚本。 */
    script: ScriptItem[];
}

/** 条件分支 `if / elif / else`。 */
export interface IfItem {
    type: 'if';
    /** 主分支条件表达式。 */
    condition: CodeExpression;
    /** 主分支脚本。 */
    then: ScriptItem[];
    /** elif 分支列表（按书写顺序）。 */
    elifs: IfElifBranch[];
    /** else 分支脚本（无 else 时为空数组）。 */
    else: ScriptItem[];
}

export interface IfElifBranch {
    condition: CodeExpression;
    body: ScriptItem[];
}

/** 任意代码（`run { ... }` 或裸 `{ ... }`）。 */
export interface RunItem {
    type: 'run';
    /** 代码文本（不含最外层 `{ }`）。 */
    code: CodeBlock;
}

/** 跳转 `goto <target>`。 */
export interface GotoItem {
    type: 'goto';
    target: Target;
}

/** 结局 `ending "..."`。 */
export interface EndingItem {
    type: 'ending';
    text: StringValue;
}

// ============================================================
// 6. 检定（Check）
// ============================================================

export interface CheckItem {
    type: 'check';
    /** 骰子表达式（如 `d20` / `percent`）。省略则使用全局检定模式。 */
    dice?: JudgmentMode;
    /** 目标值。 */
    target?: number;
    /** 目标描述，如 "开锁难度"。 */
    targetDesc?: StringValue;
    /** 修正项列表，按书写顺序；`value` 为返回 number 的函数（语法 `= 数值` 会包成 `() => 数值`）。 */
    modifier?: ModifierEntry[];
    /** 成功分支脚本。 */
    success?: ScriptItem[];
    /** 失败分支脚本。 */
    fail?: ScriptItem[];
    /** 成功回调代码块。 */
    onSuccess?: CodeBlock;
    /** 失败回调代码块。 */
    onFail?: CodeBlock;
}

/**
 * 检定修正项，对应引擎 `modifier` 的条目。
 *
 * `value` 在语法层可能是数字（`mod "名" = 3`）或代码块（`mod "名" { ... }`），
 * 翻译为 Vue 时会统一渲染为返回 number 的函数表达式。
 */
export interface ModifierEntry {
    /** 修正项名称。 */
    name: StringValue;
    /** 数值或代码块指针函数源码。 */
    value: number | CodeBlock;
}

// ============================================================
// 7. 战斗（Battle）
// ============================================================

export interface BattleItem {
    type: 'battle';
    /** 敌方阵容。 */
    enemies?: EnemyEntry[];
    /** 普通攻击动作。 */
    ATKActions?: BattleAction[];
    /** 技能动作。 */
    SPActions?: BattleAction[];
    /** 特殊行动。 */
    otherActions?: BattleAction[];
    /** 先攻序列（返回 number[]，-1=玩家）。 */
    initiativeOrder?: CodeBlock;
    /** 胜负判定（返回 true | false | null）。 */
    isFinish?: CodeBlock;
    /** 胜利后脚本。 */
    success?: ScriptItem[];
    /** 失败后脚本。 */
    fail?: ScriptItem[];
    /** 逃跑后脚本。 */
    flee?: ScriptItem[];
}

/** 敌方条目：引用模板 或 内联定义。 */
export type EnemyEntry = EnemyEntryRef | EnemyEntryInline;

export interface EnemyEntryRef {
    /** 引用的模板 ID。 */
    ref: Identifier;
    /** 引用数量（缺省为 1）。 */
    count: number;
}

export interface EnemyEntryInline {
    /** 内联定义的敌方模板。 */
    template: EnemyProps;
}

/** 战斗动作（ATKActions / SPActions / otherActions 的项）。 */
export interface BattleAction {
    /** 显示名称。 */
    name?: StringValue;
    /** 详细描述。 */
    desc?: StringValue;
    /** 简短摘要。 */
    summary?: StringValue;
    /** 目标数量（Infinity 表示全体）。 */
    targetNum?: number;
    /** 使用回调代码块。 */
    onUse?: CodeBlock;
    /** 其他自定义字段。 */
    [key: string]: DataValue | undefined;
}

// ============================================================
// 8. 辅助类型守卫（可选）
// ============================================================

export function isLineItem(x: ScriptItem): x is LineItem {
    return x.type === 'line';
}
export function isOptionsItem(x: ScriptItem): x is OptionsItem {
    return x.type === 'options';
}
export function isIfItem(x: ScriptItem): x is IfItem {
    return x.type === 'if';
}
export function isCheckItem(x: ScriptItem): x is CheckItem {
    return x.type === 'check';
}
export function isBattleItem(x: ScriptItem): x is BattleItem {
    return x.type === 'battle';
}
export function isGotoItem(x: ScriptItem): x is GotoItem {
    return x.type === 'goto';
}
export function isEndingItem(x: ScriptItem): x is EndingItem {
    return x.type === 'ending';
}
export function isRunItem(x: ScriptItem): x is RunItem {
    return x.type === 'run';
}
export function isEnemyEntryRef(x: EnemyEntry): x is EnemyEntryRef {
    return 'ref' in x;
}
export function isEnemyEntryInline(x: EnemyEntry): x is EnemyEntryInline {
    return 'template' in x;
}