<template>
    <n-modal v-model:show="showModal">
        <n-card class="responsive-dialog responsive-non-fit" title="商城">
            <item-panel
                v-model:detail-obj="detailObj"
                v-model:show-detail-model="showDetailModal"
                v-model:backpack="stateStore.shop"
                @on-detail-open="onDetailOpen"
            >
                <template #detail-footer>
                    <h3>材料：</h3>
                    <n-list bordered style="margin: 10px">
                        <n-list-item
                            v-for="(item, id) in goodsMap"
                            :style="`color: ${stateStore.qryItem(id as string) >= item * detailValue ? 'black' : '#F56C6C'};`"
                        >
                            {{ storyStore.objectMap.get(id as string)?.name }} ×
                            {{ item * detailValue }}
                        </n-list-item>
                    </n-list>
                    <n-pagination
                        v-model:page="usage"
                        :page-count="usageLength"
                        simple
                        v-if="usageLength !== 1"
                        @update:page="
                            detailValue = Math.max(Math.min(detailValue, maxiBuyNumber), 1)
                        "
                    />
                </template>
                <template #action>
                    <n-space vertical style="margin-bottom: 10px">
                        <n-slider
                            v-model:value="detailValue"
                            :step="1"
                            :max="Math.max(maxiBuyNumber, 1)"
                            :tooltip="false"
                        />
                        <n-input-number
                            v-model:value="detailValue"
                            size="small"
                            :max="Math.max(maxiBuyNumber, 1)"
                            :min="0"
                        >
                            <template #prefix>选择</template>
                            <template #suffix>个</template>
                        </n-input-number>
                    </n-space>

                    <n-space>
                        <n-button
                            size="small"
                            @click="actionBuy"
                            :disabled="detailValue === 0 || detailValue > maxiBuyNumber"
                        >
                            购买
                        </n-button>
                    </n-space>
                </template>
                <template #footer="data">
                    目前拥有：{{ stateStore.backpack.get(data.id) }}
                </template>
            </item-panel>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { computed, type Ref, ref } from 'vue';
import type { ADVItem } from '../../data/model.ts';
import { useStateStore } from '../../store/state.ts';
import ItemPanel from './ItemPanel.vue';
import { useStoryStore } from '../../store/story.ts';
import { ADVMaker } from '../../api.ts';

const showModal = defineModel({ type: Boolean });
const detailObj: Ref<ADVItem | null> = ref(null);
const showDetailModal = ref(false);
const detailValue = ref(0);
const detailObjValue = ref(0);
const stateStore = useStateStore();
const storyStore = useStoryStore();
const usage = ref(0);

const usageLength = computed(() => {
    return storyStore.goodsMap.get(detailObj.value?.id!)?.need.length;
});

const goodsMap = computed(() => {
    const res = storyStore.goodsMap.get(detailObj.value?.id!);
    if (res === undefined) throw "Can't find Object.";
    return res.need[usage.value - 1];
});

const maxiBuyNumber = computed(() => {
    let maxi = detailObjValue.value;
    for (let itemsKey in goodsMap.value) {
        const val = goodsMap.value[itemsKey];
        maxi = Math.min(Math.floor(stateStore.qryItem(itemsKey) / val), maxi);
    }
    return maxi;
});

function actionBuy() {
    for (let itemsKey in goodsMap.value) {
        const value = goodsMap.value[itemsKey];
        ADVMaker.obtainItem(itemsKey, -value * detailValue.value);
    }
    ADVMaker.obtainItem(detailObj.value?.id!, detailValue.value);
    stateStore.shop.set(detailObj.value?.id!, detailObjValue.value - detailValue.value);
    showDetailModal.value = false;
}

function onDetailOpen(id: string, num: number) {
    usage.value = 1;
    detailValue.value = 1;
    detailObjValue.value = num;
    detailObj.value = storyStore.objectMap.get(id)!;
    showDetailModal.value = true;
}
</script>

<style scoped></style>
