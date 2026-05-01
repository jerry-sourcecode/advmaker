<template>
    <n-modal v-model:show="showModal">
        <n-card class="responsive-dialog responsive-non-fit" title="属性">
            <div class="responsive-dialog-scrollBar">
                <div v-for="gp in groups" class="attu-div">
                    <n-divider title-placement="left" v-if="gp[0] !== ''">{{ gp[0] }}</n-divider>
                    <div class="attu-outer">
                        <div v-for="att in gp[1]">
                            <span>{{ att.name }}：</span>
                            <span :style="`color: ${resolveValue(att.color)}`" class="bold">{{
                                att.value
                            }}</span>
                            <span class="bold" v-if="att.max < Infinity"> / {{ att.max }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { useStateStore } from '../../store/state.ts';
import { resolveValue } from '../../utils/util.ts';
import { computed } from 'vue';
import type { ADVStatus } from '../../data/model.ts';

const showModal = defineModel({ type: Boolean });
const stateStore = useStateStore();

const groups = computed(() => {
    const obj = new Map<string, ADVStatus[]>();
    stateStore.status.forEach((v) => {
        if (obj.has(v.group)) {
            const ori = obj.get(v.group)!;
            ori.push(v);
            obj.set(v.group, ori);
        } else {
            obj.set(v.group, [v]);
        }
    });
    return obj;
});
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
