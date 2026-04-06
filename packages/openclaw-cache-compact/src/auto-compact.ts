import type { Message, CompactOptions } from './types.js'

/**
 * Rough token estimation: ~4 chars per token for English-heavy text.
 * For CJK characters, use a higher ratio.
 */
function estimateTokens(text: string): number {
  const cjk = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30fa\uac00-\ud7af]/
  const isCjk = cjk.test(text)
  const ratio = isCjk ? 2 : 4
  return Math.ceil(text.length / ratio)
}

function messageTokens(msg: Message): number {
  if (msg.tokens && msg.tokens > 0) return msg.tokens

  // Rough estimate
  let total = estimateTokens(msg.content ?? '')

  if (msg.toolCalls) {
    for (const tc of msg.toolCalls) {
      total += estimateTokens(JSON.stringify(tc.args ?? {}))
    }
  }

  if (msg.toolResults) {
    for (const tr of msg.toolResults) {
      total += estimateTokens(JSON.stringify(tr.result ?? {}))
    }
  }

  return total
}

function totalTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + messageTokens(m), 0)
}

/**
 * AutoCompact — compress a message list to fit within a target token budget.
 *
 * Strategy:
 * 1. Always preserve system messages if preserveSystem=true.
 * 2. Preserve last N messages if preserveRecentMessages is set.
 * 3. Preserve tool messages if preserveTools=true (collapses full tool result
 *    content into a summary placeholder).
 * 4. For remaining messages, remove oldest ones first and merge remaining
 *    user/assistant pairs into summarizable chunks until within targetTokens.
 */
export async function compactSession(
  messages: Message[],
  options: CompactOptions,
): Promise<Message[]> {
  const {
    targetTokens,
    preserveSystem = true,
    preserveRecentMessages = 0,
    preserveTools = true,
    maxIterations = 10,
  } = options

  const currentTokens = totalTokens(messages)
  if (currentTokens <= targetTokens) return messages

  // Identify message categories
  const systemMsgs: Message[] = []
  const toolMsgs: Message[] = []
  const regularMsgs: Message[] = []

  for (const msg of messages) {
    if (msg.role === 'system') systemMsgs.push(msg)
    else if (msg.role === 'tool') toolMsgs.push(msg)
    else regularMsgs.push(msg)
  }

  // Build working set: start with preserved messages
  const preservedRegular: Message[] = []
  const discardable: Message[] = []

  if (preserveRecentMessages > 0) {
    preservedRegular.push(...regularMsgs.slice(-preserveRecentMessages))
    discardable.push(...regularMsgs.slice(0, -preserveRecentMessages))
  } else {
    discardable.push(...regularMsgs)
  }

  let result: Message[] = [
    ...(preserveSystem ? systemMsgs : []),
    ...preservedRegular,
  ]

  let discardTokens = totalTokens(discardable)
  let resultTokens = totalTokens(result)

  for (let i = 0; i < maxIterations; i++) {
    const budget = targetTokens - resultTokens
    if (budget <= 0) break

    if (discardable.length === 0) break

    // Each iteration: discard oldest message from discardable
    // If it's a user/assistant pair, consider collapsing
    const oldest = discardable.shift()!
    discardTokens -= messageTokens(oldest)

    if (preserveTools && oldest.role === 'tool') {
      // Replace full tool result with a compact placeholder
      result.push({
        role: 'tool',
        content: '[tool result omitted]',
        name: oldest.name,
        toolCallId: oldest.toolCallId,
        tokens: 4,
      })
      resultTokens += 4
    } else if (oldest.role === 'user' || oldest.role === 'assistant') {
      // Summarize the dropped message as a single line
      const summary = `[${oldest.role} msg omitted, ~${messageTokens(oldest)} tokens]`
      result.push({ role: oldest.role, content: summary, tokens: estimateTokens(summary) })
      resultTokens += messageTokens({ role: oldest.role, content: summary })
    }
    // Skip other roles

    resultTokens = totalTokens(result)
  }

  // Final pass: ensure we are within budget
  if (totalTokens(result) > targetTokens) {
    // Emergency: just truncate from the front (after system)
    const sysCount = preserveSystem ? systemMsgs.length : 0
    const overBy = totalTokens(result) - targetTokens
    let removed = 0

    while (removed < result.length - sysCount && totalTokens(result) > targetTokens) {
      const item = result[sysCount]
      if (!item) break
      result.splice(sysCount, 1)
      removed++
    }
  }

  return result
}

/**
 * Summarize a group of messages using a placeholder string.
 * In production this would call an LLM summarization endpoint.
 */
export async function summarizeMessages(messages: Message[]): Promise<string> {
  const count = messages.length
  const total = totalTokens(messages)
  const roles = [...new Set(messages.map((m) => m.role))].join(', ')

  return `[Summary of ${count} messages (${total} tokens, roles: ${roles}): ${messages
    .slice(0, 3)
    .map((m) => m.content.slice(0, 80))
    .join(' | ')}${messages.length > 3 ? ' ...' : ''}]`
}
