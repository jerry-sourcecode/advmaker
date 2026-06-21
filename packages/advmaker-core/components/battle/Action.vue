<template>
    <n-modal v-model:show="isShow">
        <n-card class="responsive-dialog responsive-non-fit" title="行动">
            <div class="responsive-dialog-scrollBar">
                <n-list hoverable clickable>
                    <n-list-item v-for="it in props.actions" @click="startAction(it)">
                        <n-thing>
                            <template #header>{{ it.name }}</template>
                            <template #description>
                                <em>{{ it.summary }}</em>
                            </template>
                            {{ it.desc }}
                        </n-thing>
                    </n-list-item>
                </n-list>
            </div>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { ADVSkill } from '../../data/model';
import { useEmitter } from '../../store/emitter.ts';
import { useBattleStore } from '../../store/battle.ts';

const isShow = defineModel('show', {
    type: Boolean,
});
const props = defineProps({
    actions: {
        type: Array<ADVSkill>,
        required: true,
    },
});
async function startAction(it: ADVSkill) {
    const emitter = useEmitter();
    isShow.value = false;
    const ret = await emitter.emit('choose-object', it.targetNum);
    it.onUse(ret);
    const battleStore = useBattleStore();
    battleStore.next();
}
</script>
