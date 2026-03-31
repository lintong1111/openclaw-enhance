/**
 * Context Compression Module
 * 
 * Compresses conversation history by:
 * 1. Analyzing and extracting key information
 * 2. Generating a summary via LLM (if available)
 * 3. Preserving recent messages and critical context
 * 4. Replacing old messages with compact summary
 */

const { estimateConversationTokens, estimateMessageTokens } = require('./tokenCount');
const { extractMemory, summarizeMessage } = require('./memoryExtract');

// Default thresholds
const DEFAULT_THRESHOLDS = {
  AUTOCOMPACT_BUFFER_TOKENS: 8000,      // Start compression
  WARNING_THRESHOLD_TOKENS: 12000,     // Show warning
  MANUAL_COMPACT_THRESHOLD: 15000,      // Require manual intervention
};

/**
 * Generate a text summary of the conversation (fallback without LLM)
 */
function generateFallbackSummary(messages, memory) {
  const lines = [];
  
  lines.push('=== Conversation Summary ===');
  lines.push(`Total messages: ${messages.length}`);
  
  if (memory.projectContext.technologies.length > 0) {
    lines.push(`Technologies: ${memory.projectContext.technologies.join(', ')}`);
  }
  
  if (memory.projectContext.directories.length > 0) {
    lines.push(`Working directories: ${memory.projectContext.directories.join(', ')}`);
  }
  
  if (memory.projectContext.projectNames.length > 0) {
    lines.push(`Projects: ${memory.projectContext.projectNames.join(', ')}`);
  }
  
  if (memory.filePaths.length > 0) {
    lines.push(`Files mentioned: ${memory.filePaths.slice(0, 10).join(', ')}`);
  }
  
  if (memory.preferences.length > 0) {
    lines.push('User preferences detected:');
    memory.preferences.slice(0, 5).forEach(p => {
      lines.push(`  - ${p.topic}: ${p.text.slice(0, 80)}`);
    });
  }
  
  // Recent task context
  if (memory.tasks.length > 0) {
    lines.push('Recent requests:');
    memory.tasks.slice(-3).forEach(t => {
      lines.push(`  - [${t.type}] ${t.content.slice(0, 100)}`);
    });
  }
  
  return lines.join('\n');
}

/**
 * Build compressed system context
 */
function buildCompressedSystemContext(memory, summary) {
  const parts = [];
  
  parts.push('[COMPRESSED CONTEXT - Previous conversation summarized below]');
  parts.push('');
  
  if (summary) {
    parts.push(summary);
  }
  
  parts.push('');
  parts.push('=== End of Compressed History ===');
  parts.push('');
  parts.push('[Recent messages follow - these are the most recent exchanges]');
  
  return parts.join('\n');
}

/**
 * Compress messages array
 * @param {Array} messages - Full conversation history
 * @param {Object} options - Compression options
 * @param {Function} llmCallback - Optional LLM for smart summarization
 * @returns {Object} Compressed result
 */
async function compressConversation(messages, options = {}, llmCallback = null) {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options };
  
  // Extract memory first
  const memory = extractMemory(messages);
  
  // Calculate how many recent messages to preserve
  const recentCount = options.preserveRecentMessages || 6;
  
  // Get recent messages to preserve verbatim
  const recentMessages = messages.slice(-recentCount);
  const oldMessages = messages.slice(0, -recentCount);
  
  // Check if we actually need compression
  const oldTokens = estimateConversationTokens(oldMessages);
  if (oldTokens < thresholds.AUTOCOMPACT_BUFFER_TOKENS) {
    return {
      compressed: false,
      messages,
      reason: 'below_threshold',
      tokens: estimateConversationTokens(messages),
    };
  }
  
  // Generate summary
  let summary;
  if (llmCallback && typeof llmCallback === 'function') {
    try {
      summary = await llmCallback({
        messages: oldMessages,
        memory,
        instruction: 'Summarize the conversation concisely, preserving key facts, decisions, and context.'
      });
    } catch (err) {
      console.warn('[AutoCompact] LLM summarization failed, using fallback:', err.message);
      summary = generateFallbackSummary(oldMessages, memory);
    }
  } else {
    summary = generateFallbackSummary(oldMessages, memory);
  }
  
  // Build compressed system context
  const compressedContext = buildCompressedSystemContext(memory, summary);
  
  // Build new message array
  const compressedMessages = [
    {
      role: 'system',
      content: `[Previous conversation has been compressed due to length.]\n\n${compressedContext}`,
      isCompressed: true,
      originalMessageCount: messages.length,
    },
    ...recentMessages
  ];
  
  const newTokens = estimateConversationTokens(compressedMessages);
  
  return {
    compressed: true,
    messages: compressedMessages,
    reason: 'token_threshold',
    tokens: newTokens,
    originalTokens: estimateConversationTokens(messages),
    savedTokens: estimateConversationTokens(messages) - newTokens,
    memory,
    summary,
  };
}

/**
 * Check if compression is recommended
 */
function shouldCompress(messages, options = {}) {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options };
  
  if (!Array.isArray(messages) || messages.length === 0) {
    return { shouldCompress: false, reason: 'empty' };
  }
  
  const totalTokens = estimateConversationTokens(messages);
  
  if (totalTokens >= thresholds.MANUAL_COMPACT_THRESHOLD) {
    return {
      shouldCompress: true,
      urgency: 'manual',
      tokens: totalTokens,
      reason: 'manual_threshold_reached'
    };
  }
  
  if (totalTokens >= thresholds.WARNING_THRESHOLD_TOKENS) {
    return {
      shouldCompress: true,
      urgency: 'warning',
      tokens: totalTokens,
      reason: 'warning_threshold_reached'
    };
  }
  
  if (totalTokens >= thresholds.AUTOCOMPACT_BUFFER_TOKENS) {
    return {
      shouldCompress: true,
      urgency: 'auto',
      tokens: totalTokens,
      reason: 'buffer_threshold_reached'
    };
  }
  
  return {
    shouldCompress: false,
    tokens: totalTokens,
    reason: 'within_limits'
  };
}

/**
 * Get token usage status
 */
function getTokenStatus(messages, options = {}) {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options };
  const totalTokens = estimateConversationTokens(messages);
  
  let level = 'normal';
  if (totalTokens >= thresholds.MANUAL_COMPACT_THRESHOLD) level = 'critical';
  else if (totalTokens >= thresholds.WARNING_THRESHOLD_TOKENS) level = 'warning';
  else if (totalTokens >= thresholds.AUTOCOMPACT_BUFFER_TOKENS) level = 'elevated';
  
  return {
    totalTokens,
    thresholds,
    level,
    percentFull: Math.round((totalTokens / thresholds.MANUAL_COMPACT_THRESHOLD) * 100),
  };
}

module.exports = {
  compressConversation,
  shouldCompress,
  getTokenStatus,
  generateFallbackSummary,
  buildCompressedSystemContext,
  DEFAULT_THRESHOLDS,
};
