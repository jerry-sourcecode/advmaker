<template>
    <n-modal v-model:show="showModal">
        <n-card class="responsive-dialog" title="商城">
            <template #header-extra> 噢！ </template>
            内容
            <template #footer> 尾部 </template>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
const showModal = defineModel({ type: Boolean });
</script>

<style scoped></style>
