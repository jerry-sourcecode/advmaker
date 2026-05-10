<template>
    <div class="outer-div">
        <n-button quaternary class="menu-button" @click="showBagModal = true">
            <n-icon size="25" class="icon">
                <Icon icon="mdi:backpack" />
            </n-icon>
            <p class="menu-p">背包</p>
            <Bag v-model="showBagModal" />
        </n-button>
        <n-button quaternary class="menu-button" @click="showAttuModal = true">
            <n-icon size="25" class="icon">
                <Icon icon="stash:user-avatar" />
            </n-icon>
            <p class="menu-p">属性</p>
            <Attu v-model="showAttuModal" />
        </n-button>
        <n-button quaternary class="menu-button" @click="showShopModal = true">
            <n-icon size="25" class="icon">
                <Icon icon="mdi:store" />
            </n-icon>
            <p class="menu-p">商城</p>
            <Shop v-model="showShopModal" />
        </n-button>
        <n-button quaternary class="menu-button" @click="showMemoryModal = true">
            <n-icon size="25" class="icon">
                <Icon icon="lucide:save" />
            </n-icon>
            <p class="menu-p">记忆</p>
            <Memory v-model="showMemoryModal" />
        </n-button>
        <n-button quaternary class="menu-button" @click="showStoryModal = true">
            <n-icon size="25" class="icon">
                <Icon icon="tabler:book" />
            </n-icon>
            <p class="menu-p">故事</p>
            <Story v-model="showStoryModal" />
        </n-button>
    </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import Attu from './Attu.vue';
import { ref } from 'vue';
import Bag from './Bag.vue';
import Shop from './Shop.vue';
import Memory from './Memory.vue';
import Story from './Story.vue';

const showAttuModal = ref(false);
const showShopModal = ref(false);
const showMemoryModal = ref(false);
const showBagModal = ref(false);
const showStoryModal = ref(false);
</script>

<style scoped>
.outer-div {
    display: flex;
    flex-direction: column;
}
.menu-button {
    justify-content: flex-start;
    height: 60px;
}
.menu-p {
    font-size: 20px;
}
.icon {
    margin-right: 20px;
}
</style>
