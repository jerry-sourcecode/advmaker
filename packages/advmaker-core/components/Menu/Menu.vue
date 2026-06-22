<template>
    <div class="outer-div">
        <n-button quaternary class="menu-button" @click="showBagModel = true" v-if="isDisplay.bag">
            <n-icon size="25" class="icon">
                <Icon icon="mdi:backpack" />
            </n-icon>
            <p class="menu-p">背包</p>
            <Bag v-model="showBagModel" />
        </n-button>
        <n-button
            quaternary
            class="menu-button"
            @click="showAttuModel = true"
            v-if="isDisplay.attu"
        >
            <n-icon size="25" class="icon">
                <Icon icon="stash:user-avatar" />
            </n-icon>
            <p class="menu-p">属性</p>
            <Attu v-model="showAttuModel" />
        </n-button>
        <n-button
            quaternary
            class="menu-button"
            @click="emitter.emit('open-shop')"
            v-if="isDisplay.shop"
        >
            <n-icon size="25" class="icon">
                <Icon icon="mdi:store" />
            </n-icon>
            <p class="menu-p">商城</p>
        </n-button>
        <n-button
            quaternary
            class="menu-button"
            @click="emitter.emit('open-save')"
            v-if="isDisplay.save"
        >
            <n-icon size="25" class="icon">
                <Icon icon="lucide:save" />
            </n-icon>
            <p class="menu-p">记忆</p>
        </n-button>
        <n-button
            quaternary
            class="menu-button"
            @click="showStoryModel = true"
            v-if="isDisplay.story"
        >
            <n-icon size="25" class="icon">
                <Icon icon="tabler:book" />
            </n-icon>
            <p class="menu-p">故事</p>
            <Story v-model="showStoryModel" />
        </n-button>
    </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import Attu from './Attu.vue';
import { computed, ref } from 'vue';
import Bag from './Bag.vue';
import Story from './story/Story.vue';
import { useEmitter } from '../../store/emitter.ts';
import { useStoryStore } from '../../store/story.ts';

const emitter = useEmitter();
const storyStore = useStoryStore();

const isDisplay = computed(() => {
    if (storyStore.storyConfigObj!.menu === undefined) {
        return {
            bag: true,
            attu: true,
            shop: true,
            save: true,
            story: true,
        };
    }
    return {
        bag: storyStore.storyConfigObj!.menu.bag ?? true,
        attu: storyStore.storyConfigObj!.menu.attu ?? true,
        shop: storyStore.storyConfigObj!.menu.shop ?? true,
        save: storyStore.storyConfigObj!.menu.save ?? true,
        story: storyStore.storyConfigObj!.menu.story ?? true,
    };
});

const showAttuModel = ref(false);
const showBagModel = ref(false);
const showStoryModel = ref(false);
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
