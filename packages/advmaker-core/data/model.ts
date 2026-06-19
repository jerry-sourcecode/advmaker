/**
 * 在命名中，如果一个类以 ADVUser 为前缀，则该类是面向用户代码，是用户代码提交配置的格式。
 * 若不以 ADVUser 开头，但以 ADV 开头，就是程序内部流传的代码。
 * 从 ADVUser 到 ADV 可以使用 ADV 的构造函数进行转化。
 */

import type { DiceExpression } from '../utils/dice.ts';
import { type VNode } from 'vue';
import type { CharsIds, ItemIds, StatusIds } from '../type/user';

type ADVNextLiteral = string | ADVChoice[] | null;
export type ADVNext = VlAndFn<ADVNextLiteral> | (() => void);
type ADVUserNextLiteral = string | ADVUserChoice[] | null;
export type ADVUserNext = VlAndFn<ADVUserNextLiteral> | (() => void);
export type MessageType = 'story' | 'system' | 'user';
export type IdKVType<T, K extends string = string> = {
    [id in K]: T;
};
export type VlAndFn<T> = T | (() => T);
export type VlAndLs<T> = T | T[];
export type VlAndAsync<T> = T | Promise<T>;
export type MessageContentType =
    | string
    | VNode
    | (() => Promise<void>)
    | null
    | ADVChoice[]
    | ADVCommand;
export type MessageContentTypeLiteral = string | VNode;
/**
 * 将用户下一步操作转换为系统可以识别的下一步操作
 * @param obj 用户定义的下一步操作对象
 * @returns 系统可识别的下一步操作对象
 */
export function fromUserNextToNext(obj: ADVUserNextLiteral): ADVNextLiteral;
export function fromUserNextToNext(obj: ADVUserNext): ADVNext;
export function fromUserNextToNext(obj: ADVUserNext): ADVNext {
    if (obj === null || obj === undefined) return null;
    if (typeof obj === 'function')
        return () => {
            return fromUserNextToNext(obj() ?? null);
        };
    if (Array.isArray(obj)) {
        const returns: ADVChoice[] = [];
        obj.forEach((v) => {
            returns.push(new ADVChoice(v));
        });
        return returns;
    }
    return obj;
}
export class ADVMessage {
    type: MessageType;
    content: MessageContentTypeLiteral;
    constructor(content: MessageContentTypeLiteral, type: MessageType) {
        this.content = content;
        this.type = type;
    }
}

export class ADVUserChoice {
    content: MessageContentTypeLiteral = '';
    visible?: () => boolean;
    next?: ADVUserNext;
    check?: ADVUserCheck;
    maxTimes?: number;
    onChoose?: () => VlAndAsync<void>;
    constructor(obj: ADVUserChoice) {
        Object.assign(this, obj);
    }
}

export class ADVChoice extends ADVUserChoice {
    next: ADVNext;
    check?: ADVCheck;
    times: number;
    maxTimes: number;
    visible: () => boolean;
    onChoose: () => VlAndAsync<void>;
    constructor(obj: ADVUserChoice) {
        super(obj);
        this.next = fromUserNextToNext(obj.next ?? null);
        this.check = obj.check ? new ADVCheck(obj.check) : undefined;
        this.times = 0;
        this.maxTimes = obj.maxTimes ?? Infinity;
        this.visible = obj.visible ?? (() => true);
        this.onChoose = obj.onChoose ?? (() => {});
    }
}

export class ADVUserScene {
    name: string = '';
    next?: ADVUserNext;
    onEnter?: () => VlAndAsync<void>;
    onLeave?: () => VlAndAsync<void>;
    constructor(obj: ADVUserScene) {
        Object.assign(this, obj);
    }
}

export class ADVScene extends ADVUserScene {
    id: string;
    type: 'Scene' = 'Scene';
    next: ADVNext;
    onEnter: () => VlAndAsync<void>;
    onLeave: () => VlAndAsync<void>;
    constructor(id: string, obj: ADVUserScene) {
        super(obj);
        this.id = id;
        this.next = fromUserNextToNext(obj.next ?? null);
        this.onEnter = obj.onEnter ?? (() => {});
        this.onLeave = obj.onLeave ?? (() => {});
    }
}

export class ADVUserDialog {
    script?: MessageContentType[];
    next?: ADVUserNext;
    check?: ADVUserCheck;
    in?: string;
    onStart?: () => VlAndAsync<void>;
    onFinish?: () => VlAndAsync<void>;
    constructor(obj: ADVUserDialog) {
        Object.assign(this, obj);
    }
}

export class ADVDialog extends ADVUserDialog {
    id: string;
    in?: string;
    type: 'Dialog' = 'Dialog';
    next: ADVNext;
    check?: ADVCheck;
    script: Array<MessageContentType>;
    onStart: () => VlAndAsync<void>;
    onFinish: () => VlAndAsync<void>;
    constructor(id: string, obj: ADVUserDialog) {
        super(obj);
        this.id = id;
        this.in = obj.in;
        this.next = fromUserNextToNext(obj.next ?? null);
        this.check = obj.check ? new ADVCheck(obj.check) : undefined;
        this.onStart = obj.onStart ?? (() => {});
        this.onFinish = obj.onFinish ?? (() => {});
        this.script = obj.script ?? [];
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
    id: ItemIds;
    onUse: ((num: number) => void) | null;
    onDiscard: ((num: number) => void) | null;
    type: 'Item' = 'Item';
    constructor(obj: ADVUserItem, id: ItemIds) {
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
            this.onDiscard = obj.onDiscard ?? (() => {});
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
    id: StatusIds;
    max: number;
    min: number;
    default: number;
    color: VlAndFn<string>;
    group: string;
    isDisplay: VlAndFn<displayType>;

    constructor(obj: ADVUserStatus, id: StatusIds, group: string) {
        super(obj);
        this.name = obj.name ?? id;
        this.id = id;
        this.max = obj.max ?? Infinity;
        this.min = obj.min ?? 0;
        this.default = obj.default;
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

export type ADVRecipe = Partial<{
    [K in ItemIds | 'id']: K extends ItemIds ? number : string;
}>;

export class ADVUserGoods {
    default?: number;
    need: VlAndLs<ADVRecipe> = [];
    constructor(obj: ADVUserGoods) {
        Object.assign(this, obj);
    }
}

export class ADVGoods extends ADVUserGoods {
    id: string;
    default: number;
    need: ADVRecipe[];
    constructor(obj: ADVUserGoods, id: string) {
        super(obj);
        this.id = id;
        if (!Array.isArray(obj.need)) {
            obj.need = [obj.need];
        }
        this.need = obj.need;
        this.default = obj.default ?? Infinity;
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
    targetDesc?: string;
    modifier?: { name: string; value: () => number }[];
    success: ADVUserNext = '';
    fail: ADVUserNext = '';
    onSuccess?: () => VlAndAsync<void>;
    onFail?: () => VlAndAsync<void>;

    constructor(obj: ADVUserCheck) {
        Object.assign(this, obj);
    }
}

export class ADVCheck extends ADVUserCheck {
    targetDesc: string;
    modifier: { name: string; value: () => number }[] = [];
    type: 'Check';
    success: ADVNext;
    fail: ADVNext;
    onSuccess: () => VlAndAsync<void>;
    onFail: () => VlAndAsync<void>;
    constructor(obj: ADVUserCheck) {
        super(obj);
        this.type = 'Check';
        this.targetDesc = obj.targetDesc ?? '';
        this.modifier = obj.modifier ?? [];
        this.success = fromUserNextToNext(obj.success);
        this.fail = fromUserNextToNext(obj.fail);
        this.onFail = obj.onFail ?? (() => {});
        this.onSuccess = obj.onSuccess ?? (() => {});
    }
}

export class ADVUserCharacter {
    name: string = '';
    desc?: string;
    impression?: string[];
    constructor(obj: ADVUserCharacter) {
        Object.assign(this, obj);
    }
}

export class ADVCharacter extends ADVUserCharacter {
    id: CharsIds;
    impression: string[];
    desc: string;
    know: boolean;
    constructor(obj: ADVUserCharacter, id: CharsIds) {
        super(obj);
        this.impression = obj.impression ?? [];
        this.id = id;
        this.desc = obj.desc ?? '';
        this.know = false;
    }
}

type CommandType = 'if' | 'end' | 'else' | 'elif' | 'return';

export class ADVCommand {
    call: (() => any) | null;
    type: CommandType;
    constructor(type: CommandType, call: (() => any) | null) {
        this.call = call;
        this.type = type;
    }
}

export class ADVCIf extends ADVCommand {
    call: () => boolean | Promise<boolean> = () => true;
    constructor(call: () => boolean | Promise<boolean>) {
        super('if', call);
        this.call = call;
    }
}

export class ADVCElse extends ADVCommand {
    call: null = null;
    constructor() {
        super('else', null);
    }
}

export class ADVCElif extends ADVCommand {
    call: () => boolean | Promise<boolean> = () => true;
    constructor(call: () => boolean | Promise<boolean>) {
        super('elif', call);
        this.call = call;
    }
}

export class ADVCEnd extends ADVCommand {
    call: null = null;
    constructor() {
        super('end', null);
    }
}

export class ADVCReturn extends ADVCommand {
    call: null = null;
    constructor() {
        super('return', null);
    }
}
