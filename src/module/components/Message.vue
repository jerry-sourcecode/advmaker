<template>
    <div class="outer-div">
        <div>
            <n-divider class="room-title-text">
                <p>{{ stateStore.location }}</p>
            </n-divider>
        </div>

        <div
            :style="`${messageStore.isMkChoice ? `margin` : `padding`}-bottom: 251px`"
            id="main-content"
            @click="onScreenClick"
        >
            <TransitionGroup name="message" tag="div" class="message-box">
                <div
                    v-for="(it, idx) in messageStore.messageList"
                    :key="idx"
                    style="margin-bottom: 10px"
                >
                    <p
                        :style="`color: ${getColor(it.type)}; font-style: ${getFontStyle(it.type)}`"
                        v-html="it.content"
                        v-if="isContentString(it.content)"
                    />
                    <VNodeRenderer :VNode="it.content" v-else />
                </div>
            </TransitionGroup>
            <div class="hint-text" v-if="isWaitClick">点击屏幕继续</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useMessageStore } from '../store/message.ts';
import { useStateStore } from '../store/state.ts';
import { useEmitter } from '../store/emitter.ts';
import { type Component, ref } from 'vue';
import type { MessageType } from '../data/model.ts';
import VNodeRenderer from './VNodeRenderer.vue';

const messageStore = useMessageStore();
const stateStore = useStateStore();
const emitter = useEmitter();

const isWaitClick = ref(false);

let resList: (() => void)[] = [];
emitter.on('wait-for-click-screen', () => {
    isWaitClick.value = true;
    return new Promise((res) => {
        resList.push(res);
    });
});

function onScreenClick() {
    isWaitClick.value = false;
    resList.forEach((v) => v());
    resList = [];
}

function isContentString(obj: Component | string) {
    return typeof obj === 'string';
}

function getColor(type: MessageType) {
    if (type === 'story') return 'black';
    else if (type === 'system') return '#888';
    else if (type === 'user') return '#E6A23C';
    return 'black';
}
function getFontStyle(type: MessageType) {
    if (type === 'system') return 'italic';
    return 'normal';
}
</script>

<style scoped>
.outer-div {
    display: flex;
    flex-direction: column;
    height: 100%;
    flex: 1;
    min-height: 0;
}
.message-box {
    padding: 0 10px 10px;
    font-size: 20px;
    margin: 5px;
}

.room-title-text {
    color: #909399;
    font-size: 21px;
}

.hint-text {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 18px;
    font-weight: 400;
    letter-spacing: 2px;
    white-space: nowrap;

    /* 镂空效果核心：文字本身深色半透明，且无背景无边框 */
    color: rgba(0, 0, 0, 0.5); /* 半透明黑色，在白底上呈淡灰色 */
    background: transparent; /* 确保无背景 */
    border: none; /* 无边框 */

    /* 可选：增加极细微的动画保持视觉提示 */
    animation: subtlePulse 2s infinite ease-in-out;
}

@keyframes subtlePulse {
    0%,
    100% {
        opacity: 0.4;
    }
    50% {
        opacity: 0.9;
    }
}
/* 动画相关样式 */
.message-enter-active {
    transition: all 0.3s ease-out;
}

.message-leave-active {
    transition: all 0.3s ease-in;
}

/* 进入起始状态：透明且向下偏移 */
.message-enter-from {
    opacity: 0;
    transform: translateY(20px);
}

/* 离开结束状态：透明且向下偏移（如果需要离开动画） */
.message-leave-to {
    opacity: 0;
    transform: translateY(20px);
}
</style>
