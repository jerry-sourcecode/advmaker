// src/arrowFunction.ts

export interface ArrowFunctionParts {
    /** 是否 async */
    isAsync: boolean;
    /** 参数原文（不含外层括号），如 `targets, times` */
    params: string;
    /** 函数体原文：块体不含最外层 `{}`；表达式体为整个表达式 */
    body: string;
    /** 是否使用表达式体（无大括号） */
    isExpressionBody: boolean;
    /** 参数列表在源码中的起始偏移（`(` 之后） */
    paramsStart: number;
    /** 参数列表在源码中的结束偏移（`)` 之前） */
    paramsEnd: number;
    /** 函数体在源码中的起始偏移（`{` 之后，或表达式起点） */
    bodyStart: number;
    /** 函数体在源码中的结束偏移（`}` 之前，或表达式终点） */
    bodyEnd: number;
    /** 整个箭头函数的起始偏移（含 async） */
    start: number;
    /** 整个箭头函数的结束偏移 */
    end: number;
}

/**
 * 从箭头函数源码中提取各部分。
 *
 * 若传入的不是箭头函数，返回 null。
 * 处理：async、带类型注解、解构参数、嵌套箭头、字符串/注释中的 `=>`。
 */
export function parseArrowFunction(source: string): ArrowFunctionParts | null {
    const len = source.length;
    let i = 0;

    // ---- 跳过前导空白 ----
    while (i < len && /\s/.test(source[i])) i++;
    const start = i;

    // ---- 可选 async ----
    let isAsync = false;
    if (matchWord(source, i, "async")) {
        isAsync = true;
        i += 5;
        while (i < len && /\s/.test(source[i])) i++;
    }

    // ---- 参数列表：必须以 `(` 开头 ----
    if (source[i] !== "(") return null;
    const paramsOpen = i;
    const paramsClose = findMatching(source, paramsOpen, "(", ")");
    if (paramsClose === -1) return null;

    const params = source.substring(paramsOpen + 1, paramsClose);

    i = paramsClose + 1;

    // ---- 可选返回类型注解 `: Type` ----
    while (i < len && /\s/.test(source[i])) i++;
    if (source[i] === ":") {
        i++;
        // 跳过返回类型，直到遇到 `=>`（注意类型里可能有嵌套括号）
        const arrowIdx = findArrowAfterType(source, i);
        if (arrowIdx === -1) return null;
        i = arrowIdx;
    }

    // ---- `=>` ----
    if (!(source[i] === "=" && source[i + 1] === ">")) return null;
    i += 2;

    while (i < len && /\s/.test(source[i])) i++;

    // ---- 函数体 ----
    if (source[i] === "{") {
        // 块体
        const bodyOpen = i;
        const bodyClose = findMatching(source, bodyOpen, "{", "}");
        if (bodyClose === -1) return null;

        return {
            isAsync,
            params,
            body: source.substring(bodyOpen + 1, bodyClose),
            isExpressionBody: false,
            paramsStart: paramsOpen + 1,
            paramsEnd: paramsClose,
            bodyStart: bodyOpen + 1,
            bodyEnd: bodyClose,
            start,
            end: bodyClose + 1,
        };
    }

    // 表达式体：读到顶层 `;`、`,`、`)`、`}` 或源码末尾
    const exprStart = i;
    const exprEnd = findExpressionEnd(source, i);
    const body = source.substring(exprStart, exprEnd).trim();
    const trimmedStart = exprStart + source.substring(exprStart, exprEnd).indexOf(body);
    const trimmedEnd = trimmedStart + body.length;

    return {
        isAsync,
        params,
        body,
        isExpressionBody: true,
        paramsStart: paramsOpen + 1,
        paramsEnd: paramsClose,
        bodyStart: trimmedStart,
        bodyEnd: trimmedEnd,
        start,
        end: trimmedEnd,
    };
}

// ---------- 内部辅助 ----------

function matchWord(src: string, i: number, word: string): boolean {
    if (src.substr(i, word.length) !== word) return false;
    const next = src[i + word.length];
    return next === undefined || !/[a-zA-Z0-9_$]/.test(next);
}

/**
 * 从 openPos 处的开符号开始，找到匹配的闭符号位置。
 * 会跳过字符串、模板串、注释。
 */
function findMatching(
    src: string,
    openPos: number,
    open: string,
    close: string,
): number {
    let depth = 0;
    let i = openPos;
    const len = src.length;

    while (i < len) {
        const ch = src[i];

        // 跳过注释和字符串
        const skipped = skipLiteral(src, i);
        if (skipped > i) {
            i = skipped;
            continue;
        }

        if (ch === open) depth++;
        else if (ch === close) {
            depth--;
            if (depth === 0) return i;
        }
        i++;
    }
    return -1;
}

/**
 * 若 src[i] 是字面量（字符串/模板/注释）起点，返回其结束偏移；否则返回 i。
 */
function skipLiteral(src: string, i: number): number {
    const ch = src[i];
    const next = src[i + 1];

    // 行注释
    if (ch === "/" && next === "/") {
        while (i < src.length && src[i] !== "\n") i++;
        return i;
    }
    // 块注释
    if (ch === "/" && next === "*") {
        i += 2;
        while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
        return i + 2;
    }
    // 字符串：' 或 "
    if (ch === '"' || ch === "'") {
        const q = ch;
        i++;
        while (i < src.length && src[i] !== q) {
            if (src[i] === "\\") i++;
            i++;
        }
        return i + 1;
    }
    // 模板串
    if (ch === "`") {
        i++;
        while (i < src.length && src[i] !== "`") {
            if (src[i] === "\\") i++;
            i++;
        }
        return i + 1;
    }
    return i;
}

/**
 * 处理返回类型注解：跳过 `: Type` 直到顶层 `=>`。
 * 返回 `=>` 的 `=` 的偏移。
 */
function findArrowAfterType(src: string, startPos: number): number {
    let i = startPos;
    const len = src.length;
    let depth = 0;

    while (i < len) {
        const ch = src[i];

        const skipped = skipLiteral(src, i);
        if (skipped > i) {
            i = skipped;
            continue;
        }

        if (ch === "(" || ch === "[" || ch === "{") depth++;
        else if (ch === ")" || ch === "]" || ch === "}") {
            if (depth === 0) return -1;
            depth--;
        } else if (
            depth === 0 &&
            ch === "=" &&
            src[i + 1] === ">"
        ) {
            return i;
        }
        i++;
    }
    return -1;
}

/**
 * 从表达式体起点找到终点：遇到顶层 `;`、`,`、`)`、`}` 或源码末尾。
 */
function findExpressionEnd(src: string, startPos: number): number {
    let i = startPos;
    const len = src.length;
    let depth = 0;

    while (i < len) {
        const ch = src[i];

        const skipped = skipLiteral(src, i);
        if (skipped > i) {
            i = skipped;
            continue;
        }

        if (ch === "(" || ch === "[" || ch === "{") depth++;
        else if (ch === ")" || ch === "]" || ch === "}") {
            if (depth === 0) return i;
            depth--;
        } else if (depth === 0 && (ch === ";" || ch === ",")) {
            return i;
        }
        i++;
    }
    return len;
}