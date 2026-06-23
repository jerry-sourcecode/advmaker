/**
 * 这个仓库用于储存游戏内的时间
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const WEEKDAY_NAMES = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

function isLeapYear(y: number) {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

const MONTH_DAYS = (y: number) => [
    31,
    isLeapYear(y) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
];

/** 从 1900-01-01 00:00 起的总分钟数 → 日期时间 */
function fromEpochMinutes(epoch: number) {
    let m = Math.max(0, Math.floor(epoch));
    let year = 1900;
    while (true) {
        const days = isLeapYear(year) ? 366 : 365;
        const mins = days * 1440;
        if (m < mins) break;
        m -= mins;
        year++;
    }
    const md = MONTH_DAYS(year);
    let month = 1;
    for (const d of md) {
        const mins = d * 1440;
        if (m < mins) break;
        m -= mins;
        month++;
    }
    const day = Math.floor(m / 1440) + 1;
    m -= (day - 1) * 1440;
    const hour = Math.floor(m / 60);
    const minute = Math.floor(m % 60);
    const epochDays = Math.floor(epoch / 1440);
    const weekday = epochDays % 7;

    return { year, month, day, hour, minute, weekday };
}

function toEpochMinutes(year: number, month: number, day: number, hour: number, minute: number) {
    let total = 0;
    for (let y = 1900; y < year; y++) total += isLeapYear(y) ? 366 : 365;
    const md = MONTH_DAYS(year);
    for (let m = 0; m < month - 1; m++) total += md[m];
    total += day - 1;
    return total * 1440 + hour * 60 + minute;
}

export const useTimeStore = defineStore('time', () => {
    /** 时间系统是否已启用（用户配置了 time.start） */
    const enabled = ref(false);
    const epochMinutes = ref(0);
    const showDate = ref(false);

    function init(
        year: number,
        month: number,
        day: number,
        hour: number,
        minute: number,
        showDateInBar = false,
    ) {
        epochMinutes.value = toEpochMinutes(year, month, day, hour, minute);
        showDate.value = showDateInBar;
        enabled.value = true;
    }

    function advance(minutes: number) {
        if (minutes > 0) epochMinutes.value += minutes;
    }

    const current = computed(() => fromEpochMinutes(epochMinutes.value));

    /** HH:MM 格式 */
    const timeStr = computed(() => {
        const c = current.value;
        return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`;
    });

    /** MM-DD HH:MM 格式（状态栏显示日期时用）*/
    const dateTimeStr = computed(() => {
        const c = current.value;
        return `${String(c.month).padStart(2, '0')}-${String(c.day).padStart(2, '0')} ${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`;
    });

    /** 完整日期字符串 YYYY-MM-DD HH:MM 星期X */
    const fullStr = computed(() => {
        const c = current.value;
        return `${c.year}-${String(c.month).padStart(2, '0')}-${String(c.day).padStart(2, '0')} ${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')} ${WEEKDAY_NAMES[c.weekday]}`;
    });

    const barStr = computed(() => (showDate.value ? dateTimeStr.value : timeStr.value));

    return {
        enabled,
        epochMinutes,
        showDate,
        init,
        advance,
        current,
        timeStr,
        dateTimeStr,
        fullStr,
        barStr,
    };
});
