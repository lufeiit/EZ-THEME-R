const { defineConfig } = require("@vue/cli-service");
const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const JavaScriptObfuscator = require("javascript-obfuscator");

const isProd = process.env.NODE_ENV === "production";
const enableConfigJS = process.env.VUE_APP_CONFIGJS == "true";
const enableObfuscation = process.env.VUE_APP_OBFUSCATION == "true";
// Codex改动：允许 V2Board 主题打包脚本覆盖 publicPath，保证异步分包从 /theme/{theme}/ 下加载。
const publicPath = process.env.VUE_APP_PUBLIC_PATH || "./";

let extraScriptFileName = '';
const generateRandomFileName = (length = 8) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let name = "";
  for (let i = 0; i < length; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const randowNumber = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
  return `${randowNumber}.${name}.js`;
};

if (isProd && enableConfigJS) {
  extraScriptFileName = generateRandomFileName();
}

module.exports = defineConfig({
  publicPath,
  outputDir: "dist",
  assetsDir: "static",
  lintOnSave: false,
  productionSourceMap: false,

  configureWebpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true, syncWebAssembly: true };
    config.resolve = { ...config.resolve, alias: { "@": path.resolve(__dirname, "src") } };
    // Codex改动：开发环境使用轮询并忽略大目录，避免低 inotify 限额服务器运行 npm run serve 时 ENOSPC。
    if (!isProd) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: [
          "**/node_modules/**",
          "**/dist/**",
          "**/dist-v2board/**",
          "**/.git/**",
          "**/.github/**",
        ],
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    config.plugins.push(
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
      })
    );

    if (isProd && enableConfigJS) {
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap("GenerateExtraConfigPlugin", () => {
            const configPath = path.resolve(__dirname, "src/config/index.js");
            const constantPath = path.resolve(__dirname, "src/config/constant.js");
            const distPath = path.resolve(compiler.options.output.path, extraScriptFileName);

            try {
              let configContent = fs.readFileSync(configPath, "utf-8");
              let constantContent = fs.readFileSync(constantPath, "utf-8");

              // 将 constant.js 的内容去掉 export 关键字，直接内联到配置文件中
              // 这比逐个正则提取函数体更可靠，不会因为函数格式变化而出错
              let inlinedConstants = constantContent.replace(/export\s+const\s+/g, 'const ');

              // 替换 import 语句为内联的函数/变量定义
              configContent = configContent.replace(/import\s+{[^}]+}\s+from\s+["']@\/config\/constant["'];?\s*\n?/, inlinedConstants + '\n');

              // 原有的替换 export 语句的逻辑
              configContent = configContent.replace(/window\.EZ_CONFIG\s*=\s*config\s*;?/g, "");
              configContent = configContent.replace(/export\s+const\s+config\s*=/, "window.EZ_CONFIG =");

              const obfuscated = JavaScriptObfuscator.obfuscate(configContent, {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                numbersToExpressions: true,
                simplify: true,
                stringArray: true,
                stringArrayEncoding: ["rc4"],
                stringArrayThreshold: 0.75,
                transformObjectKeys: true,
                unicodeEscapeSequence: true
              }).getObfuscatedCode();

              const fileContent = enableObfuscation ? obfuscated : configContent;

              // 写入 dist
              fs.writeFileSync(distPath, fileContent, "utf-8");

              console.log(`生成混淆独立 JS 文件: ${extraScriptFileName}`);
            } catch (err) {
              console.warn("生成独立 JS 文件失败:", err);
            }
          });
        },
      });
    }

    if (isProd) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendors: { name: "chunk-vendors", test: /[\\/]node_modules[\\/]/, priority: -10, chunks: "initial" },
            common: { name: "chunk-common", minChunks: 2, priority: -20, chunks: "initial", reuseExistingChunk: true },
          },
        },
        minimize: true,
        minimizer: [
          new TerserPlugin({
            // Codex改动：关闭并行压缩，降低 V2Board 主题打包时的峰值内存占用。
            parallel: false,
            terserOptions: { compress: { drop_console: true, drop_debugger: true }, mangle: true, format: { comments: false, ascii_only: true } },
            extractComments: false,
          }),
        ],
      };
    }
  },

  chainWebpack: (config) => {
    if (isProd) {
      const pluginName = "html-index";
      config.plugin(pluginName).tap((args) => {
        args[0].templateParameters = {
          ...args[0].templateParameters,
          injectCustomScript: `
            ${enableConfigJS ? `<script src="./${extraScriptFileName}"></script>` : ""}
          `,
        };
        return args;
      });
    }
  },

  css: {
    loaderOptions: {
      sass: {
        implementation: require("sass"),
        sassOptions: { outputStyle: "expanded", fiber: false, indentedSyntax: false, includePaths: ["node_modules"] },
        additionalData: `@use "@/assets/styles/base/variables.scss" as *;`,
      },
    },
  },

  pages: {
    index: { entry: "src/main.js", template: "public/index.html", filename: "index.html", title: process.env.VUE_APP_TITLE },
  },

  // Codex改动：开发模式显式启用 HMR/liveReload，并适配通过局域网 IP 访问时的 WebSocket 自动刷新。
  devServer: {
    host: "0.0.0.0",
    allowedHosts: "all",
    hot: true,
    liveReload: true,
    static: {
      watch: false,
    },
    client: {
      overlay: false,
      webSocketURL: "auto://0.0.0.0:0/ws",
    },
    watchFiles: {
      paths: ["src/**/*", "public/**/*"],
      options: {
        usePolling: true,
        interval: 500,
      },
    },
  },
});
