#!/bin/bash
# In-Process Teammate 模块安装

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📦 安装 In-Process Teammate..."

mkdir -p ~/.openclaw/workspace/services/in-process-teammate
cp "$SCRIPT_DIR/inProcessTeammate.js" ~/.openclaw/workspace/services/in-process-teammate/
echo "✅ In-Process Teammate 已安装"
echo "   路径: ~/.openclaw/workspace/services/in-process-teammate/"
