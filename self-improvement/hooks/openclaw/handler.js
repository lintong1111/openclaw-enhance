/**
 * Self-Improvement Hook for OpenClaw
 * 
 * 增强版：注入自我改进提醒，支持智能学习和技能生成
 * 
 * 功能：
 * 1. 注入 SELF_IMPROVEMENT_REMINDER.md 提醒
 * 2. 读取 .learnings/ 下最近的教训
 * 3. 提示是否需要生成新的 Skill
 * 4. 记录本次 session 的关键事件
 */

const fs = require('fs');
const path = require('path');

const LEARNINGS_DIR = '.learnings';

// 默认提醒内容
const DEFAULT_REMINDER = `
## Self-Improvement Reminder

After completing tasks, evaluate if any learnings should be captured:

**Log when:**
- User corrects you → \`.learnings/LEARNINGS.md\`
- Command/operation fails → \`.learnings/ERRORS.md\`
- User wants missing capability → \`.learnings/FEATURE_REQUESTS.md\`
- You discover your knowledge was wrong → \`.learnings/LEARNINGS.md\`
- You find a better approach → \`.learnings/LEARNINGS.md\`

**Promote when pattern is proven:**
- Behavioral patterns → \`SOUL.md\`
- Workflow improvements → \`AGENTS.md\`
- Tool gotchas → \`TOOLS.md\`

Keep entries simple: date, title, what happened, what to do differently.
`.trim();

/**
 * 读取最近的 learnings 内容（用于上下文注入）
 */
function getRecentLearnings(workspacePath, maxEntries = 5) {
  const learningsPath = path.join(workspacePath, LEARNINGS_DIR);
  if (!fs.existsSync(learningsPath)) {
    return null;
  }

  const files = ['LEARNINGS.md', 'ERRORS.md', 'FEATURE_REQUESTS.md'];
  const recent = [];

  for (const file of files) {
    const filePath = path.join(learningsPath, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // 只取最后 maxEntries 条记录
      const entries = content.split(/^## /m).slice(-(maxEntries + 1));
      if (entries.length > 1) {
        recent.push(`### ${file.replace('.md', '')}`);
        recent.push(entries.slice(1).join('\n## ').trim());
      }
    }
  }

  return recent.length > 0 ? recent.join('\n\n') : null;
}

/**
 * 检查是否有可能生成 Skill 的内容
 */
function checkForSkillableContent(workspacePath) {
  const featurePath = path.join(workspacePath, LEARNINGS_DIR, 'FEATURE_REQUESTS.md');
  if (!fs.existsSync(featurePath)) {
    return null;
  }

  const content = fs.readFileSync(featurePath, 'utf-8');
  // 检查是否有高优先级的功能需求
  const highPriority = content.match(/\*\*优先级\*\*：\*\*(高|High)/i);
  
  if (highPriority) {
    return `Found high-priority feature request. Consider creating a skill for this.`;
  }
  return null;
}

/**
 * 生成增强的提醒内容
 */
function generateEnhancedReminder(workspacePath) {
  let reminder = DEFAULT_REMINDER;

  // 添加最近的 learnings 上下文
  const recentLearnings = getRecentLearnings(workspacePath);
  if (recentLearnings) {
    reminder += `\n\n---\n\n## Recent Learnings (for context)\n\n${recentLearnings}`;
  }

  // 检查是否需要生成 skill
  const skillSuggestion = checkForSkillableContent(workspacePath);
  if (skillSuggestion) {
    reminder += `\n\n---\n\n**Skill Opportunity:** ${skillSuggestion}`;
  }

  return reminder;
}

/**
 * 主 handler 函数
 */
const handler = async (event) => {
  // 安全检查
  if (!event || typeof event !== 'object') {
    return;
  }

  // 只处理 agent:bootstrap 事件
  if (event.type !== 'agent' || event.action !== 'bootstrap') {
    return;
  }

  // 安全检查 context
  if (!event.context || typeof event.context !== 'object') {
    return;
  }

  // 获取 workspace 路径
  const workspacePath = event.context.workspacePath || '.';

  // 生成提醒内容（可能包含最近的 learnings）
  const reminderContent = generateEnhancedReminder(workspacePath);

  // 注入虚拟 bootstrap 文件
  if (Array.isArray(event.context.bootstrapFiles)) {
    event.context.bootstrapFiles.push({
      path: 'SELF_IMPROVEMENT_REMINDER.md',
      content: reminderContent,
      virtual: true,
    });
  }

  // 如果有可学习的教训，也注入为虚拟文件
  const recentLearnings = getRecentLearnings(workspacePath, 3);
  if (recentLearnings) {
    event.context.bootstrapFiles.push({
      path: '.learnings/RECENT.md',
      content: `# Recent Learnings\n\n${recentLearnings}`,
      virtual: true,
    });
  }
};

module.exports = handler;
module.exports.default = handler;
