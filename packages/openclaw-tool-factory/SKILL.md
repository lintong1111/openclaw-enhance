# OpenClaw Tool Factory Skill

## 概述

`openclaw-tool-factory` 提供 `buildTool()` 工厂模式，用于标准化 OpenClaw 工具的创建、注册和生命周期管理。

## 核心概念

### Tool 接口

所有工具必须实现 `Tool` 接口，定义工具的元数据和行为约束。

### 工厂模式 buildTool()

`buildTool()` 统一构建工具实例，自动注入默认值并强制关键标记（`isReadOnly`、`isConcurrencySafe`、`isDestructive`）。

## 类型定义

```typescript
// 工具定义（传入工厂的描述）
interface ToolDef {
  name: string
  description?: string
  execute: ToolExecute
  isEnabled?: () => boolean
  isConcurrencySafe?: () => boolean
  isReadOnly?: () => boolean
  isDestructive?: () => boolean
  checkPermissions?: () => PermissionResult
  toAutoClassifierInput?: () => string
  userFacingName?: () => string
}

// 构建后的工具实例
interface BuiltTool<D extends ToolDef> {
  name: string
  description?: string
  execute: ToolExecute
  isEnabled: () => boolean
  isConcurrencySafe: () => boolean
  isReadOnly: () => boolean
  isDestructive: () => boolean
  checkPermissions: () => PermissionResult
  toAutoClassifierInput: () => string
  userFacingName: () => string
}
```

## 关键标记（强制）

| 标记 | 默认值 | 说明 |
|------|--------|------|
| `isEnabled` | `() => true` | 工具是否启用 |
| `isConcurrencySafe` | `() => false` | 是否并发安全 |
| `isReadOnly` | `() => false` | 是否只读（不修改系统状态）|
| `isDestructive` | `() => false` | 是否为破坏性操作 |

## 权限检查

```typescript
interface PermissionResult {
  behavior: 'allow' | 'deny' | 'prompt'
  reason?: string
}
```

## 工具注册机制

### 全局注册表

`ToolRegistry` 提供工具的注册、查找、列举功能。

### 示例

```typescript
import { buildTool, ToolRegistry } from './tool-factory'

const registry = new ToolRegistry()

// 注册工具
registry.register('read', buildTool({
  name: 'read',
  description: '读取文件内容',
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  execute: async (params) => { /* ... */ },
}))

// 查找工具
const tool = registry.get('read')

// 列举所有工具
const allTools = registry.list()
```

## 使用方式

```typescript
import { buildTool, ToolRegistry } from 'openclaw-tool-factory'

// 1. 定义工具执行函数
const readTool = buildTool({
  name: 'read',
  description: '读取文件',
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  execute: async (params) => {
    return { success: true, content: 'file content' }
  },
})

// 2. 注册到全局注册表
ToolRegistry.getInstance().register('read', readTool)

// 3. 在 agent 中使用
const tool = ToolRegistry.getInstance().get('read')
if (tool.isEnabled() && tool.isReadOnly()) {
  await tool.execute(params)
}
```

## 文件结构

```
openclaw-tool-factory/
├── SKILL.md           # 本文档
├── tool-factory.ts    # 核心实现（buildTool + ToolRegistry）
└── index.ts           # 导出入口
```
