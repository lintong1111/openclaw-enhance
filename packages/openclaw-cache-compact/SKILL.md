# openclaw-cache-compact

OpenClaw 多级缓存 + AutoCompact 系统。用于优化 token 使用、提升 schema 查询效率、支持会话恢复与压缩。

## 架构

### 三级缓存

| 层级 | 类 | 用途 | 持久化 |
|------|-----|------|--------|
| L1 | `CompletionCache` | API response 缓存，避免重复请求 | 内存 |
| L2 | `ToolSchemaCache` | Zod schema 缓存，只解析一次 | 内存 |
| L3 | `ConversationRecovery` | 会话 checkpoint，支持恢复 | 磁盘 (JSON) |

### AutoCompact

将过长会话消息列表压缩到目标 token 数，保留系统消息，可选保留工具结果。

## API

### CompletionCache

```typescript
const cache = new CompletionCache({ maxSize: 200 })

cache.get(key)       // → string | null
cache.set(key, response, tokens)
cache.has(key)
cache.clear()
cache.size
cache.evictLRU()     // 手动触发 LRU 淘汰
```

### ToolSchemaCache

```typescript
const schemaCache = new ToolSchemaCache()

schemaCache.get(toolName)  // → z.ZodSchema | null
schemaCache.set(toolName, schema)
schemaCache.has(toolName)
schemaCache.clear()
```

### ConversationRecovery

```typescript
const recovery = new ConversationRecovery({ storagePath: './session-checkpoints' })

recovery.save(state)           // 保存 checkpoint
recovery.load(checkpointId)     // 加载 checkpoint
recovery.list()                // 列出所有 checkpoint
recovery.remove(checkpointId)
```

### compactSession

```typescript
const compacted = await compactSession(messages, {
  targetTokens: 4000,
  preserveSystem: true,
  preserveRecentMessages: 2,   // 保留最近 N 条
  preserveTools: true,         // 保留工具调用/结果
})
```

## 文件结构

```
openclaw-cache-compact/
├── SKILL.md
├── src/
│   ├── index.ts          # 入口，导出所有类
│   ├── completion-cache.ts
│   ├── tool-schema-cache.ts
│   ├── conversation-recovery.ts
│   ├── auto-compact.ts
│   └── types.ts
└── package.json
```
