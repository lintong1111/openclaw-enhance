#!/bin/bash
# OpenClaw 核心能力安装脚本 - 贾维斯模式

set -e

echo "=========================================="
echo "OpenClaw 贾维斯模式 - 安装脚本"
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCLAW_DIR="$HOME/.openclaw/workspace"

echo ""
echo "步骤 1: 复制配置文件..."

# 合并 SOUL.md（追加贾维斯模式内容）
JARVIS_SOUL=$(cat "$SCRIPT_DIR/SOUL.md")
if [ -f "$OPENCLAW_DIR/SOUL.md" ]; then
    # 如果已存在，先备份
    cp "$OPENCLAW_DIR/SOUL.md" "$OPENCLAW_DIR/SOUL.md.bak"
    # 追加贾维斯内容
    echo "" >> "$OPENCLAW_DIR/SOUL.md"
    echo "$JARVIS_SOUL" >> "$OPENCLAW_DIR/SOUL.md"
    echo -e "${GREEN}✓ SOUL.md 已更新（备份为 SOUL.md.bak）${NC}"
else
    cp "$SCRIPT_DIR/SOUL.md" "$OPENCLAW_DIR/SOUL.md"
    echo -e "${GREEN}✓ SOUL.md 已安装${NC}"
fi

# 合并 AGENTS.md
if [ -f "$OPENCLAW_DIR/AGENTS.md" ]; then
    cp "$OPENCLAW_DIR/AGENTS.md" "$OPENCLAW_DIR/AGENTS.md.bak"
    echo "" >> "$OPENCLAW_DIR/AGENTS.md"
    cat "$SCRIPT_DIR/AGENTS.md" >> "$OPENCLAW_DIR/AGENTS.md"
    echo -e "${GREEN}✓ AGENTS.md 已更新${NC}"
else
    cp "$SCRIPT_DIR/AGENTS.md" "$OPENCLAW_DIR/AGENTS.md"
    echo -e "${GREEN}✓ AGENTS.md 已安装${NC}"
fi

echo ""
echo "步骤 2: 配置守护进程..."
if [ -f "$SCRIPT_DIR/../daemon/openclaw-gateway.service" ]; then
    sudo cp "$SCRIPT_DIR/../daemon/openclaw-gateway.service" /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable openclaw-gateway
    echo -e "${GREEN}✓ 守护进程已安装${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}贾维斯模式安装完成！${NC}"
echo "=========================================="
echo ""
echo "已配置："
echo "  ✅ SOUL.md - 主动服务配置"
echo "  ✅ AGENTS.md - Agent 增强配置"
echo "  ✅ 守护进程（可选）"
echo ""
echo "重启 OpenClaw Gateway："
echo "  openclaw gateway restart"
