#!/bin/bash
# Token Budget 模块安装

set -e
echo "📦 安装 Token Budget..."

mkdir -p ~/.openclaw/workspace/services/token-budget
cp tokenBudget.js ~/.openclaw/workspace/services/token-budget/
echo "✅ Token Budget 已安装"
echo "   路径: ~/.openclaw/workspace/services/token-budget/"
