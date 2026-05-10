window.ADVMaker.appendScene('attic', {
    name: '阁楼',
    next: 'diary-dialog',
    onEnter: () => {
        console.log('主角在阁楼中醒来……');
    },
});

window.ADVMaker.appendScene('corridor', {
    name: '幽暗走廊',
    next: 'corridor-dialog',
});

window.ADVMaker.appendScene('garden', {
    name: '后花园',
    next: 'garden-end',
});
