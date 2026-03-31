#!/bin/bash
# OpenClaw Enhance 一键安装脚本

set -e

echo "=========================================="
echo "OpenClaw Enhance 一键安装"
echo "=========================================="
echo ""

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 高级模块列表
MODULES=(
  "advanced/token-budget"
  "advanced/graceful-shutdown"
  "advanced/in-process-teammate"
  "advanced/memory-tiers"
  "advanced/read-only-agents"
)

echo "可选模块:"
echo "  1. Token Budget (Token预算管理)"
echo "  2. Graceful Shutdown (优雅关闭)"
echo "  3. In-Process Teammate (进程内协作)"
echo "  4. Memory Tiers (多层记忆)"
echo "  5. Read-Only Agents (只读Agent)"
echo ""

# 创建目录
mkdir -p ~/.openclaw/workspace/services

# 安装所有高级模块
for module in "${MODULES[@]}"; do
  module_name=$(basename "$module")
  echo -e "${YELLOW}安装 $module_name...${NC}"
  
  if [ -f "$SCRIPT_DIR/$module/install.sh" ]; then
    bash "$SCRIPT_DIR/$module/install.sh"
  else
    mkdir -p ~/.openclaw/workspace/services/$module_name
    if [ -f "$SCRIPT_DIR/$module"/*.js ]; then
      cp "$SCRIPT_DIR/$module"/*.js ~/.openclaw/workspace/services/$module_name/
    fi
    if [ -f "$SCRIPT_DIR/$module"/*.md ]; then
      cp "$SCRIPT_DIR/$module"/*.md ~/.openclaw/workspace/services/$module_name/
    fi
    echo "✅ $module_name 已安装"
  fi
done

echo ""
echo "=========================================="
echo -e "${GREEN}安装完成！${NC}"
echo "=========================================="
echo ""
echo "已安装模块:"
ls -la ~/.openclaw/workspace/services/
echo ""
echo "使用示例:"
echo "  const { TokenBudget } = require('~/.openclaw/workspace/services/token-budget/tokenBudget')"
