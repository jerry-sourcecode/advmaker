/**
 * 在命名中，如果一个类以 ADVUser 为前缀，则该类是面向用户代码，是用户代码提交配置的格式。
 * 若不以 ADVUser 开头，但以 ADV 开头，就是程序内部流传的代码。
 * 从 ADVUser 到 ADV 可以使用 ADV 的构造函数进行转化。
 */

import type { DiceExpression } from '../utils/dice.ts';
import { type Component, markRaw } from 'vue';
import { Game, RuntimeError } from '../game.ts';

type ADVNextLiteral = string | ADVChoice[] | ADVCheck | null;
export type ADVNext = VlAndFn<ADVNextLiteral>;
type ADVUserNextLiteral = string | ADVUserChoice[] | ADVUserCheck | null;
export type ADVUserNext = VlAndFn<ADVUserNextLiteral>;
export type MessageType = 'story' | 'system' | 'user';
export type IdKVType<T> = { [id: string]: T };
export type VlAndFn<T> = T | (() => T);
export type VlAndLs<T> = T | T[];

/**
 * 将用户下一步操作转换为系统可以识别的下一步操作
 * @param obj 用户定义的下一步操作对象
 * @returns 系统可识别的下一步操作对象
 */
function fromUserNectToNext(obj: ADVUserNextLiteral): ADVNextLiteral;
function fromUserNectToNext(obj: ADVUserNext): ADVNext;
function fromUserNectToNext(obj: ADVUserNext): ADVNext {
    if (obj === null) return null;
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'function')
        return () => {
            return fromUserNectToNext(obj());
        };
    if (Array.isArray(obj)) {
        const returns: ADVChoice[] = [];
        obj.forEach((v) => {
            returns.push(new ADVChoice(v));
        });
        return returns;
    }
    return new ADVCheck(obj);
}
export class ADVMessage {
    type: MessageType;
    content: string | Component;
    constructor(content: string | Component, type: MessageType) {
        this.content = content;
        this.type = type;
    }
}

export class ADVUserChoice {
    content: string | Component;
    visible?: () => boolean;
    next: ADVUserNext;
    maxTimes?: number;
    constructor(obj: ADVUserChoice) {
        if (typeof obj.content === 'string') this.content = obj.content;
        else this.content = markRaw(obj.content);
        this.next = obj.next;
        this.visible = obj.visible;
        this.maxTimes = obj.maxTimes;
    }
}

export class ADVChoice extends ADVUserChoice {
    next: ADVNext;
    times: number;
    maxTimes: number;
    visible: () => boolean;
    constructor(obj: ADVUserChoice) {
        super(obj);
        this.next = fromUserNectToNext(obj.next);
        this.times = 0;
        this.maxTimes = obj.maxTimes ?? Infinity;
        this.visible = obj.visible ?? (() => true);
    }
}

export class ADVUserScene {
    name: string;
    next: ADVUserNext;
    constructor(obj: ADVUserScene) {
        this.name = obj.name;
        this.next = obj.next;
    }
}

export class ADVScene extends ADVUserScene {
    id: string;
    type: 'Scene' = 'Scene';
    next: ADVNext;
    constructor(id: string, obj: ADVUserScene) {
        super(obj);
        this.id = id;
        this.next = fromUserNectToNext(obj.next);
    }
}

export class ADVUserDialog {
    script: VlAndLs<string | Component>;
    next: ADVUserNext;
    constructor(obj: ADVUserDialog) {
        this.script = obj.script;
        // 为 Component 增加 markRow
        if (Array.isArray(this.script)) {
            this.script.forEach((_, id, ls) => {
                if (typeof ls[id] !== 'string') ls[id] = markRaw(ls[id]);
            });
        } else {
            if (typeof this.script !== 'string') this.script = markRaw(this.script);
        }
        this.next = obj.next;
    }
}

export class ADVDialog extends ADVUserDialog {
    id: string;
    type: 'Dialog' = 'Dialog';
    next: ADVNext;
    constructor(id: string, obj: ADVUserDialog) {
        super(obj);
        this.id = id;
        this.next = fromUserNectToNext(obj.next);
    }
}

export class ADVUserItem {
    name?: string;
    desc?: string;
    summary?: string;
    default?: number;
    lore?: string;
    onUse?: ((num: number) => void) | null;
    onDiscard?: ((num: number) => void) | null;
    constructor(obj: ADVUserItem) {
        Object.assign(this, obj);
    }
}

export class ADVItem extends ADVUserItem {
    name: string;
    desc: string;
    summary: string;
    lore: string;
    default: number;
    id: string;
    onUse: ((num: number) => void) | null;
    onDiscard: ((num: number) => void) | null;
    type: 'Item' = 'Item';
    constructor(obj: ADVUserItem, id: string) {
        super(obj);
        this.name = obj.name ?? id;
        this.desc = obj.desc ?? '';
        this.summary = obj.summary ?? '';
        this.default = obj.default ?? 0;
        this.type = 'Item';
        this.id = id;
        this.lore = obj.lore ?? '';
        this.onUse = obj.onUse ?? null;
        if (obj.onDiscard === null) {
            this.onDiscard = null;
        } else {
            this.onDiscard = obj.onDiscard ?? (() => true);
        }
    }
}

type displayType = 'none' | 'hide' | 'number' | 'process';

export class ADVUserStatus {
    name?: string;
    max?: number;
    min?: number;
    default: number = 0;
    color?: VlAndFn<string>;
    isDisplay?: VlAndFn<displayType>;

    constructor(obj: ADVUserStatus) {
        Object.assign(this, obj);
    }
}

export class ADVStatus extends ADVUserStatus {
    name: string;
    id: string;
    max: number;
    min: number;
    value: number;
    color: VlAndFn<string>;
    group: string;
    isDisplay: VlAndFn<displayType>;

    constructor(obj: ADVUserStatus, id: string, group: string) {
        super(obj);
        this.name = obj.name ?? id;
        this.id = id;
        this.max = obj.max ?? Infinity;
        this.min = obj.min ?? 0;
        this.value = obj.default;
        this.color = obj.color ?? 'black';
        this.isDisplay = obj.isDisplay ?? 'hide';
        this.group = group;
    }
}

export class ADVUserStatusGroup {
    name?: string;
    content: IdKVType<ADVUserStatus> = {};
    constructor(obj: ADVUserStatusGroup) {
        Object.assign(this, obj);
    }
}

export class ADVUserGoods {
    inventory?: number;
    need: VlAndLs<IdKVType<number>> = [];
    constructor(obj: ADVUserGoods) {
        Object.assign(this, obj);
    }
}

export class ADVGoods extends ADVUserGoods {
    id: string;
    inventory: number;
    need: IdKVType<number>[];
    constructor(obj: ADVUserGoods, id: string) {
        super(obj);
        this.id = id;
        if (obj.need.length === 0) {
            Game.error(new RuntimeError(5, `The goods ${id} do not need any ingredients.`));
        }
        if (!Array.isArray(obj.need)) {
            obj.need = [obj.need];
        }
        this.need = obj.need;
        this.inventory = obj.inventory ?? Infinity;
    }
}

export class ADVDice {
    name: string;
    roll: () => number;

    constructor(name: string, roll: () => number) {
        this.name = name;
        this.roll = roll;
    }
}

export class ADVUserCheck {
    dice?: ADVDice | DiceExpression;
    target: VlAndFn<number> = () => 0;
    modifier?: { name: string; value: () => number }[];
    success: ADVUserNext = '';
    fail: ADVUserNext = '';
    onSuccess?: () => void;
    onFail?: () => void;

    constructor(obj: ADVUserCheck) {
        Object.assign(this, obj);
    }
}

export class ADVCheck extends ADVUserCheck {
    dice: ADVDice | DiceExpression = 'd6';
    modifier: { name: string; value: () => number }[] = [];
    type: 'Check';
    success: ADVNext;
    fail: ADVNext;
    onSuccess: () => void;
    onFail: () => void;
    constructor(obj: ADVUserCheck) {
        super(obj);
        this.type = 'Check';
        this.dice = obj.dice ?? 'd6';
        this.modifier = obj.modifier ?? [];
        this.success = fromUserNectToNext(obj.success);
        this.fail = fromUserNectToNext(obj.fail);
        this.onFail = obj.onFail ?? (() => {});
        this.onSuccess = obj.onSuccess ?? (() => {});
    }
}
