---
name: openclaw-hook-system
displayName: OpenClaw Hook System
description: Enhanced Hook system for OpenClaw - intercept events, execute commands, prompts, or HTTP calls
allowed-tools:
  - exec
  - read
  - write
  - glob
when_to_use: |
  Use when you need to hook into OpenClaw events like PreToolUse, PostToolUse,
  SessionStart, SessionEnd, Stop, or PreToolUse_MCP to execute custom logic.
  Examples: 'log tool calls', 'validate inputs', 'send notifications', 
  'trigger webhooks', 'inject prompts', 'run cleanup scripts'
context: fork
argument-hint: "<hook-command> [arguments]"
aliases:
  - hook-register
  - hook-list
  - hook-trigger
  - hook-config
tags:
  - hooks
  - events
  - automation
  - interceptors
---

# OpenClaw Hook System

增强的 Hook 系统，用于拦截 OpenClaw 的各种事件并执行自定义逻辑。

## 核心类型

### HookEvent - 事件类型

```typescript
export type HookEvent = 
  | 'PreToolUse'      // 工具调用前
  | 'PostToolUse'     // 工具调用后
  | 'Stop'            // 停止时
  | 'SessionStart'    // 会话启动
  | 'SessionEnd'      // 会话结束
  | 'PreToolUse_MCP'  // MCP工具前
```

### HookSource - 优先级 (7级)

```typescript
const SOURCES = [
  'policySettings',   // 托管策略(最高)
  'userSettings',     // 用户设置
  'projectSettings',  // 项目设置
  'localSettings',    // 本地设置
  'pluginHook',       // 插件Hook
  'sessionHook',      // 会话Hook
  'builtinHook',      // 内置Hook(最低)
]
```

### HookCommand - 命令类型

```typescript
export type HookCommand = 
  | { type: 'command', command: string, shell?: string, if?: string }
  | { type: 'prompt', prompt: string, if?: string }
  | { type: 'agent', prompt: string, if?: string }
  | { type: 'http', url: string, if?: string }
```

## 核心 API

### getHooksForEvent(event: HookEvent): HookConfig[]

获取指定事件的所有 Hook，按优先级排序。

### matchCondition(condition: string, context: HookContext): boolean

判断条件是否匹配。

### executeHook(hook: HookConfig, context: HookContext): Promise<HookResult>

执行单个 Hook。

### loadHookConfig(path?: string): HookConfigStore

从文件加载 Hook 配置。

## Hook 配置结构

```yaml
# ~/.openclaw/hooks.yaml
version: "1.0"

hooks:
  PreToolUse:
    - name: "log-tool-call"
      source: "builtinHook"
      enabled: true
      commands:
        - type: "command"
          command: "echo 'Tool: {{tool.name}} Args: {{tool.args}}'"
          if: "tool.name == 'exec'"
        - type: "prompt"
          prompt: "Remember to validate shell commands before execution"
          if: "tool.name == 'exec'"

  SessionEnd:
    - name: "cleanup-session"
      source: "userSettings"
      enabled: true
      commands:
        - type: "http"
          url: "https://example.com/webhook"
          if: "session.duration > 300"
```

## 条件表达式 (if)

支持的条件变量：
- `tool.name` - 工具名称
- `tool.args` - 工具参数
- `session.id` - 会话ID
- `session.duration` - 会话持续时间(秒)
- `session.messages` - 消息数量
- `event.type` - 事件类型
- `context.channel` - 当前渠道
- `context.model` - 当前模型

支持的操作符：
- `==`, `!=`, `>`, `<`, `>=`, `<=`
- `&&`, `||`, `!`
- `startsWith()`, `endsWith()`, `contains()`

## 使用示例

### 注册 Hook

```javascript
const hookSystem = require('./hook-system.js');

// 注册一个 PreToolUse Hook
hookSystem.registerHook('PreToolUse', {
  name: 'validate-exec',
  source: 'userSettings',
  enabled: true,
  commands: [
    {
      type: 'command',
      command: 'echo "Validating: {{tool.name}}"',
      if: "tool.name == 'exec'"
    }
  ]
});
```

### 触发 Hook

```javascript
// 在工具调用前触发
const hooks = hookSystem.getHooksForEvent('PreToolUse');
for (const hook of hooks) {
  await hookSystem.executeHook(hook, {
    tool: { name: 'exec', args: ['ls'] },
    session: { id: '123', duration: 60 },
    event: { type: 'PreToolUse' }
  });
}
```

## 文件位置

- 主实现：`~/.openclaw/workspace/skills/openclaw-hook-system/hook-system.js`
- 配置文件：`~/.openclaw/hooks.yaml` (默认)
