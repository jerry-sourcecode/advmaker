/**
 * 这个仓库用于储存游戏的设置
 */

import { defineStore } from 'pinia';
import { type Ref, ref } from 'vue';
import { ADVDialog, ADVDice, ADVGoods, ADVItem, ADVScene, ADVStatus } from '../data/model.ts';
import type { ItemIds, StatusIds } from '../type/user';
import type { Adv } from '../api.ts';
import type { DiceExpression } from '../utils/dice.ts';

export const useStoryStore = defineStore('story', () => {
    const mainScene = ref<string | null>(null);

    const objectMap = ref(new Map<ItemIds, ADVItem>());
    const goodsMap = ref(new Map<string, ADVGoods>());
    const statusMap = ref(new Map<StatusIds, ADVStatus>());
    const sceneMap = ref(new Map<string, ADVScene>());
    const dialogMap = ref(new Map<string, ADVDialog>());
    const gameName = ref('');

    const storyConfigObj: Ref<ReturnType<typeof Adv.defineConfig> | null> = ref(null);
    const judgmentMode: Ref<'d20' | 'percent'> = ref('d20');

    const usedSceneAndDialogId = ref(new Set<string>());

    const TP = {
        DIALOG: 0x01,
        SCENE: 0x02,
    };

    function tryGet(
        id: string,
        allow: number = TP.DIALOG | TP.SCENE,
    ): ADVDialog | ADVScene | undefined {
        let nx: ADVDialog | ADVScene | undefined = sceneMap.value.get(id);
        if (nx !== undefined && allow & TP.SCENE) return nx as ADVScene;
        nx = dialogMap.value.get(id);
        if (allow & TP.DIALOG) return nx as ADVDialog;
        return undefined;
    }

    function diceInit(dice: ADVDice | DiceExpression | undefined) {
        if (dice !== undefined) return dice;
        if (judgmentMode.value === 'percent') return 'd100';
        else return 'd20';
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
        judgmentMode,
        diceInit,
    };
});
