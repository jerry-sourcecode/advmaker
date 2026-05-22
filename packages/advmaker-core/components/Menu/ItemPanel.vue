<template>
    <div class="parent responsive-dialog-scrollBar">
        <div v-for="it in backpack">
            <n-thing
                class="clickable-box"
                @click="emit('onDetailOpen', it[0], it[1])"
                v-if="it[1] !== 0"
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
                <template #footer>
                    <slot name="footer" :id="it[0]"></slot>
                </template>
            </n-thing>
        </div>
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
            <template #footer>
                <slot name="detail-footer" />
            </template>
            <template #action>
                <slot name="action" />
            </template>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { ADVItem } from '../../data/model.ts';
import { useStoryStore } from '../../store/story.ts';
import type { PropType } from 'vue';

const showDetailModal = defineModel('showDetailModel', {
    type: Boolean,
    default: false,
});
const detailObj = defineModel('detailObj', {
    type: Object as PropType<ADVItem | null>,
    default: null,
});
const backpack = defineModel('backpack', {
    type: Map<string, number>,
    default: new Map(),
});
const storyStore = useStoryStore();

const emit = defineEmits<{
    onDetailOpen: [id: string, num: number];
}>();

function getItemDetail(id: string) {
    return storyStore.objectMap.get(id as any);
}
</script>

<style scoped>
.parent {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
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
    min-height: 200px;
    font-size: 17px;

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
