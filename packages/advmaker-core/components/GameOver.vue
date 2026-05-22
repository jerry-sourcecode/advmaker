<template>
    <div class="game-over-overlay" :class="{ show: isVisible }">
        <div class="game-over-content">
            <h1 class="game-over-title">GAME OVER</h1>
            <p class="game-over-reason">{{ reason }}</p>
            <div class="game-over-buttons">
                <button class="btn-game-over" @click="handleRestart">重新开始</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStateStore } from '../store/state.ts';

const isVisible = ref(false);
const reason = ref('你死去了。');
const stateStore = useStateStore();

onMounted(() => {
    reason.value = stateStore.deadDesc;

    // 触发淡入动画（延迟一点点以确保 CSS 过渡生效）
    setTimeout(() => {
        isVisible.value = true;
    }, 100);
});

function handleRestart() {
    location.reload();
}
</script>

<style scoped>
/* 组件内部样式，仅作用于当前组件 */
.game-over-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 1.5s ease-in-out;
    z-index: 1000;
}

.game-over-overlay.show {
    opacity: 1;
    pointer-events: auto;
}

.game-over-content {
    text-align: center;
    transform: translateY(20px);
    transition: transform 1.5s ease-out;
}

.game-over-overlay.show .game-over-content {
    transform: translateY(0);
}

.game-over-title {
    font-family: 'Times New Roman', serif;
    font-size: 48px;
    color: #a00;
    letter-spacing: 8px;
    margin-bottom: 24px;
    text-shadow: 0 0 10px rgba(170, 0, 0, 0.5);
}

.game-over-reason {
    font-size: 16px;
    color: #ccc;
    margin-bottom: 40px;
    font-style: italic;
    letter-spacing: 1px;
}

.game-over-buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
}

.btn-game-over {
    background: transparent;
    border: 1px solid #555;
    color: #ccc;
    padding: 12px 32px;
    font-size: 16px;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.3s;
    width: 200px;
}

.btn-game-over:hover {
    border-color: #a00;
    color: #fff;
    background-color: rgba(170, 0, 0, 0.2);
}

.btn-game-over:active {
    transform: scale(0.98);
}
</style>
