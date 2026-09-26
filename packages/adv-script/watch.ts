import chokidar from "chokidar";
import { spawn } from "node:child_process";
import path from "node:path";

// ---------- 路径 ----------

const CWD = process.cwd();
const SCRIPT_DIR = path.resolve(CWD, "src/script");
const ENTRY = path.resolve(CWD, "packages/adv-script/index.ts");

// ---------- 构建调度 ----------

let building = false;
let pending = false;
let debounceTimer: NodeJS.Timeout | null = null;

function runBuild(): void {
    if (building) {
        // 正在构建中，记一个 pending，构建完自动补跑
        pending = true;
        return;
    }
    building = true;

    const started = Date.now();
    console.log(`\n🔄 [${new Date().toLocaleTimeString()}] 开始构建...`);

    const child = spawn("npx", ["tsx", ENTRY], {
        stdio: "inherit",
        shell: process.platform === "win32", // Windows 需要 shell 才能找到 npx
    });

    child.on("close", (code) => {
        building = false;
        const cost = Date.now() - started;
        if (code === 0) {
            console.log(`✅ 构建完成（${cost}ms）`);
        } else {
            console.error(`❌ 构建失败（退出码 ${code}，${cost}ms）`);
        }

        if (pending) {
            pending = false;
            runBuild();
        }
    });

    child.on("error", (err) => {
        building = false;
        console.error("❌ 启动子进程失败：", err);
    });
}

function scheduleBuild(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        debounceTimer = null;
        runBuild();
    }, 150); // 150ms debounce，避免编辑时连续触发
}

// ---------- 监听 ----------

const watcher = chokidar.watch(SCRIPT_DIR, {
    ignored: /(^|[/\\])\../, // 忽略隐藏文件（.git 等）
    persistent: true,
    ignoreInitial: true,     // 初次扫描不触发 add 事件
    awaitWriteFinish: {
        // 等文件写完再触发，避免半截内容
        stabilityThreshold: 100,
        pollInterval: 50,
    },
});

watcher
    .on("add", (p) => {
        if (!p.endsWith(".adv")) return;
        console.log(`➕ 新增: ${path.relative(CWD, p)}`);
        scheduleBuild();
    })
    .on("change", (p) => {
        if (!p.endsWith(".adv")) return;
        console.log(`📝 修改: ${path.relative(CWD, p)}`);
        scheduleBuild();
    })
    .on("unlink", (p) => {
        if (!p.endsWith(".adv")) return;
        console.log(`➖ 删除: ${path.relative(CWD, p)}`);
        scheduleBuild();
    })
    .on("error", (err) => {
        console.error("👀 监听错误：", err);
    });

console.log(`👀 监听目录： ${SCRIPT_DIR}`);
console.log(`   构建入口： ${ENTRY}`);
console.log(`   按 Ctrl+C 停止\n`);

// 首次立即构建一次
runBuild();

// ---------- 退出处理 ----------

let shuttingDown = false;
process.on("SIGINT", () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("\n👋 正在停止监听...");
    watcher.close().then(() => process.exit(0));
});