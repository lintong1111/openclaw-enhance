/**
 * AutoCompact Gateway Integration Example
 * 
 * This shows how to integrate AutoCompact with OpenClaw gateway.
 * Add this to your gateway configuration or plugin.
 */

const { createAutoCompact } = require('./services/compact/autoCompact');

/**
 * Example: Gateway integration with hooks
 */
function setupGatewayIntegration(gateway) {
  // Create AutoCompact instance
  const autoCompact = createAutoCompact({
    autoCompact: true,           // Enable auto-compression
    preserveRecentMessages: 6,   // Keep last 6 messages
    
    // Thresholds
    AUTOCOMPACT_BUFFER_TOKENS: 8000,
    WARNING_THRESHOLD_TOKENS: 12000,
    MANUAL_COMPACT_THRESHOLD: 15000,
    
    // Hooks for UI notifications
    hooks: {
      onWarning: ({ status, sessionId }) => {
        console.log(`[AutoCompact] Warning: ${status.percentFull}% context used for session ${sessionId}`);
        // gateway.sendNotification(sessionId, 'context_warning', status);
      },
      
      onCompactStart: ({ status, sessionId }) => {
        console.log(`[AutoCompact] Starting compression for session ${sessionId}...`);
      },
      
      onCompactComplete: ({ result, sessionId }) => {
        console.log(`[AutoCompact] Compression complete. Saved ${result.savedTokens} tokens.`);
        // gateway.sendNotification(sessionId, 'context_compacted', result);
      },
      
      onCompactFailed: ({ error, sessionId }) => {
        console.error(`[AutoCompact] Compression failed for session ${sessionId}:`, error);
      },
      
      onManualRequired: ({ status, sessionId }) => {
        console.warn(`[AutoCompact] Manual compaction required for session ${sessionId}`);
        // gateway.sendNotification(sessionId, 'manual_compact_required', status);
      },
    },
  });
  
  // Hook into gateway's agent turn completion
  gateway.on('agent:turnComplete', async (event) => {
    const { sessionId, messages } = event;
    
    // Check and potentially compress
    const result = await autoCompact.checkAndCompact(messages, { sessionId });
    
    if (result.wasCompressed) {
      // Update session with compressed messages
      event.session.messages = result.messages;
    }
  });
  
  // Hook into session creation for fresh state
  gateway.on('session:created', (event) => {
    autoCompact.reset();
  });
  
  return autoCompact;
}

/**
 * Example: LLM-based summarization
 * 
 * To use LLM summarization instead of fallback:
 */
async function llmSummarizer({ messages, memory, instruction }) {
  // This would call your LLM API
  // Example with OpenAI:
  /*
  const { OpenAI } = require('openai');
  const client = new OpenAI();
  
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: `Summarize this conversation concisely. ${instruction}` },
      { role: 'user', content: JSON.stringify({ messages, memory }, null, 2) }
    ],
    max_tokens: 500,
    temperature: 0.3,
  });
  
  return response.choices[0].message.content;
  */
  
  // For now, return null to use fallback
  return null;
}

// Export for gateway plugin
module.exports = {
  setupGatewayIntegration,
  llmSummarizer,
};
