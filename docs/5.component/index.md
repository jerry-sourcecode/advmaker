# 第五章 故事组件

在之前的章节中，你通过直接调用 `Adv` API 一步步搭建起对话流、场景和选项。这种方式功能强大，但当故事规模逐渐扩大，大量的 API 调用会变得难以维护。想象一下，你需要手动管理每一个对话的 ID、next 指向、选项的注册与回调，这就像用汇编语言写应用程序——每一条指令都尽在掌控，却极容易出错。

从这一章开始，你将认识 ADVMaker 的 **故事组件** —— 一套专为叙事设计的声明式语法糖。它们以 Vue 组件的形式存在，让你能够像搭积木一样直观地编排故事结构，同时自动处理 next 推断、内容收集与 API 调用。你只需要关心 **"故事长什么样"** ，剩下的复杂逻辑都交给组件去完成。

> 📖 **本章目录**
>
> - [5.1 组件一览](5.1-overview.md) — 组件家族总览
> - [5.2 基础对话](5.2-basic-dialog.md) — AShell、ADialog、ALine
> - [5.3 场景编排](5.3-scenes.md) — AScene
> - [5.4 选项系统](5.4-options.md) — AOptions、AOption
> - [5.5 游戏结局](5.5-ending.md) — AEnding
> - [5.6 高级技巧](5.6-advanced.md) — 手动控制 next、嵌套组合等
> - [5.7 程序控制语句](5.7-control.md) — AIf、AElif、AElse、AEndDialog、AGoto
> - [5.8 运行与检定](5.8-action.md) — ARun、ACheck
