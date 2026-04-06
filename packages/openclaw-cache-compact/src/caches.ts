import type { Message, ToolResult, TaskState, ConversationRecoveryState } from './types.js'

/**
 * LRU Cache entry with access tracking
 */
interface LRUCacheEntry<V> {
  value: V
  lastAccessed: number
  createdAt: number
}

/**
 * L1: CompletionCache — API response cache with LRU eviction
 *
 * Caches full API responses keyed by a composite hash of (model+messages).
 * Tracks token count per entry for cost estimation.
 */
export class CompletionCache {
  private cache = new Map<string, LRUCacheEntry<{ response: string; tokens: number }>>()
  public readonly maxSize: number
  private readonly ttlMs?: number

  constructor(options: { maxSize?: number; ttlMs?: number } = {}) {
    this.maxSize = options.maxSize ?? 200
    this.ttlMs = options.ttlMs
  }

  /**
   * Generate a cache key from model + user/assistant message content.
   * System messages are excluded from the key to improve cache hit rate.
   */
  static keyFor(model: string, messages: Pick<Message, 'role' | 'content'>[]): string {
    const relevant = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => `${m.role}:${m.content}`)
      .join('\x00')
    return `${model}::${relevant}`
  }

  get(key: string): string | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // TTL check
    if (this.ttlMs && Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key)
      return null
    }

    // Update LRU access time
    entry.lastAccessed = Date.now()
    return entry.value.response
  }

  set(key: string, response: string, tokens: number): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      value: { response, tokens },
      lastAccessed: Date.now(),
      createdAt: Date.now(),
    })
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (this.ttlMs && Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }

  /** Remove the least-recently-used entry. */
  evictLRU(): void {
    let oldest: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldest = key
      }
    }

    if (oldest) this.cache.delete(oldest)
  }

  /** Return cache entries sorted by token weight (for stats). */
  getStats(): { size: number; hits: number; totalTokens: number } {
    let totalTokens = 0
    for (const entry of this.cache.values()) {
      totalTokens += entry.value.tokens
    }
    return { size: this.cache.size, hits: 0, totalTokens }
  }
}

/**
 * L2: ToolSchemaCache — caches parsed Zod schemas per tool name.
 *
 * Tools often reuse the same schema across many requests. Parsing Zod
 * schemas is relatively expensive; this cache ensures it happens once.
 */
export class ToolSchemaCache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache = new Map<string, import('zod').ZodSchema<any>>()

  get(toolName: string): import('zod').ZodSchema | null {
    return this.cache.get(toolName) ?? null
  }

  set(toolName: string, schema: import('zod').ZodSchema): void {
    this.cache.set(toolName, schema)
  }

  has(toolName: string): boolean {
    return this.cache.has(toolName)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

/**
 * L3: ConversationRecovery — checkpoint-based session recovery.
 *
 * Saves full session state to disk as JSON so it can be recovered after
 * a crash or context overflow. Checkpoints are named with a UUID-like ID.
 */
export class ConversationRecovery {
  private readonly storagePath: string

  constructor(options: { storagePath?: string } = {}) {
    this.storagePath = options.storagePath ?? './session-checkpoints'
    // Ensure directory exists
    import('fs').then(({ mkdirSync }) => {
      try {
        mkdirSync(this.storagePath, { recursive: true })
      } catch {}
    })
  }

  private filePath(checkpointId: string): string {
    return `${this.storagePath}/${checkpointId}.json`
  }

  async save(state: ConversationRecoveryState): Promise<void> {
    const { writeFile } = await import('fs/promises')
    const { checkpointId, ...rest } = state
    const payload: ConversationRecoveryState = {
      ...rest,
      checkpointId,
      updatedAt: Date.now(),
    }
    await writeFile(this.filePath(checkpointId), JSON.stringify(payload), 'utf-8')
  }

  async load(checkpointId: string): Promise<ConversationRecoveryState | null> {
    try {
      const { readFile } = await import('fs/promises')
      const raw = await readFile(this.filePath(checkpointId), 'utf-8')
      return JSON.parse(raw) as ConversationRecoveryState
    } catch {
      return null
    }
  }

  async list(): Promise<{ checkpointId: string; updatedAt: number; messageCount: number }[]> {
    try {
      const { readdir } = await import('fs/promises')
      const files = await readdir(this.storagePath)
      const { readFile } = await import('fs/promises')

      const results = await Promise.all(
        files
          .filter((f) => f.endsWith('.json'))
          .map(async (file) => {
            try {
              const raw = await readFile(`${this.storagePath}/${file}`, 'utf-8')
              const state = JSON.parse(raw) as ConversationRecoveryState
              return {
                checkpointId: state.checkpointId,
                updatedAt: state.updatedAt ?? 0,
                messageCount: state.messages?.length ?? 0,
              }
            } catch {
              return null
            }
          }),
      )

      return results.filter((r): r is NonNullable<typeof r> => r !== null)
    } catch {
      return []
    }
  }

  async remove(checkpointId: string): Promise<void> {
    try {
      const { unlink } = await import('fs/promises')
      await unlink(this.filePath(checkpointId))
    } catch {}
  }

  async prune(maxAgeMs: number): Promise<number> {
    const list = await this.list()
    const now = Date.now()
    let removed = 0

    for (const { checkpointId, updatedAt } of list) {
      if (now - updatedAt > maxAgeMs) {
        await this.remove(checkpointId)
        removed++
      }
    }

    return removed
  }
}
