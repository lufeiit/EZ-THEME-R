#!/usr/bin/env bash

set -euo pipefail

# Codex改动：将 Vue CLI 构建产物整理为 V2Board public/theme/{theme} 标准主题包。
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
THEME_NAME="${V2BOARD_THEME_NAME:-ez-theme-r}"
OUT_DIR="${ROOT_DIR}/dist-v2board"
PACKAGE_DIR="${OUT_DIR}/${THEME_NAME}"
ZIP_PATH="${OUT_DIR}/${THEME_NAME}.zip"

cd "${ROOT_DIR}"

if [ "${SKIP_BUILD:-false}" != "true" ]; then
  # Codex改动：V2Board 主题目录可能改名，生产包不能把异步分包路径写死到某个主题名。
  # 使用 webpack publicPath=auto，让运行时根据入口 JS 地址自动推导 /theme/{当前主题}/。
  # Codex改动：限制 Node 构建堆内存，避免低内存服务器打包时被系统 OOM 直接 Killed。
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
  VUE_APP_PUBLIC_PATH="auto" npm run build
fi

if [ ! -f "${ROOT_DIR}/dist/index.html" ]; then
  echo "未找到 dist/index.html，请先完成构建" >&2
  exit 1
fi

rm -rf "${PACKAGE_DIR}" "${ZIP_PATH}"
mkdir -p "${PACKAGE_DIR}"

cp -a "${ROOT_DIR}/dist/." "${PACKAGE_DIR}/"
find "${PACKAGE_DIR}" -name '._*' -delete
find "${PACKAGE_DIR}" -maxdepth 1 \( -name '*.zip' -o -name '*.7z' \) -delete

node - "${PACKAGE_DIR}" "${THEME_NAME}" <<'NODE'
const fs = require('fs');
const path = require('path');

const packageDir = process.argv[2];
const themeName = process.argv[3];
const indexPath = path.join(packageDir, 'index.html');
const dashboardPath = path.join(packageDir, 'dashboard.blade.php');
const configPath = path.join(packageDir, 'config.json');
const pkg = require(path.resolve(process.cwd(), 'package.json'));

// Codex改动：浏览器标签图标固定使用 favicon.ico；没有自定义 ico 时由 logo.png 生成 32x32 ico。
function createIcoFromPng(sourcePngPath, targetIcoPath) {
  const { PNG } = require('pngjs');
  const source = PNG.sync.read(fs.readFileSync(sourcePngPath));
  const size = 32;
  const target = new PNG({ width: size, height: size });

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sx = Math.min(source.width - 1, Math.floor((x / size) * source.width));
      const sy = Math.min(source.height - 1, Math.floor((y / size) * source.height));
      const sourceIndex = (source.width * sy + sx) << 2;
      const targetIndex = (size * y + x) << 2;
      target.data[targetIndex] = source.data[sourceIndex];
      target.data[targetIndex + 1] = source.data[sourceIndex + 1];
      target.data[targetIndex + 2] = source.data[sourceIndex + 2];
      target.data[targetIndex + 3] = source.data[sourceIndex + 3];
    }
  }

  const pngBuffer = PNG.sync.write(target);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  fs.writeFileSync(targetIcoPath, Buffer.concat([header, entry, pngBuffer]));
}

function ensureThemeFavicon(packageDir) {
  const customFaviconPath = path.resolve(process.cwd(), 'public/favicon.ico');
  const targetFaviconPath = path.join(packageDir, 'favicon.ico');

  if (fs.existsSync(customFaviconPath)) {
    fs.copyFileSync(customFaviconPath, targetFaviconPath);
    return;
  }

  createIcoFromPng(path.join(packageDir, 'images/logo.png'), targetFaviconPath);
}

// Codex改动：Vue 生产构建会压缩 HTML，生成 Blade 前只格式化外层标签，避免开头全部挤在一行。
function formatBladeShell(source) {
  return source
    .replace(/<!doctype html><html([^>]*)><head>/i, '<!doctype html>\n<html$1>\n<head>\n  ')
    .replace(/(<meta[^>]*\/>)(?=<)/gi, '$1\n  ')
    .replace(/(<link[^>]*\/>)(?=<)/gi, '$1\n  ')
    .replace(/(<title>[\s\S]*?<\/title>)(?=<)/i, '$1\n  ')
    .replace(/(<\/style>)(?=<)/gi, '$1\n  ')
    .replace(/(<\/script>)(?=<)/gi, '$1\n  ')
    .replace(/\n {4}<link/gi, '\n  <link')
    .replace(/<\/head><body>/i, '</head>\n<body>')
    .replace(/<body><div id="app"><\/div>/i, '<body>\n  <div id="app"></div>\n  ')
    .replace(/\n\s*<\/head>/i, '\n</head>')
    .replace(/<\/body><\/html>$/i, '</body>\n</html>\n');
}

let html = fs.readFileSync(indexPath, 'utf8');
// Codex改动：把 V2Board 运行时主题目录和 logo/favicon 回退顺序注入前端。
const faviconBlade = "/theme/{{$theme}}/favicon.ico";
const themeAssetsScript = `<script>
  window.EZ_THEME_ASSETS = {
    themeBase: "/theme/{{$theme}}/",
    logo: {!! json_encode($logo ?: '/theme/' . $theme . '/images/logo.png') !!},
    logoFallbacks: {!! json_encode(array_values(array_filter([$logo ?: null, '/theme/' . $theme . '/images/logo.png', '/images/logo.png']))) !!},
    favicon: "${faviconBlade}",
    faviconFallbacks: ["${faviconBlade}", "/favicon.ico"]
  };
</script>`;

html = html
  .replace(/<title>[\s\S]*?<\/title>/i, '<title>{{$title}}</title>')
  .replace(/<link rel="icon" href="[^"]*"\s*\/?>/i, [
    `<link rel="icon" href="${faviconBlade}" />`,
    `<link rel="shortcut icon" href="${faviconBlade}" />`,
    `<link rel="apple-touch-icon" href="${faviconBlade}" />`
  ].join('\n  '))
  .replace(/<\/head>/i, `${themeAssetsScript}\n</head>`)
  .replaceAll(`/theme/${themeName}/`, '/theme/{{$theme}}/')
  .replace(/\b(src|href)="\.\/([^":?#]+)"/g, '$1="/theme/{{$theme}}/$2"')
  .replace(/\b(src|href)="(static\/[^":?#]+)"/g, '$1="/theme/{{$theme}}/$2"')
  .replace(/\b(src|href)="(images\/[^":?#]+)"/g, '$1="/theme/{{$theme}}/$2"')
  .replace(/<\/body>/i, "{!! $theme_config['custom_html'] ?? '' !!}\n</body>");

html = formatBladeShell(html);

ensureThemeFavicon(packageDir);
fs.writeFileSync(dashboardPath, html, 'utf8');

const config = {
  name: themeName,
  description: 'EZ-THEME-R V2Board theme',
  version: String(pkg.version || '1.0.0').replace(/^v/, ''),
  // Codex改动：主题预览图不写死 /theme/{主题目录}，避免主题文件夹改名后路径失效。
  images: 'images/background.jpg',
  configs: [
    {
      label: '自定义页脚HTML',
      placeholder: '可以加入客服 JS、统计代码等',
      field_name: 'custom_html',
      field_type: 'textarea'
    }
  ]
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
fs.rmSync(indexPath, { force: true });
NODE

(
  cd "${OUT_DIR}"
  zip -qr "${ZIP_PATH}" "${THEME_NAME}" -x "${THEME_NAME}/._*"
)

echo "V2Board 主题目录：${PACKAGE_DIR}"
echo "V2Board 主题压缩包：${ZIP_PATH}"
