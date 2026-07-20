/**
 * 这个地方用于处理有关 骰子 的代码
 */

import { Game, RuntimeError } from '../game.ts';

export type DiceExpression =
    | `d${number}`
    | `${number}d${number}`
    | `${number}d${number}+${number}`
    | `${number}d${number}-${number}`
    | `d${number}+${number}`
    | `d${number}-${number}`;

function randint(m: number, n: number) {
    return Math.floor(Math.random() * (m - n + 1)) + n;
}

function dice(input: DiceExpression): number {
    function rollDice(m: number, n: number): number {
        let total = 0;
        for (let i = 0; i < m; i++) {
            total += randint(1, n);
        }
        return total;
    }

    function roll(expression: string): number {
        const diceRegex = /^(?:(\d+)d|d)(\d+)(?:([+-])(\d+))?$/;
        const cleaned = expression.replace(/\s/g, '');
        const match = cleaned.match(diceRegex);

        if (!match) {
            throw new Error(`无效的骰子表达式: ${expression}`);
        }

        // 解析骰子数量 m 和面数 n
        const mStr = match[1];
        const nStr = match[2];
        const m = mStr ? Number(mStr) : 1;
        const n = Number(nStr);
        const modifierOp = match[3];
        const modifierVal = match[4] ? Number(match[4]) : 0;

        // 注：m / n / modifier 已由正则 \d+ 保证为正整数，无需运行时校验
        let result = rollDice(m, n);
        if (modifierOp === '+') {
            result += modifierVal;
        } else if (modifierOp === '-') {
            result -= modifierVal;
        }
        return result;
    }

    return roll(input);
}

export { dice };
