<template>
    <slot />
    <slot name="content" />
</template>

<script setup lang="ts">
import { inject, provide, onMounted, ref, useSlots, h, Fragment, type VNode } from 'vue';
import { Adv } from '../api';
import type { ADVUserChoice, ADVUserNext, ADVUserCheck } from '../data/model';

const props = defineProps<{
    // ADVUserChoice 中除 content 外的所有属性
    visible?: () => boolean;
    next?: ADVUserNext;
    check?: ADVUserCheck;
    maxTimes?: number;
    onChoose?: () => void;
}>();

const slots = useSlots();

// 覆盖 registerLine，将内部的 ALine VNode 收集到这里
const innerLines = ref<VNode[]>([]);
function localRegisterLine(vnode: VNode) {
    innerLines.value.push(vnode);
}
provide('registerLine', localRegisterLine);

// 从 AOptions 获取注册函数
const registerOption = inject<(option: ADVUserChoice) => void>('registerOption', () => {
    console.warn('[AOption] 必须在 <AOptions> 内部使用');
});

onMounted(() => {
    // 获取 content 插槽的 VNode（打包为一个 Fragment）
    const contentSlots = slots.content?.();
    const contentVNode = contentSlots ? h(Fragment, null, contentSlots) : h(Fragment);

    // 构造 onChoose
    const customOnChoose = props.onChoose;
    const composedOnChoose = async () => {
        if (customOnChoose) {
            customOnChoose();
        }
        for (const lineVNode of innerLines.value) {
            await Adv.print(lineVNode);
        }
    };

    // 构建 ADVUserChoice 对象
    const userChoice = {
        content: contentVNode,
        visible: props.visible,
        next: props.next,
        check: props.check,
        maxTimes: props.maxTimes,
        onChoose: composedOnChoose,
    } as ADVUserChoice;

    registerOption(userChoice);
});
</script>
