<template>
    <n-list bordered>
        <n-list-item v-for="item in array" class="li">
            <n-thing>
                <template #header>
                    <div style="font-size: 18px" v-if="editingId !== item.id">
                        {{ item.name }}
                        <Icon
                            icon="boxicons:edit"
                            id="Icon"
                            @click="startEdit(item.id)"
                            v-if="!props.readonly"
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
                    <n-button size="large" type="success" @click="emitter('read', item)">
                        读取
                    </n-button>
                    <n-button
                        size="large"
                        type="info"
                        @click="emitter('save', item)"
                        v-if="!props.readonly"
                    >
                        覆盖
                    </n-button>
                    <n-button
                        size="large"
                        type="error"
                        @click="emitter('remove', item)"
                        v-if="!props.readonly"
                    >
                        删除
                    </n-button>
                </n-space>
            </template>
        </n-list-item>
    </n-list>
</template>

<script setup lang="ts">
import { type SaveSlot, useSaveManager } from '../../store/saveManager.ts';
import { formatDate } from '../../utils/util.ts';
import { Icon } from '@iconify/vue';
import { computed, nextTick, type Ref, ref } from 'vue';
import { type InputInst, useDialog } from 'naive-ui';
const saveManager = useSaveManager();

const editingId: Ref<string | null> = ref(null);
const saveName = ref('');
const inputRef: Ref<InputInst[] | null> = ref(null);

const array = defineModel('data', {
    type: Array<SaveSlot>,
});

function startEdit(id: string) {
    saveName.value = saveManager.find(id)?.name!;
    editingId.value = id;
    nextTick(() => {
        inputRef.value![0]?.focus();
        inputRef.value![0]?.select();
    });
}

function endEdit(id: string) {
    const obj = saveManager.find(id)!;
    obj.name = saveName.value;
    editingId.value = null;
}

const emitter = defineEmits(['read', 'save', 'remove']);

const props = defineProps({
    readonly: {
        type: Boolean,
        default: false,
    },
});
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
