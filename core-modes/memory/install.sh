#!/bin/bash
# OpenClaw 核心能力安装脚本 - 长期记忆模式

set -e

echo "=========================================="
echo "OpenClaw 长期记忆模式 - 安装脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCLAW_DIR="$HOME/.openclaw/workspace"

echo ""
echo "步骤 1: 复制核心配置文件..."

# 复制 SOUL.md
cp "$SCRIPT_DIR/SOUL.md" "$OPENCLAW_DIR/SOUL.md"
echo -e "${GREEN}✓ SOUL.md 已安装${NC}"

# 复制 USER.md
cp "$SCRIPT_DIR/USER.md" "$OPENCLAW_DIR/USER.md"
echo -e "${GREEN}✓ USER.md 已安装${NC}"

# 复制 MEMORY.md
cp "$SCRIPT_DIR/MEMORY.md" "$OPENCLAW_DIR/MEMORY.md"
echo -e "${GREEN}✓ MEMORY.md 已安装${NC}"

echo ""
echo "步骤 2: 创建记忆目录..."
mkdir -p "$OPENCLAW_DIR/.learnings"
mkdir -p "$OPENCLAW_DIR/memory"

# 复制 learnings 模板
if [ -d "$SCRIPT_DIR/.learnings" ]; then
    cp -r "$SCRIPT_DIR/.learnings/"* "$OPENCLAW_DIR/.learnings/" 2>/dev/null || true
fi
echo -e "${GREEN}✓ 记忆目录已创建${NC}"

echo ""
echo "步骤 3: 启用自我学习 Hook..."
if command -v openclaw &> /dev/null; then
    openclaw hooks enable self-improvement 2>/dev/null || echo -e "${YELLOW}注意: Hook 可能已启用${NC}"
    echo -e "${GREEN}✓ 自我学习 Hook 已启用${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}长期记忆模式安装完成！${NC}"
echo "=========================================="
echo ""
echo "已配置："
echo "  ✅ SOUL.md - 灵魂配置"
echo "  ✅ USER.md - 用户画像"
echo "  ✅ MEMORY.md - 长期记忆"
echo "  ✅ .learnings/ - 学习记录目录"
echo ""
echo "重启 OpenClaw Gateway 使配置生效："
echo "  openclaw gateway restart"
