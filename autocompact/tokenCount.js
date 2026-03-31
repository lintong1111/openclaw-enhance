/**
 * Token Counting Module
 * 
 * Estimates token counts for messages.
 * - Chinese: ~2 tokens per character
 * - English: ~0.25 tokens per word (4 chars/word average)
 * - Code: treated as English with higher density
 */

const CHINESE_TOKEN_RATIO = 2;    // tokens per character
const ENGLISH_TOKEN_RATIO = 0.25; // tokens per word
const CODE_TOKEN_RATIO = 0.2;     // tokens per character for code blocks

/**
 * Count Chinese characters in text
 */
function countChineseChars(text) {
  const chineseRegex = /[\u4e00-\u9fff]/g;
  const matches = text.match(chineseRegex);
  return matches ? matches.length : 0;
}

/**
 * Count English words in text
 */
function countEnglishWords(text) {
  // Remove code blocks first
  const withoutCode = text.replace(/```[\s\S]*?```/g, '');
  // Remove Chinese characters
  const englishOnly = withoutCode.replace(/[\u4e00-\u9fff]/g, '');
  // Count words (sequences of letters/numbers)
  const words = englishOnly.match(/[a-zA-Z0-9]+/g);
  return words ? words.length : 0;
}

/**
 * Count characters in code blocks
 */
function countCodeChars(text) {
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
  return codeBlocks.reduce((sum, block) => {
    // Remove the ``` markers
    const code = block.replace(/```\w*/, '').replace(/```$/, '');
    return sum + code.length;
  }, 0);
}

/**
 * Count non-Chinese, non-code characters (approximates other chars/punctuation)
 */
function countOtherChars(text) {
  const chineseChars = countChineseChars(text);
  const codeChars = countCodeChars(text);
  // Count all non-whitespace chars
  const allChars = (text.match(/\S/g) || []).length;
  return Math.max(0, allChars - chineseChars - codeChars);
}

/**
 * Estimate total tokens for a text string
 * @param {string} text - Input text
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;

  const chineseChars = countChineseChars(text);
  const englishWords = countEnglishWords(text);
  const codeChars = countCodeChars(text);
  const otherChars = countOtherChars(text);

  const tokens = 
    chineseChars * CHINESE_TOKEN_RATIO +
    englishWords * ENGLISH_TOKEN_RATIO +
    codeChars * CODE_TOKEN_RATIO +
    otherChars * 0.25; // other punctuation roughly 0.25 tokens each

  return Math.ceil(tokens);
}

/**
 * Estimate tokens for a message object
 * @param {Object} message - Message object with role, content, etc.
 * @returns {number} Estimated token count
 */
function estimateMessageTokens(message) {
  if (!message) return 0;
  
  let content = '';
  
  if (typeof message.content === 'string') {
    content = message.content;
  } else if (Array.isArray(message.content)) {
    // Handle array content (e.g., multimodal messages)
    content = message.content
      .filter(part => part.type === 'text')
      .map(part => part.text || '')
      .join(' ');
  }
  
  // Add overhead for role
  const roleTokens = 4; // ~4 tokens for role marker
  const formatTokens = 2; // ~2 tokens for formatting
  
  return roleTokens + formatTokens + estimateTokens(content);
}

/**
 * Estimate tokens for an array of messages (conversation history)
 * @param {Array} messages - Array of message objects
 * @returns {number} Total estimated token count
 */
function estimateConversationTokens(messages) {
  if (!Array.isArray(messages)) return 0;
  
  return messages.reduce((sum, msg) => sum + estimateMessageTokens(msg), 0);
}

/**
 * Estimate tokens for a system prompt
 * @param {string} systemPrompt - System prompt text
 * @returns {number} Estimated token count
 */
function estimateSystemPromptTokens(systemPrompt) {
  if (!systemPrompt) return 0;
  // System prompts typically have overhead
  return Math.ceil(estimateTokens(systemPrompt) * 1.1);
}

module.exports = {
  estimateTokens,
  estimateMessageTokens,
  estimateConversationTokens,
  estimateSystemPromptTokens,
  countChineseChars,
  countEnglishWords,
  countCodeChars
};
