import { defineStore } from 'pinia';
import { type Ref, ref } from 'vue';
import { useStateStore } from './state.ts';
import superJson from 'superjson';
import { Game } from '../game.ts';
import { BoundedQueue, formatDate } from '../utils/util.ts';

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
        const autosaveSlots = ref(new BoundedQueue<SaveSlot>(5));
        const shouldRun: Ref<string | null> = ref(null);
        function captureState() {
            const stateStore = useStateStore();
            return superJson.stringify(stateStore.$state);
        }
        function toData(slotId: string, slotName?: string) {
            const stateStore = useStateStore();
            return {
                id: slotId,
                name: slotName || `存档 ${slotId}`,
                time: Date.now(),
                data: captureState(),
                version: '1.0',
                location: stateStore.location,
            };
        }
        function saveToSlot(slotId: string, slotName?: string): void {
            slots.value.set(slotId, toData(slotId, slotName));
        }
        function loadFromSlot(slotId: string) {
            shouldRun.value = slotId;
            location.reload();
        }
        function run(slotId: string) {
            const slot = find(slotId);
            const gameStore = useStateStore();
            gameStore.$patch(superJson.parse(slot!.data!));
            void Game.toNext(gameStore.last);
        }
        function deleteSlot(slotId: string) {
            return slots.value.delete(slotId);
        }
        function autoSave() {
            if (!autosaveSlots.value.isEmpty()) {
                const last = autosaveSlots.value.peekLast()!;
                if (Date.now() - last.time <= 180_000) return;
            }
            autosaveSlots.value.push(
                toData(`Auto_${Date.now().toString()}`, formatDate(new Date())),
            );
        }
        function find(id: string) {
            if (slots.value.has(id)) return slots.value.get(id);
            return autosaveSlots.value.toArray().find((v) => {
                return v.id === id;
            });
        }
        return {
            slots,
            saveToSlot,
            loadFromSlot,
            deleteSlot,
            run,
            shouldRun,
            autoSave,
            autosaveSlots,
            find,
        };
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
