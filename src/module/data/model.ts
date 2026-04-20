import type { DiceExpression } from '../utils/dice.ts';

export type ADVNext = string | ADVChoice[] | ADVCheck;
export type ADVUserNext = string | ADVUserChoice[] | ADVUserCheck;
export type MessageType = 'story' | 'system' | 'user';

function fromUserNectToNext(obj: ADVUserNext): ADVNext {
    if (typeof obj === 'string') return obj;
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
    content: string;
    constructor(content: string, type: MessageType) {
        this.content = content;
        this.type = type;
    }
}

export class ADVUserChoice {
    content: string;
    visible?: () => boolean;
    next: ADVUserNext;
    constructor(obj: ADVUserChoice) {
        this.content = obj.content;
        this.next = obj.next;
        this.visible = obj.visible;
    }
}

export class ADVChoice extends ADVUserChoice {
    next: ADVNext;
    constructor(obj: ADVUserChoice) {
        super(obj);
        this.next = fromUserNectToNext(obj.next);
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
    script: string[] | string;
    next: ADVUserNext;
    constructor(obj: ADVUserDialog) {
        this.script = obj.script;
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

export class ADVUserCheck {
    dice?: ADVDice | DiceExpression;
    target: (() => number) | number;
    modifier?: { name: string; value: () => number }[];
    success: ADVUserNext;
    fail: ADVUserNext;
    onSuccess?: () => void;
    onFail?: () => void;

    constructor(obj: ADVUserCheck) {
        this.dice = obj.dice;
        this.target = obj.target;
        this.modifier = obj.modifier;
        this.success = obj.success;
        this.fail = obj.fail;
        this.onSuccess = obj.onSuccess;
        this.onFail = obj.onFail;
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
