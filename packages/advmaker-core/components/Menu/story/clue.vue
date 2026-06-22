<template>
    <div class="responsive-dialog-scrollBar" v-if="hasClue">
        <n-collapse>
            <n-collapse-item
                v-for="subject in subjects"
                :key="subject.id"
                :title="`${subject.name}（${subject.items.length}）`"
            >
                <n-list bordered>
                    <n-list-item v-for="clue in subject.items" :key="clue.id">
                        <div class="clue-content" v-html="clue.content"></div>
                    </n-list-item>
                </n-list>
            </n-collapse-item>
        </n-collapse>
    </div>
    <Empty v-else />
</template>

<script setup lang="ts">
import Empty from '../../Empty.vue';
import { useClueStore } from '../../../store/clue';
import { computed } from 'vue';

const clueStore = useClueStore();

const subjects = computed(() => clueStore.getNonEmptySubjects());

const hasClue = computed(() => subjects.value.length > 0);
</script>

<style scoped>
.clue-content {
    line-height: 1.8;
    font-size: 15px;
}

.clue-content :deep(p) {
    margin: 0.5em 0;
    text-indent: 2em;
}
</style>
