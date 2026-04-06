# ERRORS.md - 记录错误和失败

## 格式说明
- 每次出错就记录
- 包含错误信息、上下文、修复建议

---

## 2026-03-30 feishu-websocket: 飞书长连接断线无法自愈

**错误信息：** 飞书 WebSocket 断开后 gateway 无法自动重连
**影响：** 飞书消息通道中断
**修复：** `openclaw gateway restart`
**预防：** 监控连接状态，异常时自动 restart
**Pattern:** 飞书断线 → 重启 gateway
