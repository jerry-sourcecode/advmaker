<template>
    <n-modal v-model:show="showModal">
        <n-card class="responsive-dialog narrow" title="记忆">
            <div class="responsive-dialog-scrollBar">
                <n-list bordered>
                    <n-list-item v-for="item in array" class="li">
                        <n-thing>
                            <template #header>
                                <div style="font-size: 20px" v-if="editingId !== item.id">
                                    {{ item.name }}
                                    <Icon
                                        icon="boxicons:edit"
                                        id="Icon"
                                        @click="startEdit(item.id)"
                                    />
                                </div>
                                <n-input
                                    v-model:value="saveName"
                                    placeholder="输入存档名称。"
                                    ref="inputRef"
                                    @blur="endEdit(item.id)"
                                    @keydown.enter="inputRef![0].blur()"
                                    v-else
                                />
                            </template>
                            <Icon icon="boxicons:location-filled" id="Icon"></Icon>
                            {{ item.location }}
                            <template #footer>
                                <Icon icon="mingcute:time-line" id="Icon" />
                                {{ formatDate(new Date(item.time)) }}
                            </template>
                        </n-thing>
                        <template #suffix>
                            <n-space>
                                <n-button size="large" type="success" @click="read(item)">
                                    读取
                                </n-button>
                                <n-button size="large" type="info" @click="save(item)">
                                    覆盖
                                </n-button>
                                <n-button size="large" type="error" @click="deleteSave(item)">
                                    删除
                                </n-button>
                            </n-space>
                        </template>
                    </n-list-item>
                </n-list>
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
import { Icon } from '@iconify/vue';
import { computed, nextTick, type Ref, ref } from 'vue';
import { type InputInst, useDialog } from 'naive-ui';
const showModal = defineModel({ type: Boolean });
const saveManager = useSaveManager();

const editingId: Ref<string | null> = ref(null);
const saveName = ref('');
const inputRef: Ref<InputInst[] | null> = ref(null);

const dialog = useDialog();

const array = computed(() => {
    return [...saveManager.slots.values()];
});

function startEdit(id: string) {
    saveName.value = saveManager.slots.get(id)?.name!;
    editingId.value = id;
    nextTick(() => {
        inputRef.value![0]?.focus();
        inputRef.value![0]?.select();
    });
}

function endEdit(id: string) {
    const obj = saveManager.slots.get(id)!;
    obj.name = saveName.value;
    editingId.value = null;
}

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
</script>

<style scoped>
#Icon {
    position: relative;
    top: 2px;
}
.li {
    display: flex;
    font-size: 18px;
}
</style>
