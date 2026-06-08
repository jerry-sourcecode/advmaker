<template>
    <slot />
</template>

<script setup lang="ts">
import { provide, onMounted, ref } from 'vue';
import { Adv } from '../api';
import type { ADVUserNext, MessageContentType } from '../data/model';

interface SceneReg {
    id: string;
    name: string;
    userNext?: ADVUserNext;
}

interface DialogReg {
    id: string;
    in?: string; // 所在 Scene 的 id
    script: MessageContentType[];
    userNext?: ADVUserNext;
}

const scenes = ref<SceneReg[]>([]);
const dialogs = ref<DialogReg[]>([]);

function registerScene(id: string, name: string, userNext?: ADVUserNext) {
    scenes.value.push({ id, name, userNext });
}

function registerDialog(
    id: string,
    inScene: string | undefined,
    script: MessageContentType[],
    userNext?: ADVUserNext,
) {
    dialogs.value.push({ id, in: inScene, script, userNext });
}

provide('registerScene', registerScene);
provide('registerDialog', registerDialog);

onMounted(() => {
    // 1. 计算每个 Scene 下的第一个 Dialog（用于自动 next）
    const firstDialogOfScene = new Map<string, string>();
    for (const d of dialogs.value) {
        if (d.in && !firstDialogOfScene.has(d.in)) {
            firstDialogOfScene.set(d.in, d.id);
        }
    }

    // 2. 调用 Adv.appendScene（优先使用 prop.next，否则自动推断）
    for (const s of scenes.value) {
        const next = s.userNext !== undefined ? s.userNext : (firstDialogOfScene.get(s.id) ?? null);
        Adv.appendScene(s.id, {
            name: s.name,
            next,
        });
    }

    // 3. 调用 Adv.appendDialog（优先使用 prop.next，否则自动推断全局下一个）
    for (let i = 0; i < dialogs.value.length; i++) {
        const cur = dialogs.value[i];
        const next =
            cur.userNext !== undefined
                ? cur.userNext
                : i + 1 < dialogs.value.length
                  ? dialogs.value[i + 1].id
                  : null;
        Adv.appendDialog(cur.id, {
            in: cur.in,
            script: cur.script,
            next,
        });
    }
});
</script>
