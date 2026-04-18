export class ADVMessage {
    type: 'story' | 'system';
    content: string;
    constructor(content: string, type: 'story' | 'system') {
        this.content = content;
        this.type = type;
    }
}

export class ADVChoice {
    content: string;
    next: string | ADVScene | ADVDialog;

    constructor(content: string) {
        this.content = content;
        this.next = '';
    }
}

export class ADVScene {
    name: string;
    next: string | ADVChoice[];
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
    next: string | ADVChoice[];
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
