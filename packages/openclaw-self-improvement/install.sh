#!/bin/bash
# OpenClaw 自我进化技能包 - 一键安装脚本

set -e

echo '=========================================='
echo 'OpenClaw 自我进化技能包 - 安装脚本'
echo '=========================================='

RED="[0;31m"
GREEN="[0;32m"
YELLOW="[1;33m"
NC="[0m"

if ! command -v openclaw &> /dev/null; then
    echo -e "${RED}错误: OpenClaw 未安装，请先安装 OpenClaw${NC}"
    exit 1
fi
echo -e "${GREEN}✓ OpenClaw 已安装${NC}"

echo ''
echo '步骤 1: 创建必要的目录...'
mkdir -p ~/.openclaw/workspace/.learnings
mkdir -p ~/.openclaw/hooks
mkdir -p ~/.openclaw/workspace/.ftsi
mkdir -p ~/.openclaw/workspace/tools
echo -e "${GREEN}✓ 目录创建完成${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ''
echo '步骤 2: 复制学习记录模板...'
if [ -d "$SCRIPT_DIR/.learnings" ]; then
    cp -n -r "$SCRIPT_DIR/.learnings/"* ~/.openclaw/workspace/.learnings/ 2>/dev/null || true
    echo -e "${GREEN}✓ 学习记录模板已复制${NC}"
else
    echo -e "${YELLOW}警告: 未找到 .learnings 目录，跳过${NC}"
fi

echo ''
echo '步骤 3: 复制 Hook 配置...'
if [ -d "$SCRIPT_DIR/hooks/openclaw" ]; then
    cp -n -r "$SCRIPT_DIR/hooks/openclaw" ~/.openclaw/hooks/self-improvement 2>/dev/null || true
    echo -e "${GREEN}✓ Hook 配置已复制${NC}"
else
    echo -e "${YELLOW}警告: 未找到 hooks 目录，跳过${NC}"
fi

echo ''
echo '步骤 4: 复制自我进化工具 (FTS5搜索/轻量复盘/经验卡片)...'
if [ -d "$SCRIPT_DIR/tools" ]; then
    cp -n "$SCRIPT_DIR/tools/fts5_search.py" ~/.openclaw/workspace/tools/ 2>/dev/null || true
    cp -n "$SCRIPT_DIR/tools/lightweight_reflection.py" ~/.openclaw/workspace/tools/ 2>/dev/null || true
    cp -n "$SCRIPT_DIR/tools/experience_card.py" ~/.openclaw/workspace/tools/ 2>/dev/null || true
    cp -n "$SCRIPT_DIR/tools/prompt_inject_scanner.py" ~/.openclaw/workspace/tools/ 2>/dev/null || true
    cp -n "$SCRIPT_DIR/tools/prompt_inject_scanner.py" ~/.openclaw/workspace/tools/ 2>/dev/null || true
    echo -e "${GREEN}✓ 自我进化工具已复制${NC}"
    echo ''
    echo '提示: FTS5索引将在首次运行时自动创建（也可手动: python3 ~/.openclaw/workspace/tools/fts5_search.py --rebuild）'
    echo ''

    echo '步骤 4b: 复制 ClawOS 工作流 (29个)...'
    mkdir -p ~/.openclaw/workspace/tools/workflows
    if [ -d "$SCRIPT_DIR/workflows" ]; then
        for wf in "$SCRIPT_DIR/workflows"/*/; do
            wf_name=$(basename "$wf")
            mkdir -p "~/.openclaw/workspace/tools/workflows/$wf_name"
            cp -n "$wf"*.py "~/.openclaw/workspace/tools/workflows/$wf_name/" 2>/dev/null || true
        done
        chmod +x ~/.openclaw/workspace/tools/workflows/*/run.py 2>/dev/null || true
        echo -e "${GREEN}✓ 已安装 29 个 ClawOS 工作流${NC}"
    else
        echo -e "${YELLOW}警告: 未找到 workflows 目录，跳过${NC}"
    fi
else
    echo -e "${YELLOW}警告: 未找到 tools 目录，跳过${NC}"
fi

echo ''
echo '步骤 5: 启用 Hook...'
if command -v openclaw &> /dev/null; then
    openclaw hooks enable self-improvement 2>/dev/null || echo -e "${YELLOW}注意: Hook 可能已经启用${NC}"
    echo -e "${GREEN}✓ Hook 启用完成${NC}"
fi

echo ''
echo '=========================================='
echo '安装验证'
echo '=========================================='
echo ''
echo '检查学习记录目录:'
ls ~/.openclaw/workspace/.learnings/ 2>/dev/null || echo '  (目录为空或不存在)'
echo ''
echo '检查 Hook 目录:'
ls ~/.openclaw/hooks/self-improvement/ 2>/dev/null || echo '  (目录为空或不存在)'
echo ''
echo '=========================================='
echo -e '${GREEN}安装完成！${NC}'
echo ''
echo '使用方法:'
echo '  1. 重启 OpenClaw Gateway: openclaw gateway restart'
echo '  2. 学习记录位置: ~/.openclaw/workspace/.learnings/'
echo '  3. 查看 Hook 状态: openclaw hooks list'
echo '  4. 搜索历史: python3 ~/.openclaw/workspace/tools/fts5_search.py "关键词"'
echo ''

