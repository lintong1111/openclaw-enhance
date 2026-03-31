/**
 * Token Budget Manager
 * 防止任务无限消耗 Token
 */

class TokenBudget {
  constructor(config = {}) {
    this.maxTokens = config.maxTokens || 100000
    this.warningAt = config.warningAt || this.maxTokens * 0.8
    this.usedTokens = 0
    this.autoStop = config.autoStop !== false
    this.warned = false
    this.turnCount = 0
    this.startTime = Date.now()
  }

  consume(tokens) {
    this.usedTokens += tokens
    return this.check()
  }

  check() {
    if (this.usedTokens >= this.maxTokens) {
      return {
        status: 'exceeded',
        type: this.autoStop ? 'stop' : 'warn',
        used: this.usedTokens,
        remaining: 0,
        exceededBy: this.usedTokens - this.maxTokens
      }
    }
    
    if (this.usedTokens >= this.warningAt && !this.warned) {
      this.warned = true
      return {
        status: 'warning',
        used: this.usedTokens,
        remaining: this.maxTokens - this.usedTokens
      }
    }
    
    return {
      status: 'ok',
      used: this.usedTokens,
      remaining: this.maxTokens - this.usedTokens
    }
  }

  shouldStop() {
    return this.autoStop && this.usedTokens >= this.maxTokens
  }

  reset() {
    this.usedTokens = 0
    this.warned = false
    this.turnCount = 0
    this.startTime = Date.now()
  }

  getStats() {
    return {
      used: this.usedTokens,
      max: this.maxTokens,
      percent: Math.round((this.usedTokens / this.maxTokens) * 100),
      turns: this.turnCount,
      duration: Date.now() - this.startTime,
      status: this.check().status
    }
  }
}

/**
 * Token Estimator
 * 估算消息/回复的 token 数量
 */
class TokenEstimator {
  // 粗略估算：中文约 2 tokens/字，英文约 4 tokens/词
  static estimate(text) {
    if (!text) return 0
    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const english = (text.match(/[a-zA-Z]+/g) || []).length
    return chinese * 2 + english * 1.3 + 10 // overhead
  }

  static estimateMessages(messages) {
    return messages.reduce((sum, msg) => {
      if (typeof msg === 'string') return sum + this.estimate(msg)
      if (msg.content) {
        if (Array.isArray(msg.content)) {
          return sum + msg.content.reduce((s, c) => s + (c.text ? this.estimate(c.text) : 0), 0)
        }
        return sum + this.estimate(msg.content)
      }
      return sum
    }, 0)
  }
}

/**
 * Budget Manager（全局管理）
 */
class BudgetManager {
  constructor() {
    this.taskBudgets = new Map()
    this.sessionBudget = new TokenBudget({
      maxTokens: 200000,
      warningAt: 160000,
      autoStop: false
    })
  }

  createTaskBudget(taskId, config = {}) {
    const budget = new TokenBudget(config)
    this.taskBudgets.set(taskId, budget)
    return budget
  }

  getTaskBudget(taskId) {
    return this.taskBudgets.get(taskId)
  }

  removeTaskBudget(taskId) {
    this.taskBudgets.delete(taskId)
  }

  consumeForTask(taskId, tokens) {
    const budget = this.taskBudgets.get(taskId)
    if (!budget) return null
    
    const result = budget.consume(tokens)
    if (result.status === 'exceeded' && result.type === 'stop') {
      this.removeTaskBudget(taskId)
    }
    return result
  }

  consumeForSession(tokens) {
    return this.sessionBudget.consume(tokens)
  }

  getSessionStats() {
    return this.sessionBudget.getStats()
  }

  getAllTaskStats() {
    const stats = {}
    for (const [id, budget] of this.taskBudgets) {
      stats[id] = budget.getStats()
    }
    return stats
  }

  reset() {
    this.sessionBudget.reset()
    this.taskBudgets.clear()
  }
}

// 导出单例
const budgetManager = new BudgetManager()

module.exports = {
  TokenBudget,
  TokenEstimator,
  BudgetManager,
  budgetManager
}
