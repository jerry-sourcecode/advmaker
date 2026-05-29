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
                            :style="`color: ${stateStore.qryItem(id) >= item! * detailValue ? 'black' : '#F56C6C'};`"
                        >
                            {{ storyStore.objectMap.get(id)?.name }} ×
                            {{ item! * detailValue }}
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
import { useStateStore } from '../../store/state.ts';
import ItemPanel from './ItemPanel.vue';
import { useStoryStore } from '../../store/story.ts';
import { Adv } from '../../api';
import type { ItemIds } from '../../type/user';
import type { ADVItem } from '../../data/model.ts';

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
    const ret = res.need[usage.value - 1];
    if (ret.id) delete ret.id;
    return ret as {
        [p in ItemIds]?: number;
    };
});

const maxiBuyNumber = computed(() => {
    let maxi = detailObjValue.value;
    for (let itemsKey in goodsMap.value) {
        const val = goodsMap.value[itemsKey as ItemIds];
        maxi = Math.min(Math.floor(stateStore.qryItem(itemsKey as ItemIds) / val!), maxi);
    }
    return maxi;
});

function actionBuy() {
    for (let itemsKey in goodsMap.value) {
        const value = goodsMap.value[itemsKey as ItemIds]!;
        Adv.bag[itemsKey as ItemIds] -= value * detailValue.value;
    }
    Adv.bag[detailObj.value?.id!] += detailValue.value;
    stateStore.shop.set(detailObj.value?.id!, detailObjValue.value - detailValue.value);
    showDetailModal.value = false;
}

function onDetailOpen(id: string, num: number) {
    usage.value = 1;
    detailValue.value = 1;
    detailObjValue.value = num;
    detailObj.value = storyStore.objectMap.get(id as ItemIds)!;
    showDetailModal.value = true;
}
</script>

<style scoped></style>
