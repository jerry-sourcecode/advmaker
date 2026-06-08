/**
 * 这个仓库定义有关屏幕上信息的弹出相关部分。
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ADVMessage, type MessageContentTypeLiteral } from '../data/model.ts';
import { useEmitter } from './emitter.ts';

export const useMessageStore = defineStore('message', () => {
    const messageList = ref<ADVMessage[]>([]);
    const isMkChoice = ref(false);
    const choicePanelHeight = ref(0);
    const dialogCount = ref(0);

    function appendMessage(text: MessageContentTypeLiteral): void;
    function appendMessage(text: ADVMessage): void;
    function appendMessage(text: MessageContentTypeLiteral | ADVMessage): void {
        let new_message;
        if (text instanceof ADVMessage) {
            new_message = new ADVMessage((text as ADVMessage).content, (text as ADVMessage).type);
        } else {
            new_message = new ADVMessage(text, 'story');
        }
        messageList.value?.push(new_message);
        const emitter = useEmitter();
        emitter.emit('scroll-to-end');
    }

    return { appendMessage, messageList, isMkChoice, choicePanelHeight, dialogCount };
});
