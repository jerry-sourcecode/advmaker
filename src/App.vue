<template>
    <AShell>
        <AScene id="s1" name="开场">
            <ADialog>
                <AIf :condition="() => score >= 90">
                    <ALine>优秀！</ALine>
                </AIf>
                <AElif :condition="() => score >= 60">
                    <ALine>及格。</ALine>
                </AElif>
                <AElif :condition="() => score >= 30">
                    <ALine>还需努力。</ALine>
                </AElif>
                <AElse>
                    <ALine>不及格。</ALine>
                    <ACheck>
                        <template #success>
                            <AGoto tgt="s1" />
                        </template>
                    </ACheck>
                </AElse>
                <ALine>考试结束。</ALine>
            </ADialog>
        </AScene>

        <!-- Scene 显式指定 next -->
        <AScene id="s2" name="后续">
            <ADialog id="d3">
                <ALine>继续</ALine>
                <AOptions>
                    <AOption>
                        <template #content>结束游戏</template>
                        <ALine>结束</ALine>
                    </AOption>
                </AOptions>
            </ADialog>
        </AScene>
    </AShell>
</template>

<script setup lang="ts">
import {
    ADialog,
    AShell,
    ALine,
    AScene,
    AOptions,
    AOption,
    AIf,
    AElse,
    AElif,
    ACheck,
    AGoto,
} from '@advmaker/core';
import { ref } from 'vue';
const score = ref(0);
</script>
