<template><slot /><slot name="content" /></template>

<script setup lang="ts">
import { inject, provide, onMounted, ref, useSlots, h, Fragment, type VNode } from 'vue';
import { Adv } from '../api';
import type { ADVUserChoice, ADVUserNext, ADVUserCheck, MessageContentType } from '../data/model';

const props = defineProps<{
    visible?: () => boolean;
    next?: ADVUserNext;
    check?: ADVUserCheck;
    maxTimes?: number;
    onChoose?: () => void;
}>();

const slots = useSlots();

// 收集选项内部所有通过 registerLine / registerContent 注册的内容
const innerContents = ref<MessageContentType[]>([]);

function localRegisterContent(content: MessageContentType) {
    innerContents.value.push(content);
}

// registerLine 也统一到 localRegisterContent
function localRegisterLine(vnode: VNode) {
    localRegisterContent(vnode);
}

provide('registerLine', localRegisterLine);
provide('registerContent', localRegisterContent);

const registerOption = inject<(option: ADVUserChoice) => void>('registerOption', () => {
    console.warn('[AOption] 必须在 <AOptions> 内部使用');
});

onMounted(() => {
    const contentSlots = slots.content?.();
    const contentVNode = contentSlots ? h(Fragment, null, contentSlots) : h(Fragment);

    const customOnChoose = props.onChoose;
    const composedOnChoose = async () => {
        // 1. 先执行用户自定义的 onChoose
        if (customOnChoose) {
            customOnChoose();
        }
        // 2. 按顺序处理内部收集的内容：VNode 用 Adv.print 打印，回调函数直接调用
        for (const item of innerContents.value) {
            await Adv.print(item);
        }
    };

    const userChoice: ADVUserChoice = {
        content: contentVNode,
        visible: props.visible,
        next: props.next,
        check: props.check,
        maxTimes: props.maxTimes,
        onChoose: composedOnChoose,
    };

    registerOption(userChoice);
});
</script>
