<template>
    <n-modal v-model:show="showModal">
        <n-card class="responsive-dialog responsive-non-fit" title="故事">
            <n-list class="responsive-dialog-scrollBar" v-if="hasKnow" bordered>
                <n-list-item v-for="item in stateStore.character">
                    <n-thing v-if="item[1]">
                        <template #header>
                            <p style="font-size: 19px">{{ qry_char(item[0]).name }}</p>
                        </template>
                        <template #description>{{ qry_char(item[0]).desc }}</template>
                        <div v-if="qry_char(item[0]).impression.length !== 0">印象：</div>
                        <p v-for="txt in qry_char(item[0]).impression" class="para">{{ txt }}</p>
                    </n-thing>
                </n-list-item>
            </n-list>
            <Empty v-else />
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { useStateStore } from '../../store/state';
import { computed } from 'vue';
import Empty from '../Empty.vue';

const showModal = defineModel({ type: Boolean });
const stateStore = useStateStore();

function qry_char(charId: string) {
    return stateStore.character.get(charId)!;
}

const hasKnow = computed(() => {
    let res = false;
    stateStore.character.forEach((v) => {
        if (v) res = true;
    });
    return res;
});
</script>

<style scoped>
.para {
    text-indent: 2em;
}
</style>
