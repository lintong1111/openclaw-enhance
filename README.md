# 🦞 OpenClaw Master

> OpenClaw 一站式增强包 — 一次安装，全部搞定  
> 包含自我进化 + 29 个 ClawOS 工作流 + 安全扫描，开机即用的贾维斯模式

---

## 🚀 一键安装

```bash
git clone https://github.com/lintong1111/openclaw-enhance.git
cd openclaw-enhance
chmod +x install.sh && ./install.sh
```

---

## 🧠 自我进化套件（v3.0）

源自 [xbrxr03/clawos](https://github.com/xbrxr03/clawos) + 自研工具

### 智能工具

| 工具 | 说明 |
|------|------|
| **FTS5 会话搜索** | SQLite FTS5 全文索引，毫秒级搜索历史对话 |
| **轻量自我复盘** | 每小时一句话反思，每天最多 5 条，自动淘汰旧条 |
| **经验卡片** | 自动从错误记录中生成经验卡，存入 EXPERIENCES.md |
| **Prompt 注入扫描器** | 实时检测 15 种提示词注入攻击（密码泄露/指令覆盖/命令注入等） |

### 🔐 Prompt 注入检测规则（部分）

| 级别 | 攻击类型 |
|------|---------|
| 🔴 | ignore previous instructions / 指令覆盖 |
| 🔴 | new instructions injection / 伪装新指令 |
| 🔴 | jailbreak: bypass safeguards / 绕过安全限制 |
| 🔴 | embedded password / API key / 硬编码凭证 |
| 🔴 | shell injection (`; | $ ( )`) |
| 🟡 | encoded payload (base64) / command substitution |

```bash
# 使用
python3 ~/.openclaw/workspace/tools/prompt_inject_scanner.py "ignore all previous instructions"
```

---

## ⚙️ 29 个 ClawOS 工作流

源自 [xbrxr03/clawos](https://github.com/xbrxr03/clawos) (AGPL-3.0)，独立 Python 脚本，无需 ClawOS 依赖

```bash
# 列出全部
python3 ~/.openclaw/workspace/tools/workflows/workflow.py

# 运行指定工作流
python3 ~/.openclaw/workspace/tools/workflows/workflow.py disk_report

# 直接运行
python3 ~/.openclaw/workspace/tools/workflows/disk_report/run.py
python3 ~/.openclaw/workspace/tools/workflows/port_scan/run.py localhost 1
```

### 🖥️ 系统管理

| 工作流 | 说明 |
|--------|------|
| `disk_report` | 磁盘使用分析，查找大文件，清理建议 |
| `process_report` | Top N 进程（CPU/内存排序） |
| `port_scan` | 扫描常见端口（SSH/HTTP/FastAPI 等 16 个端口） |

### 📁 文件整理

| 工作流 | 说明 |
|--------|------|
| `organize_downloads` | 按类型自动分类下载文件夹（图片/文档/代码/视频/音频） |
| `find_duplicates` | SHA256 内容哈希查重 |
| `clean_empty_dirs` | 递归删除空目录 |
| `bulk_rename` | 批量重命名（`--apply` 生效） |

### 📄 文档处理

| 工作流 | 说明 |
|--------|------|
| `summarize_pdf` | PDF 摘要（关键词 + 核心句子提取） |
| `pdf_to_notes` | PDF 全文提取保存为 .txt |
| `meeting_notes` | 生成结构化会议记录模板 |
| `proofread` | 语法/拼写/长句检查 |
| `write_readme` | 为项目自动生成 README.md |

### 📊 数据处理

| 工作流 | 说明 |
|--------|------|
| `csv_summary` | CSV 结构概览：列名/数值统计/示例行 |
| `sql_to_csv` | SQLite SQL 查询输出 CSV |
| `json_explorer` | JSON 文件 key.path 查询 |
| `extract_tables` | 从文本提取 Tab/CSV 表格 |

### 🔍 代码相关

| 工作流 | 说明 |
|--------|------|
| `pr_review` | Git diff 安全扫描（密码/API Key/TODO/长行） |
| `find_todos` | 扫描 TODO/FIXME/HACK 注释 |
| `repo_summary` | Git 仓库状态/分支/最近提交 |
| `batch_summarize` | 批量总结文件夹内所有文本文件 |

### 🗓️ 定时/自动化

| 工作流 | 说明 |
|--------|------|
| `daily_digest` | 每日摘要：记忆/cron/Git/磁盘/系统负载 |
| `log_summarize` | 日志分析：错误/警告计数 |
| `backup_check` | 扫描 .bak 备份文件 |
| `merge_pdfs` | 合并多个 PDF |

---

## 🏗️ 架构

```
OpenClaw Master
├── openclaw-self-improvement/    自我进化
│   ├── tools/
│   │   ├── fts5_search.py        FTS5 全文搜索
│   │   ├── lightweight_reflection.py  轻量复盘
│   │   ├── experience_card.py    经验卡生成
│   │   └── prompt_inject_scanner.py  安全扫描
│   ├── workflows/               29 个 ClawOS 工作流
│   ├── hooks/                   Hook 提醒系统
│   └── .learnings/              学习记录存储
├── openclaw-enhance/            核心增强包（5大模块）
├── openclaw-workspace/          Workspace 配置模板
└── openclaw-voice-wake/          语音唤醒（待实现）
```

---

## 📁 工作区文件

| 文件 | 说明 |
|------|------|
| `SOUL.md` | 贾维斯灵魂配置 |
| `USER.md` | 用户画像 |
| `AGENTS.md` | 多智能体调度 |
| `HEARTBEAT.md` | 后台任务监控 |
| `MEMORY.md` | 长期记忆 |
| `.learnings/` | 学习记录（ERRORS/LEARNINGS/EXPERIENCES） |

---

## 📄 许可证

MIT + AGPL-3.0 (ClawOS 工作流部分)
