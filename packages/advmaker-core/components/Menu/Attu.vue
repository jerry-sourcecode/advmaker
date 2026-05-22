<template>
    <n-modal v-model:show="showModal">
        <n-card class="responsive-dialog responsive-non-fit" title="属性">
            <div class="responsive-dialog-scrollBar" style="padding-top: 0">
                <div v-for="gp in groups" class="attu-div">
                    <n-divider title-placement="left" v-if="gp[0] !== ''">{{ gp[0] }}</n-divider>
                    <div class="attu-outer">
                        <div v-for="att in gp[1]">
                            <div v-if="RV(qry_status(att).isDisplay) !== 'none'">
                                <span>{{ qry_status(att).name }}：</span>
                                <span :style="`color: ${RV(qry_status(att).color)}`" class="bold">{{
                                    stateStore.qryStatus(att)
                                }}</span>
                                <span class="bold" v-if="qry_status(att).max < Infinity">
                                    / {{ qry_status(att).max }}</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { useStateStore } from '../../store/state.ts';
import { RV } from '../../utils/util.ts';
import { computed } from 'vue';
import { useStoryStore } from '../../store/story.ts';

const showModal = defineModel({ type: Boolean });
const stateStore = useStateStore();
const storyStore = useStoryStore();

const groups = computed(() => {
    const obj = new Map<string, string[]>();
    stateStore.status.forEach((_, id) => {
        const st_obj = storyStore.statusMap.get(id)!;
        if (obj.has(st_obj.group)) {
            const ori = obj.get(st_obj.group)!;
            ori.push(id);
            obj.set(st_obj.group, ori);
        } else {
            obj.set(st_obj.group, [id]);
        }
    });
    return obj;
});

function qry_status(id: string) {
    return storyStore.statusMap.get(id)!;
}
</script>

<style scoped>
.attu-outer {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    font-size: 18px;
}
.attu-div {
    min-height: 50px;
}
.bold {
    font-weight: bold;
}

@media (max-width: 768px) {
    .attu-outer {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
