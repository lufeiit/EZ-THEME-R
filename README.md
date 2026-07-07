# EZ-THEME-R V2Board 前端主题

本项目基于 [EZTHEME/EZ_THEME](https://github.com/EZTHEME/EZ_THEME) 二次开发，目标是作为 V2Board 用户前端主题使用。

当前版本已加入 V2Board 标准主题打包、节点解锁展示、导航栏扩展、主题目录资源路径适配等修改。

## 主要修改

### V2Board 主题打包

- 新增 `npm run build:v2board-theme`
- 新增 `scripts/build-v2board-theme.sh`
- 打包结果输出到：

```bash
dist-v2board/ez-theme-r/
dist-v2board/ez-theme-r.zip
```

- 自动生成 V2Board 需要的：

```bash
dashboard.blade.php
config.json
favicon.ico
```

- 主题资源路径不写死主题名，支持安装到不同主题目录。

### Logo 和图标路径

已修复打包成 V2Board 主题后 Logo 读取错误的问题。

优先级：

```text
V2Board 后台设置的 logo
-> /theme/当前主题/images/logo.png
-> /logo.png
```

浏览器 favicon 使用：

```text
/favicon.ico
```

相关文件：

```bash
src/utils/themeAssets.js
src/App.vue
src/views/landing/LandingPage.vue
src/views/auth/**/*
scripts/build-v2board-theme.sh
```

### 节点解锁视图

在 `/nodes` 页面新增了解锁视图：

- 节点为纵向
- 右侧分为流媒体和 AI
- 支持单选和多选筛选
- 支持手机端横向滚动
- 表头支持类似表格冻结第一行

当前显示项目：

流媒体：

```text
Netflix
Disney+
DAZN
PrimeVideo
YouTube会员
TikTok
spotify注册
```

AI：

```text
Copilot
ChatGPT
Gemini
Claude
Mistral
Quora
Perplexity
Grok
```

解锁数据来自 V2Board 后端节点接口返回的 `unlock_result` 字段。后端读取路径为：

```bash
/www/wwwroot/v2board/storage/app/unlock-results/all.json
```

### 导航栏扩展

顶部导航支持在配置文件中额外显示多个目录。

配置位置：

```bash
src/config/index.js
```

配置项：

```js
NAVIGATION_CONFIG: {
  extraNavItems: ['docs', 'invite', 'nodes', 'orders', 'tickets']
}
```

### 节点导航角标

节点导航支持右上角文字角标，例如显示“解锁”。

配置位置：

```bash
src/config/index.js
```

配置项在 `NODES_CONFIG.navBadge`。

## 目录说明

```bash
src/
├── api/                    # API 请求
├── assets/                 # 静态资源
├── components/             # 公共组件
├── config/                 # 主题配置
├── router/                 # 路由
├── store/                  # Vuex
├── utils/                  # 工具函数
└── views/                  # 页面

scripts/
└── build-v2board-theme.sh  # V2Board 标准主题打包脚本

public/
├── images/                 # public 图片
├── favicon.ico             # 浏览器图标
├── logo.png                # 根目录 Logo 兜底
└── index.html              # Vue 入口模板
```

## 安装依赖

```bash
npm install
```

## 开发运行

```bash
npm run serve
```

默认访问：

```text
http://localhost:8080
```

局域网访问示例：

```text
http://服务器IP:8080
```


## 普通生产打包

交互式打包：

```bash
bash build.sh
```

手动打包：

```bash
npm run build
```

普通打包产物：

```bash
dist/
```

## V2Board 主题打包

推荐使用：

```bash
npm run build:v2board-theme
```

完整打包会先自动清空：

```bash
dist/
dist-v2board/
```

等价命令：

```bash
bash scripts/build-v2board-theme.sh
```

输出：

```bash
dist-v2board/ez-theme-r/
dist-v2board/ez-theme-r.zip
```

自定义主题目录名：

```bash
V2BOARD_THEME_NAME=my-theme npm run build:v2board-theme
```

如果 `dist/` 已经是最新，只想重新整理 V2Board 主题包：

```bash
SKIP_BUILD=true bash scripts/build-v2board-theme.sh
```

## 部署到 V2Board

将主题包上传到 V2Board：

```bash
dist-v2board/ez-theme-r.zip
```

或直接复制目录：

```bash
cp -a dist-v2board/ez-theme-r /www/wwwroot/v2board/public/theme/
```

最终目录应为：

```bash
/www/wwwroot/v2board/public/theme/ez-theme-r/
```

然后在 V2Board 后台切换主题为：

```text
ez-theme-r
```

## 节点解锁数据要求

前端不直接读取 JSON 文件，而是读取 V2Board 用户节点接口返回的数据。

后端需要把解锁结果注入节点接口：

```json
{
  "unlock_result": {
    "media": {},
    "ai": {},
    "node": {}
  }
}
```

解锁结果 JSON 推荐保存位置：

```bash
/www/wwwroot/v2board/storage/app/unlock-results/all.json
```

示例服务字段：

```text
media.netflix
media.disney_plus
media.amazon_prime_video
media.youtube_premium
ai.microsoft_copilot
ai.openai_chatgpt
ai.google_gemini
ai.anthropic_claude
ai.mistral_ai
ai.quora_poe
ai.perplexity_ai
ai.x_ai_grok
```
