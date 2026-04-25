这是一个帮助你制作互动小说的模板。使用 Vue + Typescript
# 如何使用？

本项目中的所有 api 都存放于 ADVMaker 类。

## 全局设置

你可以在 src/game.config.ts 中进行全局设置

参数如下：

| 参数名       | 类型       | 描述                |  
|-----------|----------|-------------------|  
| items     | `object` | 游戏中的物品配置，详见下文添加物品 |  
| status    | `object` | 游戏中的状态配置，详见下文状态   |  
| mainScene | `string` | 主要场景的 id，游戏的入口    |  
| gameName  | `string` | 游戏名称，会显示在界面最上方    |  

使用 `ADVMaker.defineConfig(config: GameConfig)` 来定义全局配置。

简明示例：

```ts
import { ADVMaker } from './module/api.ts';

ADVMaker.defineConfig({
    items: {
        Water: {
            defaultNumber: 10,
            name: '水',
        },
    },
    status: {
        hp: {
            defaultValue: 100,
            name: '生命',
            color: 'red',
        },
        sp: {
            defaultValue: 90,
            name: '魔力值',
        }
    },
    mainScene: 'main',
    gameName: '新游戏',
});

```

## 添加场景和对话

### 场景

场景的定义方式如下：

```ts  
ADVMaker.appendScene(id: string, config: ADVUserScene): ADVScene;  
```  

`id` 是场景的唯一标识符，`config` 是场景的设置。

`ADVUserScene`类的参数：

| 参数名  | 类型            | 描述        |  
|------|---------------|-----------|  
| name | `string`      | 场景的名称     |  
| next | `ADVUserNext` | 下一步进行什么动作 |  

其中，`ADVUserNext` 可以是以下几种类型：

- 字符串：表示下一个场景的ID。
- 数组：表示多个选择，每个选择是一个 `ADVUserChoice` 对象。详见下文选项。
- 检定对象（`ADVUserCheck`）：表示一个检定。详见下文检定。
- 函数：返回上述任意一种类型。

`ADVScene` 相对 `ADVUserScene` 多了一个 `id` 属性（`string`），可以获取新建场景的 id（即函数参数中提供的 id）。


如果想要让游戏结束，可以调用 `ADVMaker.end(desc): ADVScene`，这个函数会返回一个表示游戏结束的场景。参数`desc`表示游戏结束时给的描述。

### 对话

对话的定义方式如下：

```ts
ADVMaker.appendDialog(id: string, config: ADVUserDialog): ADVDialog;  
```  

`id` 是对话的唯一标识符，`config` 是对话的设置。

任意两个场景或对话都不能够拥有相同的唯一标识符。

`ADVUserDialog`类的参数：

| 参数名    | 类型                                            | 描述                           |     |
| ------ | --------------------------------------------- | ---------------------------- | --- |
| script | `string / Component / (string / Component)[]` | 对话内容，这里可以填写 HTML 代码或者 Vue 组件 |     |
| next   | `ADVUserNext`                                 | 下一步进行什么动作                    |     |

同样的`ADVScene`会有一个 `id` 属性（`string`），可以获取新建对话的 id。

### 选项

选项，一般指 `ADVUserChoice` 类型，用于在对话中提供多个选项供玩家选择。

`ADVUserChoice` 类的参数：

| 参数名      | 类型                   | 默认值          | 描述                              |     |
| -------- | -------------------- | ------------ | ------------------------------- | --- |
| content  | `string / Component` | -            | 选项的文本内容，这里可以填写 HTML 代码或者 Vue 组件 |     |
| next     | `ADVUserNext`        | -            | 下一步进行什么动作                       |     |
| maxTimes | `number`             | `Infinity`   | 这个选项在被选中多少次之后就会消失               |     |
| visible  | `() => boolean`      | `() => true` | 控制选项是否可以被渲染                     |     |

### 判定

判定（或称检定），一般使用 `ADVUserCheck` 类型，用于在对话中根据玩家的属性进行条件判断，判定的结果会影响对话的走向。

`ADVUserCheck` 类的参数：

| 参数名       | 类型                                        | 默认值        | 描述                                  |     |
| --------- | ----------------------------------------- | ---------- | ----------------------------------- | --- |
| dice      | `ADVDice / DiceExpression`                | `'d6'`     | 判定使用的骰子，其类型会在下面讲解                   |     |
| target    | `(() => number) / number`                 | -          | 目标，投出多少算成功                          |     |
| modifier  | `{ name: string, value: () => number }[]` | `[]`       | 你可以对结果进行修正。`name`为修正的原因，`value`为修正值 |     |
| success   | `ADVUserNext`                             | -          | 成功时下一步进行的动作                         |     |
| fail      | `ADVUserNext`                             | -          | 失败时下一步进行的动作                         |     |
| onSuccess | `() => void`                              | `() => {}` | 成功时的回调                              |     |
| onFail    | `() => void`                              | `() => {}` | 失败时的回调                              |     |
#### 如何描述一个骰子

**方法一：使用 ADVDice 类**

`ADVDice` 类的参数：

| 参数名  | 类型             | 描述    |
| ---- | -------------- | ----- |
| name | `string`       | 骰子的名称 |
| roll | `() => number` | 投掷的结果 |

**方法二：使用 DiceExpression**

使用一个形似 `{m}d{n}`的字符串来表示一个有 $n$ 面的骰子，投掷 $m$ 次的结果总和。

例如：`2d6`，表示一个有 6 面的骰子，投掷 2 次的结果总和。

$m$ 可以省略，默认为 1，即投掷一次。

例如：`d6`，表示一个有 6 面的骰子，投掷 1 次的结果总和。


### 简单示例

#### 场景示例

```ts
import { ADVMaker } from '../module/api.ts';
export default ADVMaker.appendScene('main' /*这个场景的id为main*/, {  
    name: '家中', // 会渲染在页面正中央
    next: 'main_dialog', // 接下来跳转到 main_dialog
});
```

#### 对话示例

```ts
import { ADVMaker } from '../module/api.ts';
import Main from './main.vue';  
  
export default ADVMaker.appendDialog('main-dialog', {  
    script: [
	    '你好！', 
	    '我是你的向导。', 
	    '接下来，让我们一同<b>冒险</b>吧', // 允许 HTML
	    "Let's go!", 
	    Main // 允许 Vue 组件
    ],  
    next: [  
        {            
	        content: '选择1',
            next: {  
                target: 10,  
                modifier: [
	                // 添加一个名为 智慧 的修改项，且值始终为 +4
	                { name: '智慧', value: () => 4 },
	                // 添加一个名为 勇气 的修改项，且值始终为 -3
	                { name: '勇气', value: () => -3 }
	            ],  
                success: 'succ', // 胜利时转移到的对话，id为succ 
                fail: 'fail',  // 失败时转移到的对话，id为fail
                dice: '2d6',  // 投掷一个 2d6 的骰子
            },  
            maxTimes: 3, // 最大允许选择3次
        },  
        {  
            content: '选择2',  
            // 跳转到结局
            next: ADVMaker.end('你失败了，游戏结束').id,  
        },  
    ],  
});  

// 定义一个id为succ的对话
ADVMaker.appendDialog('succ', {  
    script: '恭喜你，成功了！',  
    next: 'main-dialog',  
});  

// 定义一个id为fail的对话
ADVMaker.appendDialog('fail', {  
    script: '很遗憾，失败了！',  
    next: ADVMaker.end('游戏结束，你失败了').id,  
});
```

此外，你可以用`appendMessage`函数来直接在屏幕上输出文字，其原型如下：

```ts
ADVMaker.appendMessage(content: string | Component, type: MessageType = 'story');
```

其中，`MessageType`是一个枚举类，其取值如下：
- `story`：普通故事
- `user`：用户的操作
- `system`：系统反馈

## 关于属性

### 属性的声明

你可以在全局设置中声明一个属性，其类型如下：

```ts
status: {
	// id 为该属性的唯一标识符
    [id: string]: {
	    // 该属性的默认值，默认为 0
        defaultValue?: number;
        // 该属性的名称，会展示给用户，默认和 id 相同
        name?: string;  
        // 属性的最大值，默认 100
        max?: number;  
        // 属性的最小值，默认 0
        min?: number;  
        // 属性对应的进度条的颜色，默认为 blue
        color?: string;  
    };  
};
```

所有的属性会渲染在游戏界面最上端，包括`name`属性，属性值和对应的进度条。


### 属性的查询和修改

可以调用以下两个函数进行属性的查询和修改：

```ts
// 查询属性值，若属性未被注册则返回 undefined
// item 为属性的 id
ADVMaker.getStatue(item: string): number | undefined;
// 将属性值增加 number，若属性未被注册则报错
// item 为属性的 id
ADVMaker.obtainStatus(item: string, number: number): void;
```

## 关于物品

### 物品的声明

和属性类似，你可以在全局设置中声明一个物品，其类型如下：

```ts
items: {  
    [id: string]: {  
	    // 默认持有多少
        defaultNumber: number; 
        name?: string;  
    };  
};
```

### 物品的查询和修改

可以调用以下两个函数进行物品的查询和修改：

```ts
// 查询物品有多少个，若物品未被注册则返回 undefined
// item 为物品的 id
ADVMaker.getItem(item: string): number | undefined;
// 获得 number 个物品，若物品未被注册则报错，若生效后物品数量少于0也会报错
ADVMaker.obtainitem(item: string, number: number): void;
```


# 依赖

- Vue + Vite
- pinia：用于数据存储
- naive-ui：用于UI组件