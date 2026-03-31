#!/bin/bash
# OpenClaw 自我进化技能包 - 一键安装脚本

set -e

echo "=========================================="
echo "OpenClaw 自我进化技能包 - 安装脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 OpenClaw 是否已安装
if ! command -v openclaw &> /dev/null; then
    echo -e "${RED}错误: OpenClaw 未安装，请先安装 OpenClaw${NC}"
    exit 1
fi

echo -e "${GREEN}✓ OpenClaw 已安装${NC}"

# 创建必要的目录
echo ""
echo "步骤 1: 创建必要的目录..."
mkdir -p ~/.openclaw/workspace/.learnings
mkdir -p ~/.openclaw/hooks
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 复制学习记录模板
echo ""
echo "步骤 2: 复制学习记录模板..."
if [ -d "$SCRIPT_DIR/.learnings" ]; then
    cp -r "$SCRIPT_DIR/.learnings/"* ~/.openclaw/workspace/.learnings/
    echo -e "${GREEN}✓ 学习记录模板已复制${NC}"
else
    echo -e "${YELLOW}警告: 未找到 .learnings 目录，跳过${NC}"
fi

# 复制 Hook 配置
echo ""
echo "步骤 3: 复制 Hook 配置..."
if [ -d "$SCRIPT_DIR/hooks/openclaw" ]; then
    cp -r "$SCRIPT_DIR/hooks/openclaw" ~/.openclaw/hooks/self-improvement
    echo -e "${GREEN}✓ Hook 配置已复制${NC}"
else
    echo -e "${YELLOW}警告: 未找到 hooks 目录，跳过${NC}"
fi

# 启用 Hook
echo ""
echo "步骤 4: 启用 Hook..."
if command -v openclaw &> /dev/null; then
    openclaw hooks enable self-improvement 2>/dev/null || echo -e "${YELLOW}注意: Hook 可能已经启用或启用失败，请手动检查${NC}"
    echo -e "${GREEN}✓ Hook 启用完成${NC}"
else
    echo -e "${YELLOW}警告: 无法启用 Hook，OpenClaw 命令不可用${NC}"
fi

# 验证安装
echo ""
echo "=========================================="
echo "安装验证"
echo "=========================================="

echo ""
echo "检查学习记录目录:"
ls -la ~/.openclaw/workspace/.learnings/ 2>/dev/null || echo "  (目录为空或不存在)"

echo ""
echo "检查 Hook 目录:"
ls -la ~/.openclaw/hooks/self-improvement/ 2>/dev/null || echo "  (目录为空或不存在)"

echo ""
echo "=========================================="
echo -e "${GREEN}安装完成！${NC}"
echo "=========================================="
echo ""
echo "使用方法:"
echo "  1. 重启 OpenClaw Gateway: openclaw gateway restart"
echo "  2. 学习记录位置: ~/.openclaw/workspace/.learnings/"
echo "  3. 查看 Hook 状态: openclaw hooks list"
echo ""
echo "更多信息请查看 README.md"
