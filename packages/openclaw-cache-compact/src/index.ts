/**
 * openclaw-cache-compact
 * Multi-level caching + AutoCompact for OpenClaw.
 *
 * L1: CompletionCache   — API response cache (LRU, memory)
 * L2: ToolSchemaCache  — Zod schema cache (memory)
 * L3: ConversationRecovery — Session checkpoint (disk/JSON)
 * AutoCompact:         — Token-aware session compression
 */

export { CompletionCache, ToolSchemaCache, ConversationRecovery } from './caches.js'
export { compactSession, summarizeMessages } from './auto-compact.js'
export type {
  Message,
  ToolResult,
  TaskState,
  ConversationRecoveryState,
  CompactOptions,
  CacheOptions,
} from './types.js'
