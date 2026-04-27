<template>
    <div class="outer-div">
        <n-button quaternary class="menu-button">
            <n-icon size="25" class="icon">
                <Icon icon="mdi:backpack" />
            </n-icon>
            <p class="menu-p">背包</p>
        </n-button>
        <n-button quaternary class="menu-button">
            <n-icon size="25" class="icon">
                <Icon icon="stash:user-avatar" />
            </n-icon>
            <p class="menu-p">属性</p></n-button
        >
        <n-button quaternary class="menu-button">
            <n-icon size="25" class="icon">
                <Icon icon="mdi:store" />
            </n-icon>
            <p class="menu-p">商城</p></n-button
        >
        <n-button quaternary class="menu-button">
            <n-icon size="25" class="icon">
                <Icon icon="lucide:save" />
            </n-icon>
            <p class="menu-p">记忆</p></n-button
        >
    </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script>

<style scoped>
.outer-div {
    display: flex;
    flex-direction: column;
}
.menu-button {
    justify-content: flex-start;
    height: 50px;
}
.menu-p {
    font-size: 18px;
}
.icon {
    margin-right: 20px;
}
</style>
