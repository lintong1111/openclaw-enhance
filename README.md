# OpenClaw Enhance

OpenClaw 功能增强包，参考 Claude Code 源码设计。

## 功能模块

### 1. AutoCompact（上下文压缩）
**位置：** `autocompact/`

对话历史自动压缩，节省 token 使用量。

```javascript
const { createAutoCompact } = require('./autocompact/autoCompact');

const autoCompact = createAutoCompact({
  autoCompact: true,
  preserveRecentMessages: 6
});

// 每次 turn 结束时调用
const result = await autoCompact.checkAndCompact(messages, { sessionId });
```

**阈值：**
- 8000 tokens → 自动压缩
- 12000 tokens → 警告
- 15000 tokens → 需手动压缩

---

### 2. Team/Task 协作系统
**位置：** `team-task/`

多 Agent 协作，支持团队创建、任务分配、消息通信。

```javascript
const { TeamManager, TaskManager, MessageBus } = require('./team-task');

// 创建团队
const team = TeamManager.create('project-alpha', 'Building feature X');

// 添加成员
TeamManager.addMember('project-alpha', 'backend-dev', 'general-purpose');

// 创建任务
TaskManager.create('Implement login API', 'project-alpha', 'backend-dev');

// 发送消息
MessageBus.send('backend-dev', 'Login API 完成了');
```

---

### 3. MCP（Model Context Protocol）集成
**位置：** `mcp/`

将 OpenClaw 作为 MCP Host，暴露工具给外部 MCP Client。

```bash
# 启动 MCP Server
node mcp/server.js
```

**可用工具：** exec, read, write, glob, grep

---

### 4. Skills 增强
**位置：** `skills/`

增强的 Skill 格式，支持更多字段：

```yaml
---
name: skill-name
description: 一句话描述
allowed-tools:         # 工具权限
  - web_search
  - Bash(curl:*)
when_to_use: |         # 自动触发条件
  Use when user wants to search.
  Examples: 'look up X', 'search for Y'
context: fork          # inline 或 fork
argument-hint: "<query>"
aliases:               # 别名
  - search
  - find
---
```

---

## 安装

```bash
# 克隆仓库
git clone https://github.com/lintong1111/openclaw-enhance.git
cd openclaw-enhance

# 查看各模块详细说明
cat <module>/README.md
```

---

## 模块说明

| 模块 | 说明 | 状态 |
|------|------|------|
| `autocompact/` | 上下文自动压缩 | ✅ 就绪 |
| `team-task/` | 多 Agent 协作 | ✅ 就绪 |
| `mcp/` | MCP 服务器 | ✅ 就绪 |
| `skills/` | Skill 增强格式 | ✅ 就绪 |

---

## 参考

- Claude Code 源码泄露分析
- OpenClaw 官方文档

## License

MIT
