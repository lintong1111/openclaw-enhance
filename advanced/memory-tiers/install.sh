#!/bin/bash
# Memory Tiers 模块安装

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📦 安装 Memory Tiers..."

mkdir -p ~/.openclaw/workspace/services/memory-tiers
cp "$SCRIPT_DIR/memoryTiers.js" ~/.openclaw/workspace/services/memory-tiers/
echo "✅ Memory Tiers 已安装"
echo "   路径: ~/.openclaw/workspace/services/memory-tiers/"
