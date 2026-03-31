# OpenClaw Enhance

OpenClaw 功能增强包，参考 Claude Code 源码设计。

## 🚀 一键安装

```bash
git clone https://github.com/lintong1111/openclaw-enhance.git
cd openclaw-enhance
./install.sh
```

## 🔄 一键更新

```bash
cd openclaw-enhance
./update.sh
```

## 📦 模块列表

### 高级功能模块 (advanced/)

| 模块 | 说明 | 状态 |
|------|------|------|
| `token-budget/` | Token 预算管理 | ✅ |
| `graceful-shutdown/` | 优雅关闭 | ✅ |
| `in-process-teammate/` | 进程内协作 | ✅ |
| `memory-tiers/` | 多层记忆 | ✅ |
| `read-only-agents/` | 只读Agent | ✅ |

### 核心能力 (core-modes/)

| 模块 | 说明 | 状态 |
|------|------|------|
| `memory/` | 长期记忆机制 | ✅ |
| `jarvis/` | 贾维斯主动模式 | ✅ |
| `daemon/` | 后台守护进程 | ✅ |

### 其他模块

| 模块 | 说明 | 状态 |
|------|------|------|
| `autocompact/` | 上下文压缩 | ✅ |
| `team-task/` | 多Agent协作 | ✅ |
| `mcp/` | MCP服务器 | ✅ |
| `skills/` | Skill增强格式 | ✅ |
| `self-improvement/` | 自我进化 | ✅ |

## 📖 使用方法

### 高级模块安装

```bash
# 单独安装某个模块
cd advanced/token-budget
./install.sh

# 或使用总安装脚本（安装所有高级模块）
./install.sh
```

### 代码引用

```javascript
// Token Budget
const { TokenBudget } = require('~/.openclaw/workspace/services/token-budget/tokenBudget')

// Graceful Shutdown
const { ShutdownManager } = require('~/.openclaw/workspace/services/graceful-shutdown/shutdownManager')

// In-Process Teammate
const { MessageBus } = require('~/.openclaw/workspace/services/in-process-teammate/inProcessTeammate')

// Memory Tiers
const { MemoryManager } = require('~/.openclaw/workspace/services/memory-tiers/memoryTiers')

// Read-Only Agents
const { createReadOnlyAgent } = require('~/.openclaw/workspace/services/read-only-agents/readOnlyTools')
```

## 📝 各模块说明

### Token Budget
防止任务无限消耗 Token，支持三级预算（Turn/Task/Session）。

### Graceful Shutdown
优雅关闭，比 kill 更安全，支持状态保存和资源清理。

### In-Process Teammate
进程内 Teammate，通信更快，支持消息队列和事件驱动。

### Memory Tiers
多层记忆系统（Session/Team/Agent/Persistent）。

### Read-Only Agents
只读 Agent，用于调研和分析，防止误操作。

## 更新日志

- **v2** (2026-03-31): 添加一键安装/更新脚本，各模块独立安装脚本
- **v1** (2026-03-31): 初始版本，5个高级模块 + 核心能力配置

## License

MIT
