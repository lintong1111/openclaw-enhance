#!/bin/bash
# Token Budget 模块安装

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📦 安装 Token Budget..."

mkdir -p ~/.openclaw/workspace/services/token-budget
cp "$SCRIPT_DIR/tokenBudget.js" ~/.openclaw/workspace/services/token-budget/
echo "✅ Token Budget 已安装"
echo "   路径: ~/.openclaw/workspace/services/token-budget/"
