#!/bin/bash
# Graceful Shutdown 模块安装

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📦 安装 Graceful Shutdown..."

mkdir -p ~/.openclaw/workspace/services/graceful-shutdown
cp "$SCRIPT_DIR/shutdownManager.js" ~/.openclaw/workspace/services/graceful-shutdown/
echo "✅ Graceful Shutdown 已安装"
echo "   路径: ~/.openclaw/workspace/services/graceful-shutdown/"
