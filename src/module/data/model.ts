import type { DiceExpression } from '../utils/dice.ts';

export type ADVNext = string | ADVChoice[] | ADVCheck;
export type MessageType = 'story' | 'system' | 'user';

export class ADVMessage {
    type: MessageType;
    content: string;
    constructor(content: string, type: MessageType) {
        this.content = content;
        this.type = type;
    }
}

export class ADVChoice {
    content: string;
    visible?: () => boolean;
    next: string | ADVScene | ADVDialog | ADVCheck;
    constructor(content: string) {
        this.content = content;
        this.next = '';
    }
}

export class ADVScene {
    name: string;
    next: ADVNext;
    id: string;
    type: 'Scene' = 'Scene';
    constructor(name: string, next: string) {
        this.name = name;
        this.next = next;
        this.id = '';
    }
}

export class ADVDialog {
    script: string[] | string;
    next: ADVNext;
    id: string;
    type: 'Dialog' = 'Dialog';
    constructor(script: string[] | string, next: string) {
        this.script = script;
        this.next = next;
        this.id = '';
    }
}

export class ADVItem {
    name: string;
    number?: number;
    id: string;
    type: 'Item' = 'Item';
    constructor(name: string, number: number = 1) {
        this.name = name;
        this.number = number;
        this.id = '';
    }
}

export class ADVStatus {
    name: string;
    id: string;
    max: number;
    min: number;
    value: number;
    color: string;

    constructor(name: string, max: number, min: number, value: number) {
        this.name = name;
        this.max = max;
        this.min = min;
        this.value = value;
        this.id = '';
        this.color = 'blue';
    }
}

export class ADVDice {
    name: string;
    func: () => number;

    constructor(name: string, func: () => number) {
        this.name = name;
        this.func = func;
    }
}

export class ADVCheck {
    dice?: ADVDice | DiceExpression;
    target: (() => number) | number;
    modifier?: { name: string; value: () => number }[];
    success: ADVNext;
    fail: ADVNext;
    onSuccess?: () => void;
    onFail?: () => void;

    constructor(tgt: number) {
        this.target = tgt;
        this.success = '';
        this.fail = '';
    }
}
