// ============================================================
// ADVScript 解析器（Peggy / PEG 语法定义）
//
// 该语言用于描述“剧情 / 冒险”类脚本，当前支持：
//   import, game, scene, dialog, 台词, options, if, run, goto, ending
//
// 输出：一份描述整份脚本的 AST 对象，顶层结构：
//   {
//     game:    object | null,        // 唯一的 game 配置块
//     scenes:  Scene[],              // 所有 scene
//     dialogs: Dialog[]              // 顶层（不属于任何 scene）的 dialog
//   }
// ============================================================
{
  // ---- 辅助函数（写在语法之外的普通 JS，可在动作里调用）----
  // 把形如 { key, value } 的列表合并为一个对象：
  //   [{key:'name',value:'x'},{key:'mainScene',value:'start'}] -> {name:'x',mainScene:'start'}
  function buildProps(list) {
    const obj = {};
    list.forEach(p => {
      if (p && p.key) obj[p.key] = p.value;
    });
    return obj;
  }

  // 把“单键对象数组”合并为一个对象，去掉外层数组 []：
  //   [{bag:true},{attu:true}] -> {bag:true, attu:true}
  // 用于 menu / time / game 顶层配置这类“每个元素各占一个键”的情况。
  function mergeProps(list) {
    const obj = {};
    (list || []).forEach(item => {
      if (item && typeof item === 'object') Object.assign(obj, item);
    });
    return obj;
  }

  // 把“带 id 的对象数组”按 id 组织为对象，同样去掉外层数组 []：
  //   [{id:'base',name:'基础属性'},...] -> { base:{id:'base',name:'基础属性'}, ... }
  // 用于 status 下的 group、group 下的属性组等以 id 为唯一键的情况。
  function indexById(list) {
    const obj = {};
    (list || []).forEach(item => {
      if (item && item.id != null) obj[item.id] = item;
    });
    return obj;
  }

  // 多行字符串的“去缩进”：
  //   1) 去掉紧随开引号的换行与末尾换行后的缩进
  //   2) 去掉所有非空行的公共前导空白
  // 这样书写时可以自然缩进，渲染出来的文本不会带多余空格。
  function dedent(text) {
    if (text.indexOf('\n') === -1) return text;
    const lines = text
      .replace(/^[ \t]*\r?\n/, '')
      .replace(/\r?\n[ \t]*$/, '')
      .split(/\r?\n/);
    let indent = Infinity;
    lines.forEach(line => {
      if (!line.trim()) return;
      const n = line.match(/^[ \t]*/)[0].length;
      if (n < indent) indent = n;
    });
    if (!isFinite(indent)) indent = 0;
    return lines.map(line => line.slice(indent)).join('\n');
  }

  // 组装一个 option：
  //   - 属性来自体内（next / maxTimes / visible / onChoose）
  //   - x<次数> 与 => 目标 只作为默认值，体内的属性优先
  //   - 脚本按出现顺序收集
  function buildOption(label, maxTimes, body, nxt) {
    const props = (body || []).filter(item => item.type === 'prop');
    const script = (body || []).filter(item => item.type === 'script').map(item => item.value);
    const attrs = buildProps(props);
    if (maxTimes != null && attrs.maxTimes === undefined) attrs.maxTimes = maxTimes;
    if (nxt != null && attrs.next === undefined) attrs.next = nxt;
    return { label, ...attrs, script };
  }

  // 汇总 game 配置：把一个个“部分配置对象”合并进一个 config。
  // 对 status / item / enemy / func 这类“按 ID 聚合”的分类做深度合并（累加其 id 映射），
  // 因此它们可以交错书写多次而不会互相覆盖；单值键（name 等）则直接覆盖。
  function mergeGameConfig(list) {
    const config = {};
    (list || []).forEach(partial => {
      for (const k in partial) {
        const v = partial[k];
        const cur = config[k];
        if (cur && typeof cur === 'object' && v && typeof v === 'object'
            && !Array.isArray(cur) && !Array.isArray(v)) {
          Object.assign(cur, v);
        } else {
          config[k] = v;
        }
      }
    });
    return config;
  }
}

// ------------------------------------------------------------
// 顶层文档
// ------------------------------------------------------------
// Document 是整个脚本的入口规则。
// 允许首尾有空白/注释，中间是零个或多个顶层元素（Element*）。
// 匹配后把各元素按 type 分门别类填入结果对象并返回。
Document
  = _ elements:Element* _ {
      const result = { codes: [], game: null, scenes: [], dialogs: [] };
      // game 可以拆成多个块交错书写，这里把所有块的部分配置收集起来统一合并，
      // 避免后面的块覆盖前面的块（如 enemy 模板写在前面的块里）。
      const gameProps = [];
      elements.forEach(el => {
        if (el.type === 'code') result.codes.push(el.code);
        else if (el.type === 'game') gameProps.push(...el.props);
        else if (el.type === 'scene') result.scenes.push(el);
        else if (el.type === 'dialog') result.dialogs.push(el);
      });
      if (gameProps.length) result.game = mergeGameConfig(gameProps);
      return result;
    }

// 顶层元素：一个文档由 import / game / scene / dialog 四种之一构成。
// 按顺序依次尝试匹配（优先级从左到右），第一个成功的即被采用。
Element
  = Game
  / Scene
  / Dialog
  / GlobalScript

GlobalScript
  = "code" _ code:CodeBlockRaw _ {
    return { type: 'code', code  }
  }

// game 属性值的可选类型（按顺序尝试）。
GameValue
  = StringLiteral
  / Number
  / Boolean
  / Identifier
  / CodeBlockRaw


// ------------------------------------------------------------
// Game 块（简化版，识别 name/mainScene，其他属性保留原始值）
// ------------------------------------------------------------
// 全局配置块：game { ... }
// 内部是一系列配置子项；这里不直接合并，只返回 { type:'game', props }，
// 由 Document 汇总**所有** game 块后统一用 mergeGameConfig 合并，
// 因此可以拆成多个 game { } 块交错书写。
Game
  = "game" _ "{" _ props:GameProp* _ "}" _ {
      return { type: 'game', props };
    }

// game 块内的一条子项，可任意交错书写：
//   - 单值属性：name / mainScene / judgmentMode = 值
//   - 单例块：  menu { ... }、time { ... }
//   - 按 ID 聚合的定义块：status / item / enemy / func
// 每个子项返回一个“部分配置对象”，由 mergeGameConfig 汇总进 config。
GameProp
  = "name" _ "=" _ value:StringLiteral _ ";"? _ { return { gameName: value }; }
  / "mainScene" _ "=" _ value:Identifier _ ";"? _ { return { mainScene: value }; }
  / "judgmentMode" _ "=" _ value:ModeType _ ";"? _ { return { judgmentMode: value }; }
  / "menu" _ "{" _ value:GameMenuProp* _ "}" _ ";"? _ { return { menu: mergeProps(value) }; }
  / "time" _ "{" _ value:GameTimeProp* _ "}" _ ";"? _ { return { time: mergeProps(value) }; }
  / GameStatueDef
  / ItemDef
  / EnemyDef
  / CharDef
  / RecDef
  / ClueDef

ModeType
  = "d20" / "percent"

GameMenuProp
  = "bag" _ "=" _ value:Boolean _ ";"? _ {
        return {bag: value}
    }
  / 
    "attu" _ "=" _ value:Boolean _ ";"? _ {
        return {attu: value}
    }
  / 
    "shop" _ "=" _ value:Boolean _ ";"? _ {
        return {shop: value}
    }
  / 
    "save" _ "=" _ value:Boolean _ ";"? _ {
        return {save: value}
    }
  / 
    "story" _ "=" _ value:Boolean _ ";"? _ {
        return {story: value}
    }

GameTimeProp
  = "start" _ "=" _ value:Time _ ";"? _ {
        return {start: value}
    }
  / 
    "showDate" _ "=" _ value:Boolean _ ";"? _ {
        return {showDate: value}
    }

// status 组：status <组ID>[: "组名"] { 状态... }
// 可直接与 item/enemy/func 等交错书写，多个组各自按键 status[组ID] 聚合。
GameStatueDef
  = "status" _ id:Identifier _ ":"? _ name:StringLiteral? _ "{" _ stats:GameStatueProp* _ "}" _ ";"? _ {
      return { status: { [id]: { name: name || id, content: indexById(stats) } } };
    }

GameStatueProp
  = id: Identifier _ ":"?  _ name: StringLiteral? _ "{" _ props: GameStatueDetailProp* _ "}" _ {
    return {
        id,
        name,
        props: mergeProps(props)
    }
  }

// 输出键对齐引擎的 ADVUserStatus：range -> min/max，display -> isDisplay。
// （range 的 {min,max} 直接展开进 props，与 value/color 合并。）
GameStatueDetailProp
  = "range" _ "=" _ value:RangeValue _ ";"? _ {
        return value
    }
  / 
    "value" _ "=" _ value:(StringLiteral / Number) _ ";"? _ {
        return {value}
    }
  / 
    "color" _ "=" _ value:StringLiteral _ ";"? _ {
        return {color: value}
    }
  / 
    "display" _ "=" _ value:GameStatueDisplayProp _ ";"? _ {
        return {isDisplay: value}
    }

GameStatueDisplayProp
  = "text" / "process" / "hide" / "none" 

// range 区间 [a..b]：a 为下限（默认 0），b 为上限（默认无限）。
//   [0..100] -> {min:0, max:100}    [..100] -> {min:0, max:100}
//   [0..]    -> {min:0, max:Infinity}   [..] -> {min:0, max:Infinity}
RangeValue
  = "[" _ min:Number? _ ".." _ max:Number? _ "]" {
      return { min: min != null ? min : 0, max: max != null ? max : Infinity };
    }

// ---------- item 物品 ----------
// item <ID>[: "名称"] { key = value ... }，可任意交错书写。
ItemDef
  = "item" _ id:Identifier _ ":"? _ name:StringLiteral? _ "{" _ fields:DataField* _ "}" _ ";"? _ {
      return { items: { [id]: { name: name || id, props: buildProps(fields) } } };
    }

// ---------- enemy 敌人模板 ----------
EnemyDef
  = "enemy" _ id:Identifier _ ":"? _ name:StringLiteral? _ "{" _ fields:DataField* _ "}" _ ";"? _ {
      return { enemy: { [id]: { name: name || id, props: buildProps(fields) } } };
    }

// ------------- 人物面板 ------------
// 输出到 config.character（对齐引擎的 ADVUserCharacter）。
CharDef
  = "char" _ id:Identifier _ ":"? _ name:StringLiteral? _ "{" _ body:CharItem* _ "}" _ ";"? _ {
      return { character: { [id]: { name: name || id, props: buildProps(body) } } };
    }

// char 体内的一个条目：
//   1) 印象块：impr { "第一句" "第二句" ... }（每行一个字符串，汇总为数组）
//   2) 普通字段：key = value 或 key { ... }
// 注意：impr 分支必须在 DataField 之前，否则会被 DataField 的“代码块”分支抢先匹配。
// 输出键为 impression（对齐 ADVUserCharacter.impression）。
CharItem
  = "impr" _ "{" _ imgs:ImprLine* _ "}" _ ";"? _ { return { key: 'impression', value: imgs }; }
  / field:DataField { return field; }

ImprLine
  = value:StringLiteral _ ";"? _ { return value; }

// ---------- rec 商店配方 ----------
// rec <ID>[: "名称"] { need = ... default = ... }，可与其他定义交错书写。
RecDef
  = "rec" _ id:Identifier _ ":"? _ name:StringLiteral? _ "{" _ body:RecItem* _ "}" _ ";"? _ {
      return { recipes: { [id]: { name: name || id, props: buildProps(body) } } };
    }

// rec 体内的一个条目：
//   1) 需求：need = 对象 / 对象数组（冒号风格，如 { Herb: 2 }）
//   2) 普通字段：key = value
RecItem
  = "need" _ "=" _ value:RecNeed _ ";"? _ { return { key: 'need', value }; }
  / field:DataField { return field; }

// 需求：单个对象 { Herb: 2 }，或对象数组 [ {..}, {..} ]
RecNeed
  = RecNeedList
  / RecNeedObject

RecNeedObject
  = "{" _ fields:RecEntry* _ "}" { return buildProps(fields); }

RecNeedList
  = "[" _ items:RecNeedListItems _ "]" { return items; }

RecNeedListItems
  = first:RecNeedObject rest:RecNeedRest* { return [first].concat(rest); }
  / "" { return []; }

// 数组中后续的（第 2 个起）需求对象；逗号可有可无
RecNeedRest
  = _ ","? _ o:RecNeedObject { return o; }

// 需求项：key : value（兼容 key = value），逗号/分号可选
RecEntry
  = key:Identifier _ (":" / "=") _ value:DataValue _ ","? _ ";"? _ { return { key, value }; }

// --------------- 线索 ------------
ClueDef
  = "clue" _ id:Identifier _ ":"? _ name:StringLiteral? _ ";"? _ {
      return { clue: { [id]: { name: name || id } } };
    }

// ------------------------------------------------------------
// Scene
// ------------------------------------------------------------
// 场景定义：scene <id>[: "显示名"] { ... }
//   - id          唯一标识（Identifier）
//   - displayName 可选的冒号+字符串显示名，缺省时取 id
// 场景体内是若干 SceneBody（属性 props 或嵌套的 dialog），
// 匹配后分别填入 scene.props 和 scene.dialogs。
Scene
  = "scene" _ id:Identifier _ displayName:(":" _ @value:StringLiteral)? _ "{" _ body:SceneBody* _ "}" _ nxt:ToNext? _ ";"? _ {
      const scene = {
        type: 'scene',
        id,
        displayName: displayName || id,
        props: {
            next: nxt
        },
        dialogs: []
      };
      body.forEach(item => {
        if (item.type === 'prop') scene.props[item.key] = item.value;
        else if (item.type === 'dialog') scene.dialogs.push(item);
      });
      return scene;
    }

// 场景体内的一个条目：要么是一条场景属性(prop)，要么是一个嵌套 dialog。
// 为便于上层统一处理，这里把 prop 也包一层 { type:'prop', ... }。
SceneBody
  = prop:SceneProp { return { type: 'prop', key: prop.key, value: prop.value }; }
  / dialog:Dialog   { return dialog; }

// 场景级属性（键固定为以下关键字之一）：
//   next    跳转到哪个目标场景/标识符
//   onEnter 进入场景时执行的代码块
//   onLeave 离开场景时执行的代码块
SceneProp
  = "next" _ "=" _ value:Target _ ";"? _ { return { key: 'next', value: value }; }
  / "onEnter" _ value:CodeBlockRaw _ ";"? _ { return { key: 'onEnter', value: value }; }
  / "onLeave" _ value:CodeBlockRaw _ ";"? _ { return { key: 'onLeave', value: value }; }

// ------------------------------------------------------------
// Dialog
// ------------------------------------------------------------
// 对话/剧情块：dialog [<id>] [in <sceneId>] { ... }
//   - id          可选的唯一标识（省略时为 null）
//   - in          可选的所属场景（dialog ... in sceneX）
// 对话体内是若干 DialogItem：属性(prop) 或 脚本项(script)。
// 返回 { type:'dialog', id, in, props, script[] }。
Dialog
  = "dialog" _ id:DialogId? _ inScene:("in" _ @sceneId:Identifier)? _ "{" _ body:DialogItem* _ "}" _ nxt:ToNext? _ ";"? _  {
      const dialog = {
        type: 'dialog',
        id: id || null,
        in: inScene || null,
        props: {
            next: nxt
        },
        script: []
      };
      body.forEach(item => {
        if (item.type === 'prop') dialog.props[item.key] = item.value;
        else if (item.type === 'script') dialog.script.push(item.value);
      });
      return dialog;
    }

ToNext
  = "=>" _ @id:Identifier

// dialog 的可选 id：排除后面的 in 关键字（否则 `dialog in attic` 会把 in 当成 id）
DialogId
  = !("in" ![a-zA-Z0-9_$]) value:Identifier { return value; }

// 对话体内的一个条目：一条属性，或一段脚本内容(ScriptItem)。
// 脚本项统一包成 { type:'script', value } 供上层收集到 dialog.script。
DialogItem
  = prop:DialogProp { return { type: 'prop', key: prop.key, value: prop.value }; }
  / script:ScriptItem { return { type: 'script', value: script }; }

// 对话级属性：
//   next    跳转目标
//   onStart 开始时执行的代码块
//   onFinish 结束时执行的代码块
DialogProp
  = "next" _ "=" _ value:Target _ ";"? _ { return { key: 'next', value: value }; }
  / "onStart" _ value:CodeBlockRaw _ ";"? _ { return { key: 'onStart', value: value }; }
  / "onFinish"  _ value:CodeBlockRaw _ ";"? _ { return { key: 'onFinish', value: value }; }

// 检定块（作为脚本内容项，按出现顺序进入 script / option.script）：
Check
  = "check" _ "{" _ props:CheckProp* _ "}" _ ";"? _ {
      return { type: 'check', ...buildProps(props) };
    }

CheckProp
  = "dice" _ "=" _ value:ModeType _ ";"? _ { return { key: 'dice', value: value }; }
  / "target" _ "=" _ value:Number _ ";"? _ { return { key: 'target', value: value }; }
  / "targetDesc" _ "=" _ value:StringLiteral _ ";"? _ { return { key: 'targetDesc', value: value }; }
  / "modifier" _ "{" _ value:ModProp* _ "}" _ ";"? _ { return { key: 'modifier', value }; }
  / "success" _ "{" _ body:ScriptItem* _ "}" _ ";"? _ { return { key: 'success', value: body }; }
  / "fail" _ "{" _ body:ScriptItem* _ "}" _ ";"? _ { return { key: 'fail', value: body }; }
  / "onSuccess" _ value:CodeBlockRaw _ ";"? _ { return { key: 'onSuccess', value: value }; }
  / "onFail" _ value:CodeBlockRaw _ ";"? _ { return { key: 'onFail', value: value }; }

// 检定修正项：mod "名称" = 数值   或   mod "名称" { 代码 }
// 收集为数组 [{ name, value }]（保留书写顺序，允许重名）。
// value 为 number 或代码块指针函数源码；由 Translater 渲染成引擎要求的
// `{ name: string; value: () => number }[]`（数值会自动包成 `() => n`）。
ModProp
  = "mod" _ name:StringLiteral _ "=" _ num:Number _ ";"? _ { return { name, value: num }; }
  / "mod" _ name:StringLiteral _ value:CodeBlockRaw _ ";"? _ { return { name, value }; }

// ------------------------------------------------------------
// 战斗（battle）块 —— 作为脚本内容项
// ------------------------------------------------------------
Battle
  = "battle" _ "{" _ props:BattleProp* _ "}" _ ";"? _ {
      return { type: 'battle', ...buildProps(props) };
    }

BattleProp
  = "enemies" _ "{" _ value:EnemyEntry* _ "}" _ ";"? _ { return { key: 'enemies', value }; }
  / key:("ATKActions" / "SPActions" / "otherActions") _ "{" _ value:BattleAction* _ "}" _ ";"? _ { return { key, value }; }
  / "initiativeOrder" _ value:CodeBlockRaw _ ";"? _ { return { key: 'initiativeOrder', value }; }
  / "isFinish" _ value:CodeBlockRaw _ ";"? _ { return { key: 'isFinish', value }; }
  / "success" _ "{" _ body:ScriptItem* _ "}" _ ";"? _ { return { key: 'success', value: body }; }
  / "fail"    _ "{" _ body:ScriptItem* _ "}" _ ";"? _ { return { key: 'fail', value: body }; }
  / "flee"    _ "{" _ body:ScriptItem* _ "}" _ ";"? _ { return { key: 'flee', value: body }; }

// 敌人条目：
//   enemy <模板ID> count <n>   引用已定义模板（count 缺省为 1）
//   enemy <模板ID>
//   enemy { ...内联模板字段... }
EnemyEntry
  = "enemy" _ id:Identifier _ "count" _ n:Number _ ";"? _ { return { ref: id, count: n }; }
  / "enemy" _ id:Identifier _ ";"? _ { return { ref: id, count: 1 }; }
  / "enemy" _ "{" _ fields:DataField* _ "}" _ ";"? _ { return { template: buildProps(fields) }; }

// 战斗动作：action { name=... targetNum=... onUse {...} ... }
BattleAction
  = "action" _ "{" _ fields:DataField* _ "}" _ ";"? _ { return buildProps(fields); }

// ------------------------------------------------------------
// 脚本内容项（可扩展）
// ------------------------------------------------------------
// 对话脚本中可出现的语句，按优先级依次尝试匹配。
ScriptItem
  = Line
  / Options
  / IfBlock
  / RunBlock
  / Goto
  / Ending
  / Check
  / Battle
  // 后续可添加：简写指令等

// 台词：一个（单/多行）字符串即一句台词。
// 返回 { type:'line', text }。
Line
  = value:StringLiteral _ ";"? _ {
      return { type: 'line', text: value };
    }

// 选项列表：options { option ... }，收集所有分支。
// 返回 { type:'options', choices: Option[] }。
Options
  = "options" _ "{" _ choices:Option* _ "}" _ {
      return { type: 'options', choices: choices };
    }

// 单个选项。两种写法：
//   完整形式：option "标签" [x<次数>] { 属性 / 脚本 } [=> 目标] ;
//   简写形式：option "标签" [x<次数>] [=> 目标] ;   ——无脚本时可省略 { }
// 其中：
//   x<次数>   是 maxTimes 的快捷写法（x3 等价于 maxTimes = 3）
//   => 目标   是 next   的快捷写法
// 两者都只是“默认值”，体内若再写 next / maxTimes，以体内的为准。
Option
  = "option" _ label:StringLiteral _ max:OptionMaxTimes? _ "{" _ body:OptionBody* _ "}" _ nxt:ToNext? _ ";"? _ {
      return buildOption(label, max, body, nxt);
    }
  / "option" _ label:StringLiteral _ max:OptionMaxTimes? _ nxt:ToNext? _ ";"? _ {
      return buildOption(label, max, [], nxt);
    }

// maxTimes 的快捷写法：x3（等价 maxTimes = 3），x 与数字间允许空白。
OptionMaxTimes
  = "x" _ n:Number { return n; }

// 选项体内的一个条目：
//   属性：next(跳转), maxTimes(可选次数), visible(条件代码块), onChoose(选中回调)
//   或一段嵌套脚本(ScriptItem，如 check 检定块——与 dialog 中语法/效果一致)
// 注意：check 不作为选项属性，而作为脚本内容项处理。
OptionBody
  = "next" _ "=" _ value:Target _ ";"? _ { return { type: 'prop', key: 'next', value: value }; }
  / "maxTimes" _ "=" _ value:Number _ ";"? _ { return { type: 'prop', key: 'maxTimes', value: value }; }
  / "visible" _ value:CodeBlockRaw _ ";"? _ { return { type: 'prop', key: 'visible', value: value }; }
  / "onChoose" _ value:CodeBlockRaw _ ";"? _ { return { type: 'prop', key: 'onChoose', value: value }; }
  / script:ScriptItem { return { type: 'script', value: script }; }

// 条件分支：if (条件) { ... } [elif (条件) { ... }]* [else { ... }]
// 条件为 CodeExpression（括号内的原始文本）。
// 返回 { type:'if', condition, then, elifs[], else[] }。
IfBlock
  = "if" _ "(" _ condition:CodeExpression _ ")" _ "{" _ then:ScriptItem* _ "}" _ elifs:ElifPart* _ elsePart:ElsePart? _ {
      return {
        type: 'if',
        condition: condition,
        then: then,
        elifs: elifs,
        else: elsePart || []
      };
    }

// else if 分支：elif (条件) { ... }
// 末尾同样消费空白，以支持多个连续的 elif。
ElifPart
  = "elif" _ "(" _ condition:CodeExpression _ ")" _ "{" _ body:ScriptItem* _ "}" _ {
      return { condition: condition, body: body };
    }

// else 兜底分支：else { ... }，直接返回其中的脚本列表。
ElsePart
  = "else" _ "{" _ body:ScriptItem* _ "}" _ {
      return body;
    }

// 执行任意代码。支持两种写法：
//   run { ... }      带关键字
//   { ... }          直接裸代码块也视为 run
// 返回 { type:'run', code }，code 为不含最外层大括号的原始文本。
RunBlock
  = "run" _ code:CodeBlockRaw _ ";"? _ {
      return { type: 'run', code: code };
    }
  / code:CodeBlockRaw _ ";"? _ {
      return { type: 'run', code: code };
    }

// 跳转：goto <目标>，目标通常是某场景/对话的标识符。
// 返回 { type:'goto', target }。
Goto
  = "goto" _ target:Target _ ";"? _ {
      return { type: 'goto', target: target };
    }

// 结局：ending "文本"，返回 { type:'ending', text }。
Ending
  = "ending" _ text:StringLiteral _ ";"? _ {
      return { type: 'ending', text: text };
    }

// ------------------------------------------------------------
// 目标 (target)
// ------------------------------------------------------------
// “目标”可指向的值：
//   null        表示空目标（返回 JS 的 null）
//   标识符      一个引用名（如某场景 id）
Target
  = "null" { return null; }
  / Identifier


  // ------------------------------------------------------------
// 基础词法
// ------------------------------------------------------------

// 标识符：首字符为字母/下划线/美元符，后续可含数字，返回原文本。
Identifier
  = [a-zA-Z_$][a-zA-Z0-9_$]* { return text(); }

// 数字：可选负号 + 整数部分 +（可选）小数部分，转成浮点数返回。
Number
  = "-"? [0-9]+ ("." [0-9]+)? { return parseFloat(text()); }

// 布尔值：true / false。
Boolean
  = "true" { return true; }
  / "false" { return false; }

// 字符串字面量：优先匹配多行字符串，否则匹配单行字符串。
StringLiteral
  = MultiLineString
  / SingleLineString

// 单行字符串：一对双引号或单引号包裹，返回拼接后的去引号内容。
SingleLineString
  = '"' chars:DoubleStringChar* '"' { return chars.join(''); }
  / "'" chars:SingleStringChar* "'" { return chars.join(''); }

// 双引号串内单个字符：转义(\"等)/unicode(\uXXXX)/普通字符，原样返回。
DoubleStringChar
  = "\\" esc:["\\\/bfnrt] { return { '"': '"', '\\': '\\', '/': '/', 'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r', 't': '\t' }[esc]; }
  / "\\u" hex:[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F] { return String.fromCharCode(parseInt(hex.join(''), 16)); }
  / [^"\\] { return text(); }

// 单引号串内单个字符：同 DoubleStringChar，仅定界符为单引号。
SingleStringChar
  = "\\" esc:["\\\/bfnrt] { return { "'": "'", '\\': '\\', '/': '/', 'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r', 't': '\t' }[esc]; }
  / "\\u" hex:[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F] { return String.fromCharCode(parseInt(hex.join(''), 16)); }
  / [^'\\] { return text(); }

// 多行字符串：三个双/单引号包裹，可跨行，直到同种三引号结束。
// 内容会做“去缩进”处理（见 dedent）：去掉紧随开引号的换行、末尾换行+缩进，
// 以及所有非空行的公共前导空白，便于书写时自然缩进。
MultiLineString
  = '"""' chars:MultiDoubleChar* '"""' { return dedent(chars.join('')); }
  / "'''" chars:MultiSingleChar* "'''" { return dedent(chars.join('')); }

// 多行字符串中的一个字符。
// 注意：不能写成 `chars:(!'"""' .)*`——Peggy 中无 pluck 的序列返回的是
// “所有元素值组成的数组”，会导致 join 时每个字符前多出一个逗号。
MultiDoubleChar
  = !'"""' c:. { return c; }

MultiSingleChar
  = !"'''" c:. { return c; }

// 代码表达式：用于 if 等条件，贪婪捕获直到右括号 )，返回去除空白后的文本。
CodeExpression
  = (!")" .)* { return text().trim(); }

// 代码块：支持两种写法
//   { ... }                       无参（等价于无参箭头函数）
//   (a, b) => { ... }             含参
//   (n: number): void => { ... }  含参数/返回类型注释（TS）
// 统一返回“指针函数”源码字符串：
//   { ... }            -> "() => { ... }"
//   (a, b) => { ... }  -> "(a, b) => { ... }"
CodeBlockRaw
  = "(" _ params:CodeParams _ ")" _ (!"=>" .)* _ "=>" _ "{" _ body:CodeBody _ "}" {
      return text().trim();
    }
  / "{" _ body:CodeBody _ "}" {
      return "() => " + text().trim();
    }

// 箭头函数参数原文（原样捕获，支持 a / a, b / {a, b} / TS 类型注释）。
// 通过 CodeParamPart 递归匹配平衡括号，使类型中的 `()`（如 `fn: () => void`）
// 不会被当成参数区的结束括号。
CodeParams
  = CodeParamPart* { return text().trim(); }

// 参数中的一个片段：
//   1) 平衡括号组（函数类型、元组类型等）
//   2) 任意非 `)` 字符（字面量以外的普通字符，含 , : < > 空白等）
CodeParamPart
  = "(" CodeParams ")"
  / !")" .

// 代码块内部内容：依次识别 字符串/注释/嵌套子块/普通字符，返回整段文本。
CodeBody
  = (CodeString / CodeComment / CodeBlockNested / CodeChar)* { return text(); }

// 代码块里的字符串字面量：双引号/单引号/反引号，内部允许转义。
CodeString
  = '"' ('\\' . / [^"\\])* '"'
  / "'" ('\\' . / [^'\\])* "'"
  / "`" ('\\' . / [^`\\])* "`"

// 代码块里的注释：行注释 // 或 块注释 /* */，整体跳过。
CodeComment
  = "//" (![\n\r] .)*
  / "/*" (!"*/" .)* "*/"

// 代码块里的嵌套子代码块（保持大括号平衡）。
CodeBlockNested
  = "{" CodeBody "}"

// 代码块里的单个普通字符：非大括号、非引号、非反引号。
CodeChar
  = [^{}"'`]  // 任何非大括号、引号、反引号的字符

// 空白与注释（可跳过）
// “_”用于在各记号之间匹配并忽略空白/注释，不产生返回内容。
_ "whitespace"
  = ([ \t\n\r] / Comment)*

// 注释：行注释 // ... 到行尾，或 块注释 /* ... */（可跨多行）。
Comment
  = "//" (![\n\r] .)*
  / "/*" (!"*/" .)* "*/"

Time 
  = "\"" Y:Number "-" M:Number "-" D:Number " " H:Number ":" m: Number "\"" {
    return text().substring(1, text().length - 1);
  }

  // ---------- 通用数据字段（item / enemy 等内部键值对）----------
  // 1) key = value（普通值）
  // 2) key { ... }（后接代码块的属性，不加 =）
DataField
  = key:Identifier _ "=" _ value:DataValue _ ";"? _ { return { key, value }; }
  / key:Identifier _ value:CodeBlockRaw _ ";"? _ { return { key, value }; }

DataValue
  = DataArray
  / CodeBlockRaw
  / StringLiteral
  / Number
  / Boolean
  / "null" { return null; }
  / Identifier

// 数组字面量 [ ... ]，元素可为对象/数组/标量
DataArray
  = "[" _ items:DataArrayItems _ "]" { return items; }

DataArrayItems
  = first:DataArrayElem rest:(_ ","? _ e:DataArrayElem)* { return [first].concat(rest.map(x => x.e)); }
  / "" { return []; }

DataArrayElem
  = DataObject
  / DataArray
  / StringLiteral
  / Number
  / Boolean
  / "null" { return null; }
  / Identifier

// 数组里的对象字面量 { key = value ... }（例如 enemy 的 skill 项）
DataObject
  = "{" _ fields:DataField* _ "}" { return buildProps(fields); }