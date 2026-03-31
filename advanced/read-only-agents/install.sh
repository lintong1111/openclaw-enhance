#!/bin/bash
# Read-Only Agents 模块安装

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📦 安装 Read-Only Agents..."

mkdir -p ~/.openclaw/workspace/services/read-only-agents
cp "$SCRIPT_DIR/readOnlyTools.js" ~/.openclaw/workspace/services/read-only-agents/
echo "✅ Read-Only Agents 已安装"
echo "   路径: ~/.openclaw/workspace/services/read-only-agents/"
