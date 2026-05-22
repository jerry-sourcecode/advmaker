<template>
    <n-drawer
        v-model:show="isShow"
        placement="bottom"
        :mask-closable="false"
        :show-mask="false"
        :height="281"
    >
        <n-drawer-content title="你的选择">
            <div class="choice-div" v-for="(it, idx) in choices">
                <n-button
                    v-if="it.visible() && it.times < it.maxTimes"
                    block
                    class="choice-div-btn"
                    @click="onClick(idx)"
                >
                    <div class="choice-btn-main">
                        <div v-html="it.content" v-if="isContentString(it.content)" />
                        <VNodeRenderer :VNode="it.content" v-else />
                    </div>
                    <div v-if="instanceType(it.next) === 'Check'" class="choice-btn-desc">
                        检定 {{ getDiceName((it.next as ADVCheck).dice) }}: 目标
                        {{ RV((it.next as ADVCheck).target) }}
                        |
                        <span v-for="(obj, idx) in (it.next as ADVCheck).modifier">
                            {{ obj.name }} <span v-if="obj.value() >= 0">+</span>{{ obj.value()
                            }}<span v-if="idx !== (it.next as ADVCheck).modifier!.length - 1">
                                ,
                            </span>
                        </span>
                    </div>
                </n-button>
            </div>
        </n-drawer-content>
    </n-drawer>
</template>

<script setup lang="ts">
import { ADVCheck, ADVChoice, ADVDice } from '../data/model';
import { type Component, ref } from 'vue';
import { useEmitter } from '../store/emitter';
import { useMessageStore } from '../store/message';
import { instanceType, RV } from '../utils/util';
import type { DiceExpression } from '../utils/dice.ts';
import VNodeRenderer from './VNodeRenderer.vue';

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

function isContentString(obj: Component | string) {
    return typeof obj === 'string';
}

function getDiceName(dice: ADVDice | DiceExpression) {
    if (typeof dice === 'object') {
        return dice.name;
    } else {
        return dice;
    }
}

emitter.on('make-choice', (chs: ADVChoice[], title: string = '你的选择') => {
    choices.value = chs;
    choiceName.value = title;
    isShow.value = true;
    messageStore.isMkChoice = true;
    emitter.emit('scroll-to-end');
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
    height: auto; /* 关键：取消固定高度 */
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 10px;
    padding: 12px 16px; /* 按钮本身的内边距，让文字不贴边 */
}

/* 覆盖内部 span 样式 */
.choice-div-btn :deep(.n-button__content) {
    display: flex; /* 变为弹性容器，确保能撑开 */
    flex-direction: column;
    align-items: flex-start;
    width: 100%; /* 占满宽度 */
    white-space: normal; /* 允许换行 */
    word-break: break-word;
    /* 如果还想用 margin，可以保留，但 padding 更稳定 */
    /* margin: 20px; */
}

.choice-btn-main {
    font-size: 18px;
    font-weight: 500;
    line-height: 1.4;
}

.choice-btn-desc {
    font-size: 12px;
    color: #888;
    line-height: 1.4;
}
</style>
