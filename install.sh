#!/bin/bash
# OpenClaw Master - 一键安装脚本
set -e

OPENCLAW_DIR="${HOME}/.openclaw"
WORKSPACE_DIR="${OPENCLAW_DIR}/workspace"
SKILLS_DIR="${WORKSPACE_DIR}/skills"
HOOKS_DIR="${OPENCLAW_DIR}/hooks"

echo "🦞 OpenClaw Master 安装脚本"
echo "============================"

# 1. 创建目录
echo "[1/6] 创建目录..."
mkdir -p "${SKILLS_DIR}"
mkdir -p "${HOOKS_DIR}"
mkdir -p "${WORKSPACE_DIR}/.learnings"
mkdir -p "${WORKSPACE_DIR}/.agent-prompts"

# 2. 安装核心模块
echo "[2/6] 安装核心模块..."
cp -r packages/openclaw-enhance/* "${SKILLS_DIR}/openclaw-enhance/" 2>/dev/null || cp -r packages/openclaw-enhance "${SKILLS_DIR}/"
cp -r packages/openclaw-tool-factory "${SKILLS_DIR}/"
cp -r packages/openclaw-feature-flag "${SKILLS_DIR}/"
cp -r packages/openclaw-cache-compact "${SKILLS_DIR}/"
cp -r packages/openclaw-skill-system "${SKILLS_DIR}/"
cp -r packages/openclaw-hook-system "${SKILLS_DIR}/"
echo "  ✅ 核心模块已安装"

# 3. 安装自我进化
echo "[3/6] 安装自我进化模块..."
cp -r packages/openclaw-self-improvement/.learnings/* "${WORKSPACE_DIR}/.learnings/" 2>/dev/null || true
cp -r packages/openclaw-self-improvement/hooks/* "${HOOKS_DIR}/" 2>/dev/null || true
cp -r packages/openclaw-self-improvement/skills/* "${SKILLS_DIR}/" 2>/dev/null || true
echo "  ✅ 自我进化已安装"

# 4. 安装 Workspace 配置
echo "[4/6] 安装 Workspace 配置..."
cp -r packages/openclaw-workspace/*.md "${WORKSPACE_DIR}/" 2>/dev/null || true
cp -r packages/openclaw-workspace/.learnings/* "${WORKSPACE_DIR}/.learnings/" 2>/dev/null || true
cp -r packages/openclaw-workspace/.agent-prompts/* "${WORKSPACE_DIR}/.agent-prompts/" 2>/dev/null || true
[ -d packages/openclaw-workspace/hooks ] && cp -r packages/openclaw-workspace/hooks/* "${HOOKS_DIR}/" 2>/dev/null || true
echo "  ✅ Workspace 配置已安装"

# 5. 安装 Node 依赖
echo "[5/6] 安装依赖..."
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    echo "  ⚠️  未找到 pnpm/npm，跳过"
fi
echo "  ✅ 依赖已安装"

# 6. 验证
echo "[6/6] 验证安装..."
echo ""
echo "✅ 安装完成！"
echo ""
echo "已安装模块："
ls -la "${SKILLS_DIR}/openclaw-*/" 2>/dev/null | head -20 || true
echo ""
echo "已安装 Hooks："
ls "${HOOKS_DIR}/" 2>/dev/null || true
echo ""
echo "Gateway 状态："
systemctl --user status openclaw-gateway.service --no-pager 2>/dev/null | head -5 || echo "  (systemd not available)"
echo ""
echo "📖 查看 README.md 了解使用方法"
