import { defineStore } from 'pinia';
import { type Ref, ref } from 'vue';
import { useStateStore } from './state.ts';
import superJson from 'superjson';
import { Game } from '../game.ts';

export type SaveSlot = {
    id: string;
    name: string;
    time: number;
    data: string | null;
    version: string;
    location: string;
};

export const useSaveManager = defineStore(
    'saveManager',
    () => {
        const slots = ref(new Map<string, SaveSlot>());
        const shouldRun: Ref<string | null> = ref(null);
        function captureState() {
            const stateStore = useStateStore();
            return superJson.stringify(stateStore.$state);
        }
        function saveToSlot(slotId: string, slotName?: string): void {
            let slot = slots.value.get(slotId);
            const stateStore = useStateStore();
            if (!slot) {
                slot = {
                    id: slotId,
                    name: '',
                    time: Date.now(),
                    data: null,
                    version: '1.0',
                    location: '',
                };
            }

            slot.name = slotName || `存档 ${slot.id}`;
            slot.time = Date.now();
            slot.data = captureState();
            slot.location = stateStore.location;
            slots.value.set(slotId, slot);
        }
        function loadFromSlot(slotId: string) {
            shouldRun.value = slotId;
            location.reload();
        }
        function run(slotId: string) {
            const slot = slots.value.get(slotId);
            const gameStore = useStateStore();
            gameStore.$patch(superJson.parse(slot!.data!));
            Game.toNext(gameStore.last);
        }
        function deleteSlot(slotId: string) {
            return slots.value.delete(slotId);
        }
        return { slots, saveToSlot, loadFromSlot, deleteSlot, run, shouldRun };
    },
    {
        persist: {
            serializer: {
                serialize: superJson.stringify,
                deserialize: superJson.parse,
            },
        },
    },
);
