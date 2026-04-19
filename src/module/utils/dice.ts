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

        // === 运行时校验：m 和 n 必须为正整数 ===
        if (!Number.isInteger(m) || m <= 0) {
            Game.error(new RuntimeError(3, `骰子数量必须为正整数，得到: ${mStr || '1'}`));
        }
        if (!Number.isInteger(n) || n <= 0) {
            Game.error(new RuntimeError(3, `骰子面数必须为正整数，得到: ${nStr}`));
        }
        if (modifierVal !== 0 && !Number.isInteger(modifierVal)) {
            Game.error(new RuntimeError(3, `修正值必须为整数，得到: ${match[4]}`));
        }

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
