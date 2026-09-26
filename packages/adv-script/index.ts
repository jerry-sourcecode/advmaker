import fs from "node:fs";
import path from "node:path";
import peggy from "peggy";
import { Translater } from "./translate";
import AdvBuildConfig from "./script.config";
import { pathToFileURL } from "node:url";

// ============================================================
// 固定路径
// ============================================================

const CWD = process.cwd();
const GRAMMAR_FILE = path.join(CWD, "packages/adv-script/grammar.peggy");
const MAIN_FILE = path.join(CWD, "src/App.vue");
const GAME_CONFIG_FILE = path.join(CWD, "src/game.config.ts");

// ============================================================
// 类型
// ============================================================

export interface AdvBuildConfig {
    /** 要扫描的 ADVScript 源目录（相对 cwd） */
    srcDir: string;
    /** 生成的组件放置目录（相对 cwd） */
    outDir: string;
    /** 排除规则（简化 glob：支持 ** / * / ?） */
    exclude?: string[];
    /** 是否保留源目录结构，默认 true */
    preserveStructure?: boolean;
    /** 输出扩展名，默认 ".vue" */
    outputExt?: string;
    /** 主文件已存在时是否覆盖，默认 true */
    overwriteMainFile?: boolean;
}

interface PeggyLocation {
    start: { line: number; column: number };
    end: { line: number; column: number };
}

interface PeggySyntaxError extends Error {
    location?: PeggyLocation;
}

interface Parser {
    parse(source: string, options?: { startRule?: string }): any;
}

// ============================================================
// 加载外部配置
// ============================================================

async function loadConfig(): Promise<Required<AdvBuildConfig>> {
    const configPath = path.join(CWD, "./packages/adv-script/script.config.ts");
    if (!fs.existsSync(configPath)) {
        console.error(`❌ 找不到 script.config.ts，在 ${configPath}`);
        process.exit(1);
    }

    let mod: any;
    try {
        mod = await import(pathToFileURL(configPath).href);
    } catch (err) {
        console.error(`❌ 加载配置失败：${configPath}`);
        console.error(err);
        process.exit(1);
    }

    const user = (mod.default ?? mod) as Partial<AdvBuildConfig>;

    return {
        srcDir: user.srcDir ?? "./adv",
        outDir: user.outDir ?? "./src/stories",
        exclude: user.exclude ?? [
            "**/node_modules/**",
            "**/.git/**",
        ],
        preserveStructure: user.preserveStructure ?? true,
        outputExt: user.outputExt ?? ".vue",
        overwriteMainFile: user.overwriteMainFile ?? true,
    };
}

const config = await loadConfig();

const SRC_DIR = path.resolve(CWD, config.srcDir);
const OUT_DIR = path.resolve(CWD, config.outDir);
const EXT = config.outputExt.startsWith(".")
    ? config.outputExt
    : `.${config.outputExt}`;

// ============================================================
// 前置校验
// ============================================================

if (!fs.existsSync(SRC_DIR)) {
    console.error(`❌ 源目录不存在：${SRC_DIR}`);
    process.exit(1);
}
if (!fs.existsSync(GRAMMAR_FILE)) {
    console.error(`❌ 语法文件不存在：${GRAMMAR_FILE}`);
    process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// ============================================================
// Glob
// ============================================================

function globToRegExp(pattern: string): RegExp {
    let re = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    re = re.replace(/\*\*\//g, "\u0000");
    re = re.replace(/\*\*/g, "\u0001");
    re = re.replace(/\*/g, "[^/]*");
    re = re.replace(/\?/g, "[^/]");
    re = re.replace(/\u0000/g, "(?:.*/)?");
    re = re.replace(/\u0001/g, ".*");
    return new RegExp(`^${re}$`);
}

const excludeRegexes = config.exclude.map(globToRegExp);
function isExcluded(relPath: string): boolean {
    const normalized = relPath.split(path.sep).join("/");
    return excludeRegexes.some((re: RegExp) => re.test(normalized));
}

// ============================================================
// 扫描 .adv 文件
// ============================================================

interface AdvFile {
    absPath: string;
    relPath: string;
}

function scanAdvFiles(dir: string, baseDir: string): AdvFile[] {
    const result: AdvFile[] = [];
    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        console.warn(`⚠️  无法读取目录：${dir}`);
        return result;
    }
    for (const entry of entries) {
        const absPath = path.join(dir, entry.name);
        const relPath = path.relative(baseDir, absPath);
        if (isExcluded(relPath)) continue;
        if (entry.isDirectory()) {
            result.push(...scanAdvFiles(absPath, baseDir));
        } else if (entry.isFile() && entry.name.endsWith(".adv")) {
            result.push({ absPath, relPath });
        }
    }
    return result;
}

// ============================================================
// 生成解析器
// ============================================================

const grammarSource = fs.readFileSync(GRAMMAR_FILE, "utf8");
const parser: Parser = peggy.generate(grammarSource, {
    grammarSource: GRAMMAR_FILE,
    output: "parser",
    format: "commonjs",
    cache: true,
});

// ============================================================
// 扫描 + 解析
// ============================================================

const advFiles = scanAdvFiles(SRC_DIR, SRC_DIR);
if (advFiles.length === 0) {
    console.warn(`没有找到 .adv 文件：${SRC_DIR}`);
    process.exit(0);
}

console.log(`📂 源目录：   ${SRC_DIR}`);
console.log(`📂 输出目录： ${OUT_DIR}`);
console.log(`📂 主文件：   ${MAIN_FILE}`);
console.log(`📂 游戏配置： ${GAME_CONFIG_FILE}`);
console.log(`📂 语法文件： ${GRAMMAR_FILE}`);
console.log(`📄 找到 ${advFiles.length} 个 .adv 文件`);

const translater = new Translater();

interface ParsedFile {
    file: AdvFile;
    ast: any;
}

const parsed: ParsedFile[] = [];
let errorCount = 0;

for (const file of advFiles) {
    try {
        const source = fs.readFileSync(file.absPath, "utf8");
        const ast = parser.parse(source, { startRule: "Document" });

        if (ast.game) translater.setGameConfig(ast.game);

        parsed.push({ file, ast });
    } catch (err: unknown) {
        errorCount++;
        console.error(`❌ 解析 ${file.relPath} 失败：`);
        if (err instanceof Error) {
            console.error(`   ${err.message}`);
            const loc = (err as PeggySyntaxError).location;
            if (loc) {
                console.error(
                    `   位置：行 ${loc.start.line}，列 ${loc.start.column}`,
                );
            }
        } else {
            console.error(err);
        }
    }
}

// ============================================================
// 路径 / 组件名
// ============================================================

function computeComponentRelPath(file: AdvFile): string {
    let rel = config.preserveStructure
        ? file.relPath
        : path.basename(file.relPath);
    rel = rel.replace(/\.adv$/, "");
    return rel + EXT;
}

function pathToComponentName(relVuePath: string): string {
    const parts = relVuePath
        .replace(/\.vue$/i, "")
        .split(/[\/\\]/)
        .filter(Boolean);
    const named = parts.map((p) =>
        p
            .replace(/[^a-zA-Z0-9_$]/g, "_")
            .replace(/^(\d)/, "_$1"),
    );
    return named
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join("");
}

// ============================================================
// 写入组件文件
// ============================================================

interface ComponentOutput {
    name: string;
    importPath: string;
    relVuePath: string;
}

const components: ComponentOutput[] = [];

for (const { file, ast } of parsed) {
    try {
        const relVuePath = computeComponentRelPath(file);
        const absVuePath = path.join(OUT_DIR, relVuePath);

        const source = translater.toVueComponent(ast);
        fs.mkdirSync(path.dirname(absVuePath), { recursive: true });
        fs.writeFileSync(absVuePath, source, "utf8");

        const name = pathToComponentName(relVuePath);

        // 相对于主文件所在目录（src/）的导入路径
        let rel = path.relative(path.dirname(MAIN_FILE), absVuePath);
        rel = rel.split(path.sep).join("/");
        if (!rel.startsWith(".")) rel = "./" + rel;
        rel = rel.replace(/\.vue$/, "");

        components.push({ name, importPath: rel, relVuePath });
        console.log(
            `✅ ${file.relPath} → ${path.relative(CWD, absVuePath)}`,
        );
    } catch (err) {
        errorCount++;
        console.error(`❌ 翻译 ${file.relPath} 失败：`);
        console.error(err);
    }
}

// ============================================================
// 生成主文件 src/App.vue
// ============================================================

function generateMainFile(items: ComponentOutput[]): string {
    const sorted = [...items].sort((a, b) =>
        a.relVuePath.localeCompare(b.relVuePath),
    );

    const imports = sorted
        .map((c) => `import ${c.name} from "${c.importPath}.vue";`)
        .join("\n");

    const tags = sorted
        .map((c) => `        <${c.name} />`)
        .join("\n");

    return `<!--
    此文件由 index.ts 自动生成，请勿手动编辑。
-->
<template>
    <AShell>
${tags}
    </AShell>
</template>

<script setup lang="ts">
import { AShell } from "@advmaker/core";
${imports}
</script>
`;
}

if (components.length > 0) {
    try {
        if (fs.existsSync(MAIN_FILE) && !config.overwriteMainFile) {
            console.log(
                `⏭  主文件已存在，跳过：${path.relative(CWD, MAIN_FILE)}`,
            );
        } else {
            fs.mkdirSync(path.dirname(MAIN_FILE), { recursive: true });
            fs.writeFileSync(MAIN_FILE, generateMainFile(components), "utf8");
            console.log(`✅ 主文件 → ${path.relative(CWD, MAIN_FILE)}`);
        }
    } catch (err) {
        errorCount++;
        console.error("❌ 生成主文件失败：");
        console.error(err);
    }
}

// ============================================================
// 生成 src/game.config.ts
// ============================================================

try {
    fs.mkdirSync(path.dirname(GAME_CONFIG_FILE), { recursive: true });
    fs.writeFileSync(
        GAME_CONFIG_FILE,
        translater.toGameConfig(),
        "utf8",
    );
    console.log(
        `✅ game.config.ts → ${path.relative(CWD, GAME_CONFIG_FILE)}`,
    );
} catch (err) {
    errorCount++;
    console.error("❌ 生成 game.config.ts 失败：");
    console.error(err);
}

// ============================================================
// 收尾
// ============================================================

if (errorCount > 0) {
    console.error(`\n构建完成，但有 ${errorCount} 个错误。`);
    process.exit(1);
} else {
    console.log("\n构建完成。");
}