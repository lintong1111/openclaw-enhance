#!/bin/bash
# OpenClaw 核心能力一键安装脚本
# 安装所有核心能力：长期记忆 + 贾维斯模式 + 守护进程

set -e

echo "=========================================="
echo "OpenClaw 核心能力一键安装"
echo "=========================================="
echo ""

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "开始安装..."
echo ""

# 安装长期记忆模式
echo ">>> 安装长期记忆模式..."
bash "$SCRIPT_DIR/memory/install.sh"
echo ""

# 安装贾维斯模式
echo ">>> 安装贾维斯模式..."
bash "$SCRIPT_DIR/jarvis/install.sh"
echo ""

# 安装守护进程（可选，需要 sudo）
if [ "$1" != "--no-daemon" ]; then
    echo ">>> 安装守护进程..."
    if [ "$EUID" -ne 0 ]; then
        echo "（需要 sudo 权限，跳过...）"
        echo "如需安装，运行: sudo bash daemon/install.sh"
    else
        bash "$SCRIPT_DIR/daemon/install.sh"
    fi
fi

echo ""
echo "=========================================="
echo "安装完成！"
echo "=========================================="
echo ""
echo "请重启 OpenClaw Gateway 使配置生效："
echo "  openclaw gateway restart"
echo ""
echo "可选：配置 GitHub 备份"
echo "  cd ~/.openclaw && git remote set-url origin https://<TOKEN>@github.com/<USER>/openclaw-config.git"
