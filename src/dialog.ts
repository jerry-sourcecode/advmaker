import { Adv } from '@advmaker/core';

Adv.appendScene('test-hub', {
    name: '主题',
    next: 'main-dia',
});

Adv.appendDialog('main-dia', {
    onStart: () => {
        Adv.audio.play('/audio/bgm.mp3', 'bgm', {
            loop: true,
        });
    },
}).say('Hello');
