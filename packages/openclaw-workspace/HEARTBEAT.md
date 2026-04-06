# HEARTBEAT.md

## 定时任务监控

### 1. 检查 GitHub 文件变化（有 cron 任务写文件）
- 文件: ~/.openclaw/workspace/data/cron/github_latest.md
- 如果文件 mtime > lastSent.github → 推送飞书

### 2. AI/LLM 新闻搜索（HEARTBEAT 直接执行）
每2小时（与 cron 同步）执行一次：
1. 用 web_search 搜索最新 AI 新闻（24小时内）
2. 生成简报
3. 推送飞书
4. 记录 lastSent.ainews

### 推送函数
用 curl 调用飞书 API，每次推送前刷新 tenant_access_token。
