# OpenClaw Enhance System

整合 5 大核心模块的 OpenClaw 增强系统，提供统一的工具工厂、Feature Flag、缓存、Skill 和 Hook 管理。

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClawEnhance (集成器)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ToolFactory  │  │FeatureFlag   │  │   HookSystem │      │
│  │  工具工厂     │  │  功能开关     │  │   事件拦截    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │    Cache     │  │    Skill     │                        │
│  │  多级缓存    │  │   技能系统    │                        │
│  └──────────────┘  └──────────────┘                        │
│                        │                                   │
│                 ┌──────────────┐                           │
│                 │  AutoCompact │                           │
│                 │   会话压缩    │                           │
│                 └──────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## 5 个源模块

| 模块 | 路径 | 功能 |
|------|------|------|
| ToolFactory | `openclaw-tool-factory/` | buildTool 工厂、ToolRegistry |
| FeatureFlag | `openclaw-feature-flag/` | 功能开关、灰度发布、环境变量覆盖 |
| CacheCompact | `openclaw-cache-compact/` | L1/L2/L3 缓存 + AutoCompact |
| SkillSystem | `openclaw-skill-system/` | Markdown+YAML 技能定义与执行 |
| HookSystem | `openclaw-hook-system/` | PreToolUse/PostToolUse 等事件拦截 |

## 核心类：OpenClawEnhance

```typescript
import { OpenClawEnhance } from './integrator'

const enhance = new OpenClawEnhance()

// 初始化所有模块
await enhance.init()

// 注册工具（带 Feature Flag）
enhance.registerTool({
  name: 'myTool',
  description: '我的工具',
  execute: async (params) => { /* ... */ }
}, { featureFlag: 'MY_TOOL_V2' })

// 触发 PreToolUse Hook
await enhance.triggerPreToolUse({ name: 'read', args: { path: '/a' } })

// 执行工具
const result = await enhance.executeTool('myTool', params)

// 触发 PostToolUse Hook
await enhance.triggerPostToolUse({ name: 'read' }, result)

// 加载所有 Skills
await enhance.loadSkills()

// 执行 Skill
const skillResult = await enhance.executeSkill('my-skill', { arg1: 'val' })

// 获取缓存
const cache = enhance.getCache('completion')

// 压缩会话
const compacted = await enhance.compactSession(4000)

// 检查 Feature Flag
if (enhance.isEnabled('MY_TOOL_V2')) {
  // ...
}
```

## Feature Flag 控制

| Flag | 默认 | 说明 |
|------|------|------|
| `ENHANCE_SYSTEM` | false | 整个增强系统 |
| `TOOL_FACTORY` | false | 工具工厂 |
| `FEATURE_FLAG` | false | Feature Flag 系统 |
| `HOOK_SYSTEM` | false | Hook 系统 |
| `CACHE_SYSTEM` | false | 缓存系统 |
| `AUTO_COMPACT` | false | 自动压缩 |
| `SKILL_SYSTEM` | false | Skill 系统 |

## Hook 事件

- `PreToolUse` - 工具调用前
- `PostToolUse` - 工具调用后
- `SessionStart` - 会话启动
- `SessionEnd` - 会话结束
- `Stop` - 停止时
- `PreToolUse_MCP` - MCP 工具前

## 缓存层级

| 层级 | 类 | 说明 | 持久化 |
|------|-----|------|--------|
| L1 | CompletionCache | API 响应缓存 | 内存 |
| L2 | ToolSchemaCache | Zod Schema 缓存 | 内存 |
| L3 | ConversationRecovery | 会话检查点 | 磁盘 |

## 文件结构

```
openclaw-enhance/
├── SKILL.md           # 本文档
├── index.ts           # 统一导出
├── integrator.ts     # 核心集成逻辑
├── package.json       # 依赖管理
└── example.ts        # 使用示例
```

## 环境变量

```bash
OPENCLAW_FLAG_ENHANCE_SYSTEM=true
OPENCLAW_FLAG_TOOL_FACTORY=true
OPENCLAW_FLAG_HOOK_SYSTEM=true
OPENCLAW_FLAG_CACHE_SYSTEM=true
OPENCLAW_FLAG_AUTO_COMPACT=true
OPENCLAW_FLAG_SKILL_SYSTEM=true
```
