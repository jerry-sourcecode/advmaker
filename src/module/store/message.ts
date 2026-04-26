/**
 * 这个仓库定义有关屏幕上信息的弹出相关部分。
 */

import { defineStore } from 'pinia';
import { type Component, ref } from 'vue';
import { ADVMessage } from '../data/model.ts';

export const useMessageStore = defineStore('message', () => {
    const messageList = ref<ADVMessage[]>([]);
    const isMkChoice = ref(false);

    function appendMessage(text: string | Component): void;
    function appendMessage(text: ADVMessage): void;
    function appendMessage(text: string | Component | ADVMessage): void {
        let new_message;
        if (text instanceof ADVMessage) {
            new_message = new ADVMessage((text as ADVMessage).content, (text as ADVMessage).type);
        } else {
            new_message = new ADVMessage(text, 'story');
        }
        messageList.value?.push(new_message);
    }

    return { appendMessage, messageList, isMkChoice };
});
