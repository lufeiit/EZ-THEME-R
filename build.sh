#!/bin/bash

# ============================================================
# EZ-THEME-R 交互式打包脚本
# 用法: bash build.sh 或 ./build.sh
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ENV_FILE=".env.production"

# ============================================================
# 工具函数（全部用 printf 保证 sh 兼容）
# ============================================================

print_banner() {
    printf "\n"
    printf "${CYAN}╔══════════════════════════════════════════╗${NC}\n"
    printf "${CYAN}║      ${BOLD}EZ-THEME-R 交互式打包工具${NC}${CYAN}          ║${NC}\n"
    printf "${CYAN}╚══════════════════════════════════════════╝${NC}\n"
    printf "\n"
}

print_step()    { printf "${BLUE}[步骤]${NC} %s\n" "$1"; }
print_success() { printf "${GREEN}[✓]${NC} %s\n" "$1"; }
print_warning() { printf "${YELLOW}[!]${NC} %s\n" "$1"; }
print_error()   { printf "${RED}[✗]${NC} %s\n" "$1"; }

# 读取 .env.production 中某个 key 的当前值
read_env_value() {
    local key="$1"
    if [ -f "$ENV_FILE" ]; then
        grep "^${key}" "$ENV_FILE" 2>/dev/null | sed "s/^${key}[[:space:]]*=[[:space:]]*//" | tr -d '\r'
    fi
}

# 更新 .env.production 中某个 key 的值
update_env_value() {
    local key="$1"
    local value="$2"
    local tmp_file
    if grep -q "^${key}" "$ENV_FILE" 2>/dev/null; then
        # Codex改动：不用 sed -i ''，避免 Linux 下把替换表达式误当文件名导致打包中断。
        tmp_file=$(mktemp)
        sed "s|^${key}[[:space:]]*=.*|${key} = ${value}|" "$ENV_FILE" > "$tmp_file"
        cat "$tmp_file" > "$ENV_FILE"
        rm -f "$tmp_file"
    else
        printf "%s = %s\n" "$key" "$value" >> "$ENV_FILE"
    fi
}

# 显示 true/false 为中文
display_bool() {
    if [ "$1" = "true" ]; then
        printf "${GREEN}开启${NC}"
    else
        printf "${RED}关闭${NC}"
    fi
}

# yes/no 交互提示（提示输出到 stderr，避免被 $() 捕获）
ask_yes_no() {
    local prompt="$1"
    local default="$2"
    local hint

    if [ "$default" = "true" ]; then
        hint="Y/n"
    else
        hint="y/N"
    fi

    while true; do
        printf "${YELLOW}?${NC} %s [%s]: " "$prompt" "$hint" >&2
        read -r answer
        case "$answer" in
            [Yy]|[Yy][Ee][Ss]) echo "true"; return ;;
            [Nn]|[Nn][Oo])     echo "false"; return ;;
            "")                echo "$default"; return ;;
            *) printf "  ${RED}请输入 y 或 n${NC}\n" >&2 ;;
        esac
    done
}

# ============================================================
# 主流程
# ============================================================

print_banner

# ---------- 1. 检测依赖 ----------
print_step "检测项目依赖..."

if [ ! -d "node_modules" ]; then
    print_warning "未检测到 node_modules，正在安装依赖..."
    printf "\n"
    npm install
    printf "\n"
    print_success "依赖安装完成"
else
    print_success "依赖已安装 (node_modules 存在)"
fi

printf "\n"

# ---------- 2. 检查 .env.production ----------
if [ ! -f "$ENV_FILE" ]; then
    print_error "未找到 ${ENV_FILE}，请确认项目结构完整"
    exit 1
fi

# ---------- 3. 读取当前配置并显示 ----------
CURRENT_TITLE=$(read_env_value "VUE_APP_TITLE")
CURRENT_DEBUG=$(read_env_value "VUE_APP_DEBUGGING")
CURRENT_CONFIGJS=$(read_env_value "VUE_APP_CONFIGJS")
CURRENT_OBFUSCATION=$(read_env_value "VUE_APP_OBFUSCATION")

printf "${BOLD}当前配置：${NC}\n"
printf "  网站标题:       ${CYAN}%s${NC}\n" "$CURRENT_TITLE"
printf "  反调试:         "; display_bool "$CURRENT_DEBUG"; printf "\n"
printf "  独立配置文件:   "; display_bool "$CURRENT_CONFIGJS"; printf "\n"
printf "  配置文件混淆:   "; display_bool "$CURRENT_OBFUSCATION"; printf "\n"
printf "\n"

# ---------- 4. 交互式配置 ----------
printf "${BOLD}── 请配置打包参数（直接回车保持原值）──${NC}\n\n"

# 4.1 网站标题
printf "${YELLOW}?${NC} 网站标题 [%s]: " "$CURRENT_TITLE"
read -r NEW_TITLE
NEW_TITLE="${NEW_TITLE:-$CURRENT_TITLE}"

# 4.2 反调试
NEW_DEBUG=$(ask_yes_no "启用反调试（阻止F12开发者工具）" "$CURRENT_DEBUG")

# 4.3 独立配置文件
NEW_CONFIGJS=$(ask_yes_no "生成独立配置文件（站点配置可热更新）" "$CURRENT_CONFIGJS")

# 4.4 混淆（仅独立配置文件开启时询问）
NEW_OBFUSCATION="false"
if [ "$NEW_CONFIGJS" = "true" ]; then
    NEW_OBFUSCATION=$(ask_yes_no "混淆独立配置文件（增加安全性）" "$CURRENT_OBFUSCATION")
else
    printf "  ${CYAN}ℹ${NC} 未开启独立配置文件，跳过混淆选项\n"
fi

printf "\n"

# ---------- 5. 确认配置 ----------
printf "${BOLD}── 最终打包配置 ──${NC}\n\n"
printf "  网站标题:       ${GREEN}%s${NC}\n" "$NEW_TITLE"
printf "  反调试:         "; display_bool "$NEW_DEBUG"; printf "\n"
printf "  独立配置文件:   "; display_bool "$NEW_CONFIGJS"; printf "\n"
if [ "$NEW_CONFIGJS" = "true" ]; then
    printf "  配置文件混淆:   "; display_bool "$NEW_OBFUSCATION"; printf "\n"
fi
printf "\n"

CONFIRM=$(ask_yes_no "确认以上配置并开始打包" "true")
if [ "$CONFIRM" != "true" ]; then
    print_warning "已取消打包"
    exit 0
fi

printf "\n"

# ---------- 6. 写入 .env.production ----------
print_step "写入 ${ENV_FILE}..."

update_env_value "VUE_APP_TITLE" "$NEW_TITLE"
update_env_value "VUE_APP_DEBUGGING" "$NEW_DEBUG"
update_env_value "VUE_APP_CONFIGJS" "$NEW_CONFIGJS"
update_env_value "VUE_APP_OBFUSCATION" "$NEW_OBFUSCATION"

print_success "配置已写入 ${ENV_FILE}"
printf "\n"

# ---------- 7. 执行构建 ----------
print_step "开始构建 (npm run build)..."
printf "\n"

npm run build

printf "\n"
printf "${GREEN}╔══════════════════════════════════════════╗${NC}\n"
printf "${GREEN}║            ${BOLD}✓ 打包完成！${NC}${GREEN}                  ║${NC}\n"
printf "${GREEN}╚══════════════════════════════════════════╝${NC}\n"
printf "\n"
printf "  输出目录:  ${CYAN}dist/${NC}\n"
printf "  网站标题:  ${CYAN}%s${NC}\n" "$NEW_TITLE"
if [ "$NEW_CONFIGJS" = "true" ]; then
    printf "  配置文件:  ${CYAN}独立配置文件（混淆: %s）${NC}\n" "$NEW_OBFUSCATION"
else
    printf "  配置文件:  ${CYAN}内联模式（无独立配置文件）${NC}\n"
fi
printf "\n"
