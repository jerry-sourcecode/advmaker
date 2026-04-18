<template>
    <n-drawer
        v-model:show="isShow"
        placement="bottom"
        :mask-closable="false"
        :show-mask="false"
        :height="251"
    >
        <n-drawer-content title="你的选择">
            <div class="choice-div">
                <n-button v-for="(it, idx) in choices" class="choice-div-btn" @click="onClick(idx)">
                    <div>
                        {{ it.content }}
                    </div>
                </n-button>
            </div>
        </n-drawer-content>
    </n-drawer>
</template>

<script setup lang="ts">
import { ADVChoice } from '../data/model.ts';
import { ref } from 'vue';
import { useEmitter } from '../store/emitter.ts';
import { useMessageStore } from '../store/message.ts';

const emitter = useEmitter();
const messageStore = useMessageStore();

const choices = ref<ADVChoice[]>([]);
const choiceName = ref<string>('');
const isShow = ref<boolean>(false);

let resolve: (value: number) => void | null;

function onClick(idx: number) {
    isShow.value = false;
    messageStore.isMkChoice = false;
    resolve(idx);
}

emitter.on('make-choice', (chs: ADVChoice[], title: string = '你的选择') => {
    choices.value = chs;
    choiceName.value = title;
    isShow.value = true;
    messageStore.isMkChoice = true;
    return new Promise((res) => {
        resolve = res;
    });
});
</script>

<style scoped>
.choice-div {
    display: flex;
    flex-direction: column;
}
.choice-div-btn {
    width: 100%;
    justify-content: flex-start;
    padding: 25px;
    margin-bottom: 10px;
}
</style>
