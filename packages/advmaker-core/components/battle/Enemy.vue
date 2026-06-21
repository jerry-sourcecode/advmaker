<template>
    <n-modal v-model:show="isShow">
        <n-card class="responsive-dialog responsive-non-fit" title="敌人属性">
            <div class="responsive-dialog-scrollBar">
                <h2>{{ props.enemyInfo.name }}</h2>
                <p>
                    <em>{{ props.enemyInfo.desc }}</em>
                </p>
                <p>生命值：{{ props.enemyInfo.hp }} / {{ props.enemyInfo.maxhp }}</p>
                <p>攻击力：{{ props.enemyInfo.atk }} 防御力：{{ props.enemyInfo.def }}</p>
                <NDivider title-placement="left">技能</NDivider>
                <div v-for="it in props.enemyInfo.skill" style="margin-bottom: 10px">
                    <h3>{{ it.name }}</h3>
                    <p>
                        <em>{{ it.summary }}</em>
                    </p>
                    <p>{{ it.desc }}</p>
                </div>
            </div>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { ADVEnemy } from '../../data/model';

const isShow = defineModel('show', {
    type: Boolean,
});
const props = defineProps({
    enemyInfo: {
        type: ADVEnemy,
        required: true,
    },
});
</script>
