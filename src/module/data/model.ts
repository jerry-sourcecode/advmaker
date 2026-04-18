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

    constructor(content: string) {
        this.content = content;
    }
}

export class ADVScene {
    name: string;
    next: string;
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
    next: string;
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
