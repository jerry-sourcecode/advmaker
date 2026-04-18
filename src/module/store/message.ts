import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ADVMessage } from '../data/model.ts';

export const useMessageStore = defineStore('message', () => {
    const messageList = ref<ADVMessage[]>([]);
    const isMkChoice = ref(false);

    function appendMessage(text: string): void;
    function appendMessage(text: ADVMessage): void;
    function appendMessage(text: string | ADVMessage): void {
        let new_message;
        if (typeof text === 'string') {
            new_message = new ADVMessage(text as string, 'story');
        } else {
            new_message = new ADVMessage((text as ADVMessage).content, (text as ADVMessage).type);
        }
        messageList.value?.push(new_message);
    }

    return { appendMessage, messageList, isMkChoice };
});
