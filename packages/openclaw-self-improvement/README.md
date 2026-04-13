# OpenClaw 自我进化模块

> 参考 Claude Code 泄露源码设计的自我学习能力

## 功能

- ✅ **自动记忆** — 记录用户偏好、习惯
- ✅ **错误追踪** — 自动记录失败和错误
- ✅ **教训记录** — 记录学习到的经验教训
- ✅ **功能需求追踪** — 记录想要但未实现的功能
- ✅ **Hook 自动提醒** — 每次启动时自动提醒反思
- ✅ **智能上下文注入** — 注入最近的 learnings 到 bootstrap 上下文

## 文件结构

```
openclaw-self-improvement/
├── .learnings/
│   ├── LEARNINGS.md       # 学到的教训
│   ├── ERRORS.md          # 错误记录
│   └── FEATURE_REQUESTS.md # 想要的功能
├── hooks/
│   └── self-improvement/
│       ├── HOOK.md        # Hook 定义
│       └── handler.ts     # Hook 处理逻辑
└── skills/
    └── skillify/         # Skill 生成器
```

## 新增工具（v2.0）

### 🔍 FTS5 会话搜索 (`fts5_search.py`)
全文索引搜索历史对话，毫秒级响应。
```bash
python3 ~/.openclaw/workspace/tools/fts5_search.py "cron task" 3
```

### 💭 轻量自我复盘 (`lightweight_reflection.py`)
每次心跳自动记录一句话反思，每天最多 5 条。
```bash
python3 ~/.openclaw/workspace/tools/lightweight_reflection.py "FTS5 search built"
```

### 📋 经验卡片 (`experience_card.py`)
自动从错误记录中生成经验卡，存入 EXPERIENCES.md。
```bash
python3 ~/.openclaw/workspace/tools/experience_card.py "Fixed b2b-site bug"
```

## 新增工具（v2.0）

### 🔍 FTS5 会话搜索 (`fts5_search.py`)
全文索引搜索历史对话，毫秒级响应。
```bash
python3 ~/.openclaw/workspace/tools/fts5_search.py "cron task" 3
```

### 💭 轻量自我复盘 (`lightweight_reflection.py`)
每次心跳自动记录一句话反思，每天最多 5 条。
```bash
python3 ~/.openclaw/workspace/tools/lightweight_reflection.py "FTS5 search built"
```

### 📋 经验卡片 (`experience_card.py`)
自动从错误记录中生成经验卡，存入 EXPERIENCES.md。
```bash
python3 ~/.openclaw/workspace/tools/experience_card.py "Fixed b2b-site bug"
```

### 🔐 Prompt 注入扫描器 (`prompt_inject_scanner.py`)
检测恶意提示词注入攻击（基于 ClawOS nexus/scanner.py 规则）。
```bash
python3 ~/.openclaw/workspace/tools/prompt_inject_scanner.py "ignore all previous instructions"
```

## 新增工作流（v3.0 — 29个 ClawOS 工作流）

源自 xbrxr03/clawos 项目，可独立运行：

| 分类 | 工作流 |
|------|--------|
| 🖥️ 系统 | `disk_report` `process_report` `port_scan` |
| 📁 文件 | `organize_downloads` `find_duplicates` `clean_empty_dirs` `bulk_rename` `folder_summary` |
| 📄 文档 | `summarize_pdf` `pdf_to_notes` `meeting_notes` `proofread` `rewrite` `write_readme` |
| 📊 数据 | `csv_summary` `sql_to_csv` `json_explorer` `extract_tables` |
| 🔍 代码 | `pr_review` `find_todos` `repo_summary` `batch_summarize` `changelog` |
| 🗓️ 定时 | `daily_digest` `log_summarize` `backup_check` `caption_images` `merge_pdfs` |

**统一入口：**
```bash
python3 ~/.openclaw/workspace/tools/workflows/workflow.py              # 列出全部
python3 ~/.openclaw/workspace/tools/workflows/workflow.py disk_report # 运行指定
python3 ~/.openclaw/workspace/tools/workflows/disk_report/run.py     # 直接运行
```

## 安装

```bash
# 复制到 OpenClaw 工作目录
cp -r .learnings ~/.openclaw/workspace/
cp -r hooks ~/.openclaw/hooks/self-improvement
cp -r skills ~/.openclaw/workspace/skills/skillify
cp -r tools ~/.openclaw/workspace/tools/          # 含 FTS5/复盘/经验卡/扫描器
cp -r workflows ~/.openclaw/workspace/tools/    # 29个工作流
```
