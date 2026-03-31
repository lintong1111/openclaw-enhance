/**
 * AutoCompact - Automatic Context Compression System
 * 
 * Monitors conversation token usage and triggers compression when thresholds are exceeded.
 * Designed to integrate with OpenClaw gateway.
 */

const { compressConversation, shouldCompress, getTokenStatus, DEFAULT_THRESHOLDS } = require('./compact');
const { estimateConversationTokens, estimateSystemPromptTokens } = require('./tokenCount');

/**
 * AutoCompact configuration
 */
const CONFIG = {
  // Thresholds (can be overridden per instance)
  ...DEFAULT_THRESHOLDS,
  
  // How often to check (every N messages)
  checkInterval: 1,
  
  // Whether to auto-compact or just warn
  autoCompact: true,
  
  // Max recent messages to preserve after compression
  preserveRecentMessages: 6,
  
  // Custom LLM callback for smart summarization
  llmSummarizer: null,
  
  // Hooks for gateway integration
  hooks: {
    onWarning: null,        // Called when warning threshold reached
    onCompactStart: null,   // Called before compression
    onCompactComplete: null, // Called after compression
    onCompactFailed: null,  // Called if compression fails
    onManualRequired: null, // Called when manual intervention needed
  },
  
  // Logger
  logger: {
    info: (...args) => console.log('[AutoCompact]', ...args),
    warn: (...args) => console.warn('[AutoCompact]', ...args),
    error: (...args) => console.error('[AutoCompact]', ...args),
  }
};

/**
 * AutoCompact instance class
 */
class AutoCompact {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    this.messageCount = 0;
    this.lastCheck = null;
    this.compactionHistory = [];
  }
  
  /**
   * Process a turn (after agent responds)
   * @param {Object} context - Gateway context
   * @param {Array} context.messages - Current message history
   * @param {string} context.systemPrompt - System prompt (optional)
   * @param {Object} context.sessionId - Session identifier (optional)
   * @returns {Object} Processing result
   */
  async processTurn(context) {
    const { messages, systemPrompt, sessionId } = context;
    
    this.messageCount++;
    
    // Check token status
    const status = getTokenStatus(messages, this.config);
    
    // Check if we should trigger compaction
    const check = shouldCompress(messages, this.config);
    
    // Fire appropriate hooks
    if (check.urgency === 'warning' || check.urgency === 'auto') {
      this._fireHook('onWarning', { status, check, sessionId });
    }
    
    if (check.urgency === 'manual') {
      this._fireHook('onManualRequired', { status, check, sessionId });
      
      // Don't auto-compact for manual threshold
      if (!this.config.autoCompact) {
        return {
          action: 'require_manual',
          status,
          check,
          message: `Token count (${status.totalTokens}) exceeds manual threshold (${this.config.MANUAL_COMPACT_THRESHOLD}). Manual compaction required.`
        };
      }
    }
    
    // Auto-compact if enabled and needed
    if (this.config.autoCompact && check.shouldCompress) {
      return await this._doCompact(context, status, check);
    }
    
    return {
      action: 'none',
      status,
      check,
    };
  }
  
  /**
   * Perform compression
   */
  async _doCompact(context, status, check) {
    const { messages, sessionId } = context;
    
    this._fireHook('onCompactStart', { status, check, sessionId });
    
    const startTime = Date.now();
    
    try {
      const result = await compressConversation(messages, {
        preserveRecentMessages: this.config.preserveRecentMessages,
        ...this.config,
      }, this.config.llmSummarizer);
      
      const duration = Date.now() - startTime;
      
      // Record history
      this.compactionHistory.push({
        timestamp: new Date().toISOString(),
        sessionId,
        originalTokens: result.originalTokens,
        newTokens: result.tokens,
        savedTokens: result.savedTokens,
        messageCount: messages.length,
        newMessageCount: result.messages.length,
        duration,
      });
      
      this._fireHook('onCompactComplete', { result, sessionId });
      
      this.config.logger.info(
        `Compaction complete: ${result.originalTokens} → ${result.tokens} tokens ` +
        `(-${result.savedTokens}, ${messages.length} → ${result.messages.length} messages, ${duration}ms)`
      );
      
      return {
        action: 'compressed',
        status: getTokenStatus(result.messages, this.config),
        result,
      };
      
    } catch (err) {
      this.config.logger.error('Compaction failed:', err);
      this._fireHook('onCompactFailed', { error: err, status, sessionId });
      
      return {
        action: 'failed',
        error: err.message,
        status,
      };
    }
  }
  
  /**
   * Fire a hook callback
   */
  _fireHook(name, data) {
    const hook = this.config.hooks[name];
    if (typeof hook === 'function') {
      try {
        hook(data);
      } catch (err) {
        this.config.logger.error(`Hook ${name} failed:`, err);
      }
    }
  }
  
  /**
   * Get current status
   */
  getStatus() {
    return {
      messageCount: this.messageCount,
      lastCheck: this.lastCheck,
      compactionCount: this.compactionHistory.length,
      history: this.compactionHistory.slice(-10),
    };
  }
  
  /**
   * Reset state (for new session)
   */
  reset() {
    this.messageCount = 0;
    this.lastCheck = null;
  }
  
  /**
   * Update configuration
   */
  configure(options) {
    this.config = { ...this.config, ...options };
    return this.config;
  }
}

/**
 * Create a simple wrapper function for gateway integration
 */
function createAutoCompact(options = {}) {
  const compact = new AutoCompact(options);
  
  return {
    /**
     * Check and potentially compress conversation
     * @param {Array} messages - Message history
     * @param {Object} sessionContext - Additional context
     * @returns {Promise<Object>} Result with compressed messages if done
     */
    async checkAndCompact(messages, sessionContext = {}) {
      const result = await compact.processTurn({
        messages,
        ...sessionContext
      });
      
      // Return messages (either original or compressed)
      if (result.result) {
        return {
          messages: result.result.messages,
          wasCompressed: true,
          status: result.status,
          history: compact.compactionHistory.slice(-1)[0],
        };
      }
      
      return {
        messages,
        wasCompressed: false,
        status: result.status,
      };
    },
    
    /**
     * Force compression (manual trigger)
     */
    async forceCompact(messages, sessionContext = {}) {
      const result = await compressConversation(messages, {
        preserveRecentMessages: options.preserveRecentMessages || 6,
        ...options,
      }, options.llmSummarizer);
      
      return {
        messages: result.messages,
        status: getTokenStatus(result.messages, compact.config),
        result,
      };
    },
    
    /**
     * Get token status without compression
     */
    getTokenStatus(messages) {
      return getTokenStatus(messages, compact.config);
    },
    
    /**
     * Get instance status
     */
    getStatus() {
      return compact.getStatus();
    },
    
    /**
     * Configure the instance
     */
    configure(newOptions) {
      return compact.configure(newOptions);
    },
  };
}

module.exports = {
  AutoCompact,
  createAutoCompact,
  getTokenStatus,
  shouldCompress,
  CONFIG,
};
