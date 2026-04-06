# HEARTBEAT.md

心跳任务 — 由 OpenClaw 定时调度

## 说明

定时任务（如 AI 新闻、GitHub Trending 等）在 `~/.openclaw/cron/jobs.json` 中配置。
HEARTBEAT.md 只负责检查和监控，不直接定义 cron 任务。

如需添加/删除定时任务，请编辑 `~/.openclaw/cron/jobs.json`。
