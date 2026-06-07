<template>
    <AShell>
        <AScene id="outer" name="中章节" next="1">
            <ADialog id="1" next="2">
                <ALine>你好<b>世界</b></ALine>
                <ALine>世界<b>你好</b></ALine>
            </ADialog>
        </AScene>
        <ADialog id="2" :next="null">
            <ALine>不啊<b>阿布</b></ALine>
            <ALine>你哈<b>并不啊</b></ALine>
        </ADialog>
    </AShell>
</template>

<script setup lang="ts">
import { ADialog, AShell, ALine, AScene } from '@advmaker/core';
</script>

<style scoped></style>
