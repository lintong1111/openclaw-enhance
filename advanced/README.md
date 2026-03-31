# OpenClaw Advanced Features

高级功能模块，参考 Claude Code 源码设计。

## 模块列表

| 模块 | 说明 | 参考 |
|------|------|------|
| `read-only-agents/` | 只读 Agent | Claude Code Explore/Plan Agent |
| `in-process-teammate/` | 进程内 Teammate | Claude Code in_process_teammate |
| `graceful-shutdown/` | 优雅关闭 | Claude Code shutdown_request |
| `token-budget/` | Token 预算 | Claude Code task_budget |
| `memory-tiers/` | 多层记忆 | Claude Code SessionMemory/TeamMemory |

## 一键安装全部

```bash
cd advanced
for dir in */; do
  echo "安装 $dir..."
done
```

## 模块说明

### Read-Only Agent

只读 Agent，用于调研和分析任务：
- 不能写文件
- 只能搜索和读文件
- 防止误操作

### In-Process Teammate

进程内 Teammate，通信更快：
- 不需要跨进程通信
- 直接函数调用
- 适合快速协作

### Graceful Shutdown

优雅关闭，比 kill 更安全：
- 保存状态
- 清理资源
- 确认后退出

### Token Budget

Token 预算管理：
- 防止任务无限消耗
- 警告机制
- 超时自动停止

### Memory Tiers

多层记忆系统：
- Session Memory（会话）
- Team Memory（团队）
- Agent Memory（私有）
- Persistent Memory（永久）

---

参考：Claude Code 源码泄露分析
