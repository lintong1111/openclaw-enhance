# Read-Only Agent

只读 Agent，专门用于调研、分析、搜索任务，不能写文件。

## 问题

当前 Agent 都是全功能，容易误操作：
- 调研时不小心修改了代码
- 分析时创建了临时文件
- 搜索时被期望只能看

## 解决方案

定义两种 Agent 类型：

| 类型 | 工具权限 | 用途 |
|------|---------|------|
| `general-purpose` | 全部 | 写代码、执行命令 |
| `read-only` | 只读 | 调研、分析、搜索 |

## 实现

### Agent 定义

```javascript
// readOnlyAgent.js
const READ_ONLY_AGENT = {
  name: 'read-only',
  type: 'read-only',
  description: '只读调研 Agent，用于搜索和分析',
  tools: {
    allowed: ['read', 'glob', 'grep', 'bash-readonly'],
    denied: ['write', 'edit', 'exec', 'delete']
  }
}
```

### 只读工具集

```javascript
const READ_ONLY_TOOLS = [
  'read',      // 读取文件
  'glob',      // 文件搜索
  'grep',      // 内容搜索
  'bash-readonly'  // 只读命令（ls, git status, git log, find, cat）
]
```

### 权限检查

```javascript
function checkReadOnlyPermission(toolName) {
  if (READ_ONLY_TOOLS.includes(toolName)) {
    return { allowed: true }
  }
  return { 
    allowed: false, 
    reason: 'Read-only agent cannot use: ' + toolName 
  }
}
```

### 只读 Bash 命令白名单

```javascript
const ALLOWED_BASH_COMMANDS = [
  'ls', 'la', 'll',
  'git status', 'git log', 'git diff', 'git show',
  'find', 'grep', 'cat', 'head', 'tail', 'wc',
  'pwd', 'cd', 'tree',
  'du', 'df', 'free'
]
```

## 使用方式

```
用户: "帮我分析一下这个代码库"
→ 调用 read-only agent
→ 只能搜索和读文件
→ 不能写任何东西

用户: "帮我找一下 API 相关的文件"
→ 调用 explore agent
→ 搜索匹配的文件
→ 报告结果
```

## 安装

自动包含在 `openclaw-enhance` 主安装中。

---

参考：Claude Code 的 `Explore Agent` 和 `Plan Agent` 都是只读的。
