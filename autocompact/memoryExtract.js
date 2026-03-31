/**
 * Session Memory Extraction Module
 * 
 * Extracts key information from conversation history:
 * - User preferences and habits
 * - Current project context
 * - Ongoing task status
 * - Important file paths and summaries
 */

/**
 * Extract patterns that indicate user preferences
 */
function extractPreferences(messages) {
  const preferences = [];
  
  // Tool preferences
  const toolPatterns = [
    { pattern: /喜欢用|偏好|倾向于/i, topic: 'tool_preference' },
    { pattern: /不要|别|不要用/i, topic: 'tool_avoidance' },
  ];
  
  // Communication style preferences
  const stylePatterns = [
    { pattern: /简洁|简短|简单说/i, topic: 'concise_responses' },
    { pattern: /详细|展开|解释/i, topic: 'detailed_responses' },
    { pattern: /直接给答案|别解释那么多/i, topic: 'direct_answers' },
  ];
  
  // Language preferences
  const langPatterns = [
    { pattern: /用中文|说中文|中文/i, topic: 'chinese_language' },
    { pattern: /用英文|说英文|english/i, topic: 'english_language' },
  ];
  
  messages.forEach(msg => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    
    toolPatterns.forEach(({ pattern, topic }) => {
      if (pattern.test(content)) {
        preferences.push({ topic, text: content.slice(0, 100), from: msg.role });
      }
    });
    
    stylePatterns.forEach(({ pattern, topic }) => {
      if (pattern.test(content)) {
        preferences.push({ topic, text: content.slice(0, 100), from: msg.role });
      }
    });
    
    langPatterns.forEach(({ pattern, topic }) => {
      if (pattern.test(content)) {
        preferences.push({ topic, text: content.slice(0, 100), from: msg.role });
      }
    });
  });
  
  return preferences;
}

/**
 * Extract file paths mentioned in conversation
 */
function extractFilePaths(messages) {
  const filePaths = new Set();
  
  // Common file path patterns
  const patterns = [
    /\~?\/[^\s'"`<>]+/g,                    // Unix paths
    /[A-Z]:\\[^\s'"`<>]+/g,                 // Windows paths
    /\.\/[^\s'"`<>]+/g,                     // Relative paths
    /\.\.\/[^\s'"`<>]+/g,                   // Parent relative paths
  ];
  
  messages.forEach(msg => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(path => filePaths.add(path));
      }
    });
  });
  
  return Array.from(filePaths);
}

/**
 * Extract project context (directory, tech stack, etc.)
 */
function extractProjectContext(messages) {
  const context = {
    directories: new Set(),
    technologies: new Set(),
    projectNames: new Set(),
  };
  
  // Tech stack indicators
  const techPatterns = [
    { pattern: /node|nodejs|npm|yarn|pnpm/i, tech: 'Node.js' },
    { pattern: /python|pip|poetry|venv/i, tech: 'Python' },
    { pattern: /typescript|ts|tsx|jsx/i, tech: 'TypeScript' },
    { pattern: /react|vue|angular|svelte/i, tech: 'Frontend Framework' },
    { pattern: /docker|kubernetes|k8s/i, tech: 'Container' },
    { pattern: /git|github|gitlab|branch/i, tech: 'Git' },
    { pattern: /linux|unix|bash|shell/i, tech: 'Linux/Shell' },
    { pattern: /openclaw|claw/i, tech: 'OpenClaw' },
    { pattern: /postgres|mysql|mongodb|redis/i, tech: 'Database' },
    { pattern: /api|rest|graphql|endpoint/i, tech: 'API' },
  ];
  
  // Project name patterns
  const projectPatterns = [
    /项目[：:]\s*([^\s，,。]+)/g,
    /project[：:]\s*([^\s，,。]+)/gi,
    /叫([^\s，,。]+)项目/g,
  ];
  
  messages.forEach(msg => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    
    // Extract tech
    techPatterns.forEach(({ pattern, tech }) => {
      if (pattern.test(content)) {
        context.technologies.add(tech);
      }
    });
    
    // Extract project names
    projectPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        context.projectNames.add(matches[1] || matches[0]);
      }
    });
    
    // Extract directory paths
    const dirPattern = /\~?\/[^\s'"`<>]*\//g;
    const dirs = content.match(dirPattern);
    if (dirs) {
      dirs.forEach(d => context.directories.add(d.replace(/\/$/, '')));
    }
  });
  
  return {
    directories: Array.from(context.directories),
    technologies: Array.from(context.technologies),
    projectNames: Array.from(context.projectNames),
  };
}

/**
 * Extract ongoing tasks and their status
 */
function extractTaskStatus(messages) {
  const tasks = [];
  
  const taskPatterns = [
    { pattern: /(正在|做|处理|开发|实现|写|创建)(.+?)[，。；.；,]/gi, status: 'in_progress' },
    { pattern: /(还没|未|没有)(完成|做完|解决|做好)(.+?)[，。；.；,]/gi, status: 'pending' },
    { pattern: /(完成|做完|解决|做好|好了|完成)(.+?)[，。；.；,]/gi, status: 'completed' },
    { pattern: /(失败|错误|报错|不行|不能)(.+?)[，。；.；,]/gi, status: 'failed' },
  ];
  
  // Extract commands/queries
  const recentUserMessages = messages
    .filter(m => m.role === 'user')
    .slice(-5); // Last 5 user messages
  
  recentUserMessages.forEach(msg => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    tasks.push({
      type: 'user_request',
      content: content.slice(0, 200),
      timestamp: msg.timestamp || msg.created_at
    });
  });
  
  return tasks;
}

/**
 * Summarize a message for compression
 */
function summarizeMessage(msg) {
  const content = typeof msg.content === 'string' 
    ? msg.content 
    : JSON.stringify(msg.content);
  
  // Truncate long content
  const maxLen = 300;
  let summary = content.slice(0, maxLen);
  if (content.length > maxLen) {
    summary += '...';
  }
  
  return `[${msg.role}]: ${summary}`;
}

/**
 * Extract all memory from conversation
 * @param {Array} messages - Conversation history
 * @returns {Object} Extracted memory object
 */
function extractMemory(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      preferences: [],
      filePaths: [],
      projectContext: { directories: [], technologies: [], projectNames: [] },
      tasks: [],
      messageCount: 0,
      timeRange: null,
    };
  }
  
  return {
    preferences: extractPreferences(messages),
    filePaths: extractFilePaths(messages),
    projectContext: extractProjectContext(messages),
    tasks: extractTaskStatus(messages),
    messageCount: messages.length,
    timeRange: {
      first: messages[0]?.timestamp || messages[0]?.created_at,
      last: messages[messages.length - 1]?.timestamp || messages[messages.length - 1]?.created_at,
    },
  };
}

module.exports = {
  extractMemory,
  extractPreferences,
  extractFilePaths,
  extractProjectContext,
  extractTaskStatus,
  summarizeMessage
};
