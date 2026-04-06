# LEARNINGS.md - 记录学习到的教训和改进

## 格式说明
- 每次学到新东西就添加条目
- 优先记录，稍后整理
- 重要的-promote 到 MEMORY.md

---

## 2026-03-31 tool-gotcha: ClawHub 网站访问

**问题：** clawhub.ai 网站直接访问被解析为 private/internal IP，web_fetch 被阻止
**原因：** 网站部署在私有网络/内网定向
**解决：** 使用 `clawhub` CLI 代替网页搜索，功能完整（search/inspect/install 都支持）
**Pattern:** 网站blocked时，优先找 CLI 工具

---

## 2026-03-31 tool-gotcha: ClawHub slug 搜索失败

**问题：** 用户给 `https://clawhub.ai/pskoett/self-improving-agent` 链接，直接 inspect 报错 Skill not found
**原因：** slug 是 `self-improving-agent`（不是 `pskoett/self-improving-agent`），但 registry 里实际叫 `self-improving`
**解决：** 先用 `clawhub search` 定位实际 slug，再用 `clawhub inspect <slug>`
**Pattern:** 链接里的路径格式 ≠ registry slug，需要 search 中转

---

## 2026-03-30 knowledge-gap: Cron 任务与 session 绑定

**问题：** 之前配置的 cron 任务跟 session 绑定，session reset 后丢失
**解决：** 使用持久化 cron 存储，不依赖 session
**Pattern:** 所有持久化任务要用独立存储，不能依赖运行时 session

---

## 2026-03-30 integration: 飞书 WebSocket 断线

**问题：** 飞书 WebSocket 长连接断线后 gateway 无法重连
**解决：** 需要 `openclaw gateway restart` 重启 gateway 才能恢复
**Pattern:** 飞书连接问题 → 重启 gateway

---

## 2026-03-23 user-behavior: 用户说话风格

**特征：** 简洁直接，不废话
**例子：** "算了，没事" = 暂时不需要 | 问完"可以吗"就去做
**Pattern:** 短句优先，执行力强，不要过度解释

---

## 2026-03-23 best-practice: 机器迁移

**教训：** 迁移机器时要备份整个 `~/.openclaw/` 目录
**包括：** 配置、skills、hooks、workspace、MEMORY.md
**Pattern:** 迁移 = 备份整个 openclaw 目录树
