# V3Board User 前端项目

本项目基于原版 [Github仓库地址](https://github.com/EZTHEME/EZ_THEME)，二次开发

一个美观、现代的V2Board管理后台前端项目，基于Vue 3开发。

## 特性

- 🎨 美观的UI设计，简约高端
- 🌓 支持亮色/暗色主题切换
- 🌍 内置国际化支持（中文/英文）
- 📱 响应式设计，适配各种设备
- 🔒 完善的登录认证系统
- 🚀 模块化的代码结构，易于维护

## 技术栈

- Vue 3 - 渐进式JavaScript框架
- Vue Router - 官方路由管理器
- Vuex - 状态管理模式
- Axios - 基于Promise的HTTP客户端
- Sass - CSS预处理器
- Vue I18n - 国际化解决方案

## 项目结构

```
src/
├── api/                # API接口
├── assets/             # 静态资源
│   └── styles/         # 样式文件
│       ├── base/       # 基础样式
│       ├── components/ # 组件样式
│       └── layouts/    # 布局样式
├── components/         # 公共组件
├── composables/        # 组合式API
├── i18n/               # 国际化
│   └── locales/        # 语言包
├── router/             # 路由配置
├── store/              # Vuex存储
├── utils/              # 工具函数
└── views/              # 页面视图
```

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run serve
```

### 生产环境构建（推荐）

使用交互式打包脚本，按提示操作即可完成打包：

```bash
bash build.sh
```

脚本会自动完成以下步骤：

1. **检测依赖** — 如未安装 `node_modules`，自动执行 `npm install`
2. **交互式配置** — 逐项提示你设置以下参数：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 网站标题 | 浏览器标签页显示的名称 | `EZ-THEME-R` |
| 反调试 | 阻止 F12 开发者工具 | 开启 |
| 独立配置文件 | 站点配置可热更新，无需重新打包 | 关闭 |
| 配置文件混淆 | 仅在开启独立配置文件后可选 | 关闭 |

3. **确认并打包** — 预览最终配置，确认后自动执行 `npm run build`

> 💡 每一项都有默认值，直接按回车即可保持当前设置不变。

打包完成后，产物在 `dist/` 目录中，直接部署即可。

### 手动构建

如果不使用打包脚本，也可以先手动修改 `.env.production` 文件，然后执行：

```bash
npm run build
```

## 自定义配置

### 主题配置

主题颜色和其他配置可以在 `src/config/index.js` 文件中修改。

### API配置

API基础URL可以在 `src/config/index.js` 文件中修改。

## 浏览器支持

- Chrome
- Firefox
- Safari
- Edge
- 其他现代浏览器
