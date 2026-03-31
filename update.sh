#!/bin/bash
# OpenClaw Enhance 一键更新脚本

set -e

echo "=========================================="
echo "OpenClaw Enhance 更新"
echo "=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 检查 git
if ! command -v git &> /dev/null; then
  echo "❌ 需要安装 git"
  exit 1
fi

cd "$SCRIPT_DIR"

# 检查是否是 git 仓库
if [ ! -d .git ]; then
  echo "❌ 不是 git 仓库，初始化..."
  git init
  git remote add origin https://github.com/lintong1111/openclaw-enhance.git
  git fetch origin main
  git branch -m main
  git reset --hard origin/main
fi

echo "🔄 拉取最新代码..."
git stash 2>/dev/null || true
git pull origin main --force

echo ""
echo "✅ 更新完成！"
echo "   最新提交: $(git log -1 --oneline)"
