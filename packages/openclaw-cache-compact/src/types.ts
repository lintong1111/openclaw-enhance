export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string
  toolCallId?: string
  toolCalls?: Array<{ id: string; name: string; args: unknown }>
  toolResults?: Array<{ toolCallId: string; result: unknown }>
  tokens?: number
}

export interface ToolResult {
  toolCallId: string
  name: string
  args: unknown
  result: unknown
  timestamp: number
}

export interface TaskState {
  id: string
  status: 'pending' | 'running' | 'done' | 'failed'
  result?: unknown
  error?: string
}

export interface ConversationRecoveryState {
  checkpointId: string
  messages: Message[]
  toolResults: Record<string, ToolResult>
  taskState: TaskState[]
  createdAt: number
  updatedAt: number
  metadata?: {
    model?: string
    sessionId?: string
  }
}

export interface CompactOptions {
  targetTokens: number
  preserveSystem?: boolean
  preserveRecentMessages?: number
  preserveTools?: boolean
  maxIterations?: number
}

export interface CacheOptions {
  maxSize?: number
  ttlMs?: number
}
