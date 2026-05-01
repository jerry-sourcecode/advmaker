<template>
    <n-modal v-model:show="showModal">
        <n-card class="responsive-dialog" title="背包">
            <div class="parent responsive-dialog-scrollBar">
                <n-thing
                    v-for="it in stateStore.backpack"
                    class="clickable-box"
                    @click="showDetail(it[0], it[1])"
                >
                    <template #header-extra>
                        <n-statistic :value="it[1]">
                            <template #prefix>×</template>
                        </n-statistic>
                    </template>
                    <template #header>{{ getItemDetail(it[0])?.name }}</template>
                    <template #description>
                        <i>{{ getItemDetail(it[0])?.summary }}</i>
                    </template>
                    <div v-html="getItemDetail(it[0])?.desc" />
                </n-thing>
            </div>
            <n-modal v-model:show="showDetailModal">
                <n-card class="responsive-dialog-small">
                    <n-thing class="responsive-dialog-scrollBar">
                        <div>
                            <div v-html="detailObj?.desc" />
                            <div v-html="detailObj?.lore" />
                        </div>
                        <template #header>{{ detailObj?.name }}</template>
                        <template #description>
                            <i>{{ detailObj?.summary }}</i>
                        </template>
                    </n-thing>
                    <template #action v-if="showDetailAction">
                        <n-space vertical style="margin-bottom: 10px">
                            <n-slider
                                v-model:value="detailValue"
                                :step="1"
                                :max="detailObjNumber"
                                :tooltip="false"
                            />
                            <n-input-number
                                v-model:value="detailValue"
                                size="small"
                                :max="detailObjNumber"
                                :min="0"
                            >
                                <template #prefix>选择</template>
                                <template #suffix>个</template>
                            </n-input-number>
                        </n-space>

                        <n-space>
                            <n-button
                                size="small"
                                v-if="detailObj!.onUse !== null"
                                @click="actionUse"
                                :disabled="detailValue === 0"
                            >
                                使用
                            </n-button>
                            <n-button
                                size="small"
                                v-if="detailObj!.onDiscard !== null"
                                @click="actionDiscard"
                                :disabled="detailValue === 0"
                            >
                                丢弃
                            </n-button>
                        </n-space>
                    </template>
                </n-card>
            </n-modal>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { useStateStore } from '../../store/state.ts';
import { useStoryStore } from '../../store/story.ts';
import { computed, type Ref, ref } from 'vue';
import type { ADVItem } from '../../data/model.ts';
import { useDialog } from 'naive-ui';
import { ADVMaker } from '../../api.ts';

const showModal = defineModel({ type: Boolean });
const showDetailModal = ref(false);
const detailValue = ref(0);
const detailObj: Ref<ADVItem | null> = ref(null);
const detailObjNumber = ref(0);
const stateStore = useStateStore();
const storyStore = useStoryStore();
const dialog = useDialog();

function getItemDetail(id: string) {
    return storyStore.objectMap.get(id);
}

function showDetail(id: string, num: number) {
    detailObj.value = getItemDetail(id)!;
    detailObjNumber.value = num;
    detailValue.value = 0;
    showDetailModal.value = true;
}

const showDetailAction = computed(() => {
    return detailObj.value?.onUse !== null || detailObj.value.onDiscard !== null;
});

function actionUse() {
    dialog.warning({
        title: '警告',
        content: `你确定要使用 ${detailValue.value} 个${detailObj.value?.name}？`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
            ADVMaker.appendMessage(
                `玩家使用 ${detailValue.value} 个${detailObj.value?.name}。`,
                'user',
            );
            detailObj.value!.onUse!(detailValue.value);
            showDetailModal.value = false;
            stateStore.backpack.set(
                detailObj.value!.id,
                detailObj.value!.number - detailValue.value,
            );
        },
    });
}

function actionDiscard() {
    dialog.warning({
        title: '警告',
        content: `你确定要丢弃 ${detailValue.value} 个${detailObj.value?.name}？`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
            ADVMaker.appendMessage(
                `玩家丢弃 ${detailValue.value} 个${detailObj.value?.name}。`,
                'user',
            );
            detailObj.value!.onDiscard!(detailValue.value);
            showDetailModal.value = false;
            stateStore.backpack.set(
                detailObj.value!.id,
                detailObj.value!.number - detailValue.value,
            );
        },
    });
}
</script>

<style scoped>
.parent {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

@media (max-width: 768px) {
    .parent {
        grid-template-columns: repeat(1, 1fr);
    }
}

.clickable-box {
    /* 基础样式：白色背景、深色文字 */
    background: #ffffff;
    color: #333;
    padding: 16px 32px;
    border-radius: 8px;
    cursor: pointer;

    /* ③ 持久阴影 */
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    /* 平滑过渡 */
    transition:
        background 0.2s,
        box-shadow 0.2s,
        transform 0.1s;
}

/* ① 鼠标悬停：背景变深（浅灰） */
.clickable-box:hover {
    background: #f0f0f0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* ② 点击特效：轻微缩放 + 更深的背景 */
.clickable-box:active {
    transform: scale(0.97);
    background: #e5e5e5;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
}
</style>
