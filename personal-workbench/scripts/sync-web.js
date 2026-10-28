// 把单文件 HTML 和静态资源复制到 web/ 目录，供 Tauri 加载/打包
// 源文件保持不动，web/ 为自动生成目录（Tauri 入口要求 index.html）
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const web = path.join(root, 'web');

fs.rmSync(web, { recursive: true, force: true });
fs.mkdirSync(web, { recursive: true });
fs.copyFileSync(path.join(root, 'workbench-desktop.html'), path.join(web, 'index.html'));
fs.cpSync(path.join(root, 'assets'), path.join(web, 'assets'), { recursive: true });

console.log('[sync-web] web/ 已更新（index.html + assets/）');
