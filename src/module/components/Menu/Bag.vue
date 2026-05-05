<template>
    <n-modal v-model:show="showModal">
        <n-card class="responsive-dialog responsive-non-fit" title="背包">
            <Empty />
            <item-panel
                @on-detail-open="showDetail"
                v-model:detail-obj="detailObj"
                v-model:show-detail-model="showDetailModal"
                v-model:backpack="stateStore.backpack"
            >
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
            </item-panel>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { useStateStore } from '../../store/state.ts';
import { useStoryStore } from '../../store/story.ts';
import { computed, type Ref, ref } from 'vue';
import { useDialog } from 'naive-ui';
import { ADVMaker } from '../../api.ts';
import ItemPanel from './ItemPanel.vue';
import { ADVItem } from '../../data/model.ts';
import Empty from '../Empty.vue';

const dialog = useDialog();

const showModal = defineModel({ type: Boolean });
const detailObjNumber = ref(0);
const detailValue = ref(0);
const showDetailModal = ref(false);
const detailObj: Ref<ADVItem | null> = ref(null);
const stateStore = useStateStore();
const storyStore = useStoryStore();

const showDetailAction = computed(() => {
    return detailObj.value?.onUse !== null || detailObj.value.onDiscard !== null;
});

function actionUse() {
    ADVMaker.appendMessage(`玩家使用 ${detailValue.value} 个${detailObj.value?.name}。`, 'user');
    detailObj.value!.onUse!(detailValue.value);
    showDetailModal.value = false;
    stateStore.obtainItem(detailObj.value!.id, -detailValue.value);
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
            stateStore.obtainItem(detailObj.value!.id, -detailValue.value);
        },
    });
}

function showDetail(id: string, num: number) {
    detailObj.value = storyStore.objectMap.get(id)!;
    detailObjNumber.value = num;
    detailValue.value = 0;
    showDetailModal.value = true;
}
</script>

<style scoped></style>
