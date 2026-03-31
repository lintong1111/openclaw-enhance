#!/bin/bash
# OpenClaw 核心能力安装脚本 - 守护进程

set -e

echo "=========================================="
echo "OpenClaw 守护进程 - 安装脚本"
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "检查权限..."
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}注意: 需要 sudo 权限安装 systemd 服务${NC}"
    SUDO=sudo
else
    SUDO=
fi

echo ""
echo "步骤 1: 安装 systemd 服务..."
$SUDO cp "$SCRIPT_DIR/openclaw-gateway.service" /etc/systemd/system/
$SUDO systemctl daemon-reload
echo -e "${GREEN}✓ 服务文件已安装${NC}"

echo ""
echo "步骤 2: 启用开机自启..."
$SUDO systemctl enable openclaw-gateway
echo -e "${GREEN}✓ 开机自启已启用${NC}"

echo ""
echo "步骤 3: 启动服务..."
$SUDO systemctl start openclaw-gateway
sleep 2

echo ""
echo "步骤 4: 检查状态..."
$SUDO systemctl status openclaw-gateway --no-pager || true

echo ""
echo "=========================================="
echo -e "${GREEN}守护进程安装完成！${NC}"
echo "=========================================="
echo ""
echo "已配置："
echo "  ✅ systemd 服务已安装"
echo "  ✅ 开机自动启动"
echo "  ✅ 崩溃自动重启"
echo ""
echo "常用命令："
echo "  查看状态: systemctl status openclaw-gateway"
echo "  重启服务: sudo systemctl restart openclaw-gateway"
echo "  查看日志: journalctl -u openclaw-gateway -f"
echo "  停止服务: sudo systemctl stop openclaw-gateway"
