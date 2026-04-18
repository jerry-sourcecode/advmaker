import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ADVDialog, ADVItem, ADVScene } from '../data/model.ts';

export const useStoryStore = defineStore('story', () => {
    const mainScene = ref<string | null>(null);

    const objectMap = ref(new Map<string, ADVItem>());
    const sceneMap = ref(new Map<string, ADVScene>());
    const dialogMap = ref(new Map<string, ADVDialog>());
    const gameName = ref('');

    const TP = {
        DIALOG: 0x01,
        ITEM: 0x02,
        SCENE: 0x04,
    };

    function tryGet(id: string, allow: number): ADVDialog | ADVItem | ADVScene | undefined {
        let nx: any = objectMap.value.get(id);
        if (nx !== undefined && allow & TP.ITEM) return nx as ADVItem;
        nx = sceneMap.value.get(id);
        if (nx !== undefined && allow & TP.SCENE) return nx as ADVScene;
        nx = dialogMap.value.get(id);
        if (allow & TP.DIALOG) return nx as ADVDialog;
        return undefined;
    }

    return { mainScene, objectMap, sceneMap, dialogMap, gameName, TP, tryGet };
});
