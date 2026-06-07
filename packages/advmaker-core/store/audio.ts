// stores/audioChannels.ts
import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export interface AudioChannel {
    id: string;
    audio: HTMLAudioElement;
    src: string;
    loop: boolean;
    volume: number;
    isPlaying: boolean;
}

export interface PlayOptions {
    loop?: boolean;
    volume?: number;
}

export const useAudioStore = defineStore('audio', () => {
    const channels = reactive<Record<string, AudioChannel>>({});
    let nextId = 0;

    // ─── 用户交互状态管理 ───
    const needsUserInteraction = ref(true); // 标记是否缺少用户手势
    const pendingRetries: Array<() => void> = []; // 待重播的任务

    // 仅在浏览器环境下注册全局首次交互监听
    if (typeof window !== 'undefined') {
        const onInteraction = () => {
            needsUserInteraction.value = false;
            // 重播所有被阻止的音频
            pendingRetries.forEach((fn) => fn());
            pendingRetries.length = 0;
            // 清理监听
            document.removeEventListener('click', onInteraction);
            document.removeEventListener('touchstart', onInteraction);
        };
        document.addEventListener('click', onInteraction, { once: true });
        document.addEventListener('touchstart', onInteraction, { once: true });
    }

    /**
     * 手动解锁音频（比如在用户点击的按钮中调用）
     */
    function unlockAudio() {
        if (needsUserInteraction.value) {
            needsUserInteraction.value = false;
            pendingRetries.forEach((fn) => fn());
            pendingRetries.length = 0;
        }
    }

    function createChannel(src: string, loop: boolean, volume: number): string {
        const id = `channel_${++nextId}`;
        const audio = new Audio(src);
        audio.loop = loop;
        audio.volume = Math.min(1, Math.max(0, volume));

        const channel: AudioChannel = {
            id,
            audio,
            src,
            loop,
            volume: audio.volume,
            isPlaying: false,
        };

        audio.addEventListener('play', () => {
            channel.isPlaying = true;
        });
        audio.addEventListener('pause', () => {
            channel.isPlaying = false;
        });
        audio.addEventListener('ended', () => {
            channel.isPlaying = false;
        });

        channels[id] = channel;
        return id;
    }

    /**
     * 播放音频（支持自动重试）
     */
    function play(src: string, channelId?: string, options: PlayOptions = {}): string {
        const { loop = true, volume = 1 } = options;

        // 辅助：尝试播放并捕获异常，若被阻止则排入队列
        const tryPlay = (channel: AudioChannel) => {
            channel.audio.play().catch((err: DOMException) => {
                if (err.name === 'NotAllowedError') {
                    // 自动播放被阻止，加入待重试队列
                    needsUserInteraction.value = true;
                    pendingRetries.push(() => {
                        // 重试时检查音轨是否仍存在且 src 未变
                        const ch = channels[channel.id];
                        if (ch && ch.audio.src === channel.audio.src) {
                            ch.audio.play().catch(() => {});
                        }
                    });
                } else {
                    console.warn(`音频播放失败 (${channel.id}):`, err);
                }
            });
        };

        // --- 无指定音轨：创建新音轨 ---
        if (!channelId) {
            const id = createChannel(src, loop, volume);
            tryPlay(channels[id]);
            return id;
        }

        // --- 指定音轨不存在：以指定ID创建 ---
        if (!channels[channelId]) {
            const audio = new Audio(src);
            audio.loop = loop;
            audio.volume = Math.min(1, Math.max(0, volume));

            const channel: AudioChannel = {
                id: channelId,
                audio,
                src,
                loop,
                volume: audio.volume,
                isPlaying: false,
            };

            audio.addEventListener('play', () => {
                channel.isPlaying = true;
            });
            audio.addEventListener('pause', () => {
                channel.isPlaying = false;
            });
            audio.addEventListener('ended', () => {
                channel.isPlaying = false;
            });

            channels[channelId] = channel;
            tryPlay(channel);
            return channelId;
        }

        // --- 指定音轨已存在：替换音源 ---
        const channel = channels[channelId];
        channel.audio.pause();
        channel.audio.src = src;
        channel.src = src;
        channel.audio.loop = loop;
        channel.loop = loop;
        channel.audio.volume = Math.min(1, Math.max(0, volume));
        channel.volume = channel.audio.volume;
        channel.audio.currentTime = 0;
        tryPlay(channel);

        return channelId;
    }

    function pause(channelId: string) {
        channels[channelId]?.audio.pause();
    }

    function resume(channelId: string) {
        // resume 也可能被阻止，同样处理
        const channel = channels[channelId];
        if (!channel) return;
        channel.audio.play().catch((err: DOMException) => {
            if (err.name === 'NotAllowedError') {
                needsUserInteraction.value = true;
                pendingRetries.push(() => {
                    channel.audio.play().catch(() => {});
                });
            }
        });
    }

    function stop(channelId: string) {
        const channel = channels[channelId];
        if (!channel) return;
        channel.audio.pause();
        channel.audio.src = '';
        channel.audio.load();
        delete channels[channelId];
    }

    function setVolume(channelId: string, vol: number) {
        const channel = channels[channelId];
        if (!channel) return;
        channel.audio.volume = Math.min(1, Math.max(0, vol));
        channel.volume = channel.audio.volume;
    }

    function setLoop(channelId: string, loop: boolean) {
        const channel = channels[channelId];
        if (!channel) return;
        channel.audio.loop = loop;
        channel.loop = loop;
    }

    function destroyAll() {
        Object.keys(channels).forEach((id) => stop(id));
    }

    return {
        channels,
        needsUserInteraction, // 暴露给组件显示提示
        play,
        pause,
        resume,
        stop,
        setVolume,
        setLoop,
        destroyAll,
        unlockAudio, // 手动解锁
    };
});
