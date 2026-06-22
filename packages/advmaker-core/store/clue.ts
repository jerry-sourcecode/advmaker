/**
 * 这个仓库用于储存线索数据
 */

import { defineStore } from 'pinia';
import { type Ref, ref } from 'vue';
import type { ClueIds, ClueSubjectProxy } from '../type/user';

export interface ClueItem {
    id: string;
    content: string;
}

const autoIdCounter: Ref<number> = ref(0);

function generateId(): string {
    autoIdCounter.value++;
    return `__auto_${Date.now()}_${autoIdCounter.value}`;
}

export const useClueStore = defineStore('clue', () => {
    /** 内部数据存储：subject -> (clueId -> ClueItem) */
    const cluesData = ref(new Map<ClueIds, Map<string, ClueItem>>());
    /** subject -> name（显示名称） */
    const subjectNames = ref(new Map<ClueIds, string>());
    /** 适配 createRestrictedMapProxy 的 Map：subject -> ClueSubjectProxy */
    const subjectProxyMap = ref(new Map<ClueIds, ClueSubjectProxy>());

    function ensureData(subject: ClueIds): Map<string, ClueItem> {
        if (!cluesData.value.has(subject)) {
            cluesData.value.set(subject, new Map());
        }
        return cluesData.value.get(subject)!;
    }

    /** 根据内部数据创建/获取某个专题的 ClueSubjectProxy */
    function getSubjectProxy(subject: ClueIds): ClueSubjectProxy {
        if (!subjectProxyMap.value.has(subject)) {
            subjectProxyMap.value.set(subject, {
                add(content: string, id?: string): string {
                    const map = ensureData(subject);
                    const clueId = id ?? generateId();
                    map.set(clueId, { id: clueId, content });
                    return clueId;
                },
                set(id: string, content: string): void {
                    const map = ensureData(subject);
                    map.set(id, { id, content });
                },
                rm(id: string): boolean {
                    const map = cluesData.value.get(subject);
                    if (!map) return false;
                    return map.delete(id);
                },
                get items() {
                    const map = cluesData.value.get(subject);
                    if (!map) return [];
                    return Array.from(map.values());
                },
            });
        }
        return subjectProxyMap.value.get(subject)!;
    }

    function getSubjectClues(subject: ClueIds): ClueItem[] {
        const map = cluesData.value.get(subject);
        if (!map) return [];
        return Array.from(map.values());
    }

    function getNonEmptySubjects(): { id: ClueIds; name: string; items: ClueItem[] }[] {
        const result: { id: ClueIds; name: string; items: ClueItem[] }[] = [];
        cluesData.value.forEach((map, subject) => {
            if (map.size > 0) {
                result.push({
                    id: subject,
                    name: subjectNames.value.get(subject) ?? subject,
                    items: Array.from(map.values()),
                });
            }
        });
        return result;
    }

    return {
        cluesData,
        subjectNames,
        subjectProxyMap,
        getSubjectProxy,
        getSubjectClues,
        getNonEmptySubjects,
        ensureData,
    };
});
