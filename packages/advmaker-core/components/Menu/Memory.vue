<template>
    <n-modal v-model:show="showModal">
        <n-card class="responsive-dialog narrow" title="记忆">
            <div class="responsive-dialog-scrollBar">
                <n-divider title-placement="left">自动保存</n-divider>
                <MemerySlots @read="read" readonly v-model:data="array_auto" />
                <n-divider title-placement="left">手动保存</n-divider>
                <MemerySlots @read="read" @save="save" @remove="deleteSave" v-model:data="array" />
                <n-button size="large" @click="newSave" style="margin-top: 10px">
                    保存至新增槽位
                </n-button>
            </div>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { type SaveSlot, useSaveManager } from '../../store/saveManager.ts';
import { formatDate } from '../../utils/util.ts';
import { useDialog } from 'naive-ui';
import MemerySlots from './MemerySlots.vue';
import { computed } from 'vue';
const showModal = defineModel({ type: Boolean });
const saveManager = useSaveManager();

const dialog = useDialog();

function save(item: SaveSlot) {
    dialog.warning({
        title: '警告',
        content: `你确定要保存到 ${item.name}？这将会覆盖之前的数据。`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
            saveManager.saveToSlot(item.id, item.name);
        },
    });
}

function deleteSave(item: SaveSlot) {
    dialog.warning({
        title: '警告',
        content: `你确定要删除 ${item.name}？此操作无法撤销。`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
            saveManager.deleteSlot(item.id);
        },
    });
}

function read(item: SaveSlot) {
    dialog.warning({
        title: '警告',
        content: `你确定要读取 ${item.name}？原数据将会丢失。`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
            saveManager.loadFromSlot(item.id);
            showModal.value = true;
        },
    });
}

function newSave() {
    saveManager.saveToSlot(Date.now().toString(), formatDate(new Date()));
}

const array = computed(() => {
    return [...saveManager.slots.values()];
});
const array_auto = computed(() => {
    return saveManager.autosaveSlots.toArray().reverse();
});
</script>
