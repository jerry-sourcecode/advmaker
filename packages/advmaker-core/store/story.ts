/**
 * 这个仓库用于储存游戏的设置
 */

import { defineStore } from 'pinia';
import { type Ref, ref } from 'vue';
import { ADVDialog, ADVGoods, ADVItem, ADVScene, ADVStatus } from '../data/model.ts';
import type { GoodsIds, ItemIds, StatusIds } from '../type/user';
import type { Adv } from '../api.ts';

export const useStoryStore = defineStore('story', () => {
    const mainScene = ref<string | null>(null);

    const objectMap = ref(new Map<ItemIds, ADVItem>());
    const goodsMap = ref(new Map<GoodsIds, ADVGoods>());
    const statusMap = ref(new Map<StatusIds, ADVStatus>());
    const sceneMap = ref(new Map<string, ADVScene>());
    const dialogMap = ref(new Map<string, ADVDialog>());
    const gameName = ref('');

    const storyConfigObj: Ref<ReturnType<typeof Adv.defineConfig> | null> = ref(null);

    const usedSceneAndDialogId = ref(new Set<string>());

    const TP = {
        DIALOG: 0x01,
        ITEM: 0x02,
        SCENE: 0x04,
    };

    function tryGet(id: string, allow: number): ADVDialog | ADVItem | ADVScene | undefined {
        let nx: any = objectMap.value.get(id as any);
        if (nx !== undefined && allow & TP.ITEM) return nx as ADVItem;
        nx = sceneMap.value.get(id);
        if (nx !== undefined && allow & TP.SCENE) return nx as ADVScene;
        nx = dialogMap.value.get(id);
        if (allow & TP.DIALOG) return nx as ADVDialog;
        return undefined;
    }

    return {
        mainScene,
        objectMap,
        sceneMap,
        dialogMap,
        goodsMap,
        gameName,
        TP,
        tryGet,
        usedSceneAndDialogId,
        statusMap,
        storyConfigObj,
    };
});
