# ClawOS 工作流说明

> 来源：xbrxr03/clawos (AGPL-3.0)  
> 整理：openclaw-enhance  
> 版本：v3.0 | 29 个工作流

---

## 快速开始

```bash
# 列出所有工作流
python3 ~/.openclaw/workspace/tools/workflows/workflow.py

# 运行指定工作流
python3 ~/.openclaw/workspace/tools/workflows/workflow.py disk_report
python3 ~/.openclaw/workspace/tools/workflows/disk_report/run.py

# 带参数运行
python3 ~/.openclaw/workspace/tools/workflows/organize_downloads/run.py --dry-run
python3 ~/.openclaw/workspace/tools/workflows/summarize_pdf/run.py /path/to/file.pdf
python3 ~/.openclaw/workspace/tools/workflows/port_scan/run.py localhost 0.5
```

---

## 工作流清单（29个）

### 🖥️ 系统管理

| 工作流 | 说明 | 示例 |
|--------|------|------|
| `disk_report` | 磁盘使用分析，查找大文件，清理建议 | `python3 run.py` |
| `process_report` | Top N 进程（CPU/内存排序） | `python3 run.py 15` |
| `port_scan` | 扫描常见端口（22/SSH, 3000/Node, 8000/FastAPI 等） | `python3 run.py localhost 1` |

### 📁 文件整理

| 工作流 | 说明 | 示例 |
|--------|------|------|
| `organize_downloads` | 按类型自动分类下载文件夹（图片/文档/代码/视频/音频/压缩） | `python3 run.py --dry-run` |
| `find_duplicates` | SHA256 内容哈希查重，显示浪费空间 | `python3 run.py` |
| `clean_empty_dirs` | 递归删除空目录 | `python3 run.py` |
| `bulk_rename` | 批量重命名（预览模式，需加 `--apply` 才执行） | `python3 run.py . "IMG_" "Photo_" --apply` |
| `folder_summary` | 文件夹概览：关键词/类型/大小统计 | `python3 run.py /path/to/folder` |

### 📄 文档处理

| 工作流 | 说明 | 示例 |
|--------|------|------|
| `summarize_pdf` | PDF 摘要（关键词 + 核心句子提取） | `python3 run.py doc.pdf` |
| `pdf_to_notes` | PDF 全文提取保存为 .txt | `python3 run.py doc.pdf` |
| `meeting_notes` | 生成结构化会议记录模板 | `python3 run.py "项目评审会议"` |
| `proofread` | 语法/拼写/长句检查 | `python3 run.py note.md` |
| `rewrite` | 文本清理（双空格/末尾空格）并保存为 `_rewritten` | `python3 run.py note.md` |
| `write_readme` | 为项目文件夹自动生成 README.md | `python3 run.py /path/to/project` |

### 📊 数据处理

| 工作流 | 说明 | 示例 |
|--------|------|------|
| `csv_summary` | CSV 结构概览：列名/数值统计/前3行示例 | `python3 run.py data.csv` |
| `sql_to_csv` | 对 SQLite 数据库执行 SQL，输出 CSV | `python3 run.py db.sqlite "SELECT * FROM users" output.csv` |
| `json_explorer` | JSON 文件查询（支持 key.path 语法） | `python3 run.py data.json root.child.field` |
| `extract_tables` | 从文本文件中提取 Tab/Comma 分隔的表格 | `python3 run.py data.txt` |

### 🔍 代码相关

| 工作流 | 说明 | 示例 |
|--------|------|------|
| `pr_review` | Git diff 安全扫描（密码/API Key/长行/TODO） | `python3 run.py`（在 git 仓库中） |
| `find_todos` | 扫描源码中的 TODO/FIXME/HACK/XXX 注释 | `python3 run.py /path/to/src` |
| `repo_summary` | Git 仓库状态/分支/最近提交 | `python3 run.py` |
| `batch_summarize` | 批量总结文件夹内所有 .txt/.md/.py/.json/.yaml 文件 | `python3 run.py /path` |
| `changelog` | 解析 CHANGELOG.md 输出最近变更记录 | `python3 run.py CHANGELOG.md` |

### 🗓️ 定时/自动化

| 工作流 | 说明 | 示例 |
|--------|------|------|
| `daily_digest` | 每日摘要：最近记忆/ cron 报告/ Git 状态/ 磁盘/ 系统负载 | `python3 run.py` |
| `log_summarize` | 日志分析：错误/警告计数/模式提取 | `python3 run.py app.log` |
| `backup_check` | 扫描 .bak 备份文件 | `python3 run.py /path` |
| `caption_images` | 基于文件名生成图片描述性标题 | `python3 run.py /path/to/images` |
| `merge_pdfs` | 合并多个 PDF 为一个文件 | `python3 run.py file1.pdf file2.pdf` |

---

## 安全工具

### 🔐 Prompt 注入检测

检测提示词注入攻击（基于 ClawOS nexus/scanner.py 规则）。

```bash
# 扫描文本
python3 ~/.openclaw/workspace/tools/prompt_inject_scanner.py "ignore all previous instructions"

# 扫描文件
python3 ~/.openclaw/workspace/tools/prompt_inject_scanner.py --file message.txt

# 管道输入
echo "please forget your instructions" | python3 prompt_inject_scanner.py
```

**检测的攻击类型：**
- 🔴 `ignore previous instructions` — 指令覆盖
- 🔴 `new instructions injection` — 伪装新指令
- 🔴 `jailbreak: bypass safeguards` — 绕过安全限制
- 🔴 `embedded password/api_key` — 硬编码凭证
- 🔴 `shell injection` — Shell 命令注入
- 🟡 `encoded payload` — Base64 编码Payload
- 🟡 `command substitution` — 命令替换 `$()`

---

## 贡献工作流

新增工作流只需在 `workflows/<name>/run.py` 中创建：

```python
#!/usr/bin/env python3
"""my-workflow: 一句话描述"""
import sys

def main():
    print("Hello from my workflow!")

if __name__ == "__main__":
    main()
```

放在 `workflows/` 下即可通过 `workflow.py` 自动发现。