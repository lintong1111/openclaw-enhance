# Token Budget

Token 预算管理，防止单个任务无限消耗。

## 问题

- Agent 任务可能运行很长时间
- Token 消耗不可控
- 容易卡死在复杂任务里

## 解决方案

三级 Token 预算：

```javascript
// 1. Turn Budget（单次调用）
const TURN_BUDGET = {
  maxTokens: 4000,      // 单次最多 4000 tokens
  warningAt: 3000        // 警告阈值
}

// 2. Task Budget（单个任务）
const TASK_BUDGET = {
  maxTokens: 50000,      // 单任务最多 50000 tokens
  warningAt: 40000,
  autoStop: true         // 超时自动停止
}

// 3. Session Budget（整个会话）
const SESSION_BUDGET = {
  maxTokens: 200000,     // 会话最多 200000 tokens
  warningAt: 150000
}
```

## 实现

### TokenBudget 类

```javascript
class TokenBudget {
  constructor(config) {
    this.maxTokens = config.maxTokens
    this.warningAt = config.warningAt || config.maxTokens * 0.8
    this.usedTokens = 0
    this.autoStop = config.autoStop || false
  }

  // 消耗 Token
  consume(tokens) {
    this.usedTokens += tokens
    this.checkThreshold()
    return this.checkBudget()
  }

  // 检查阈值
  checkThreshold() {
    if (this.usedTokens >= this.warningAt && !this.warned) {
      this.warned = true
      return { type: 'warning', remaining: this.maxTokens - this.usedTokens }
    }
    return null
  }

  // 检查预算
  checkBudget() {
    if (this.usedTokens >= this.maxTokens) {
      return { 
        type: 'exceeded', 
        exceededBy: this.usedTokens - this.maxTokens 
      }
    }
    return { type: 'ok', remaining: this.maxTokens - this.usedTokens }
  }

  // 是否应该停止
  shouldStop() {
    if (!this.autoStop) return false
    return this.usedTokens >= this.maxTokens
  }
}
```

### 任务预算执行器

```javascript
class TaskBudgetExecutor {
  constructor(taskId, budget) {
    this.taskId = taskId
    this.budget = new TokenBudget(budget)
    this.turnCount = 0
  }

  // 执行任务，自动管理预算
  async execute(taskFn) {
    const startTime = Date.now()
    
    while (true) {
      // 检查预算
      if (this.budget.shouldStop()) {
        return {
          success: false,
          reason: 'token_budget_exceeded',
          usedTokens: this.budget.usedTokens,
          turnCount: this.turnCount,
          duration: Date.now() - startTime
        }
      }

      // 执行一轮
      const result = await taskFn(this)
      
      // 检查结果
      if (result.done) {
        return {
          success: true,
          usedTokens: this.budget.usedTokens,
          turnCount: this.turnCount,
          duration: Date.now() - startTime
        }
      }

      // 消耗 Token
      const budgetResult = this.budget.consume(result.tokensUsed)
      
      // 处理警告
      if (budgetResult?.type === 'warning') {
        console.warn(`⚠️ Token 预算警告: 剩余 ${budgetResult.remaining}`)
      }

      this.turnCount++
    }
  }
}
```

### 集成到 Query 循环

```javascript
// 在 query.ts 中
async function queryWithBudget(params) {
  const taskBudget = new TaskBudgetExecutor('main', {
    maxTokens: 100000,
    warningAt: 80000,
    autoStop: true
  })

  return await taskBudget.execute(async (budget) => {
    // 检查 turn 预算
    if (params.maxTurns && budget.turnCount >= params.maxTurns) {
      return { done: true }
    }

    // 执行查询
    const result = await query(params)
    
    // 记录 token 消耗
    result.tokensUsed = result.usage.input_tokens + result.usage.output_tokens
    
    // 检查是否完成
    if (result.isComplete) {
      return { done: true, tokensUsed: result.tokensUsed }
    }

    return { done: false, tokensUsed: result.tokensUsed }
  })
}
```

### API 调用预算

```javascript
// 单次 API 调用的预算
function checkAPICallBudget(estimatedTokens) {
  const remaining = SESSION_BUDGET.maxTokens - sessionBudget.usedTokens
  
  if (estimatedTokens > remaining) {
    return {
      allowed: false,
      reason: 'session_budget_exceeded',
      suggestion: '考虑压缩对话历史'
    }
  }
  
  return { allowed: true }
}
```

## 使用方式

```javascript
// 创建任务时指定预算
const task = TaskManager.create('complex-task', {
  budget: {
    maxTokens: 50000,
    warningAt: 40000,
    autoStop: true
  }
})

// 或者全局设置
const config = {
  taskBudget: {
    maxTokens: 50000,
    autoStop: true
  }
}
```

## 超时处理

```javascript
// 预算超时的处理
async function handleBudgetExceeded(task) {
  // 1. 发送警告消息
  await sendMessage(task.owner, {
    type: 'task_warning',
    content: `任务 ${task.id} 接近 Token 预算上限`
  })

  // 2. 保存当前进度
  const checkpoint = await saveCheckpoint(task)
  
  // 3. 决定是否继续
  const shouldContinue = await askUser({
    question: 'Token 消耗较大，是否继续？',
    options: [
      { label: '继续', action: 'resume' },
      { label: '停止', action: 'stop' },
      { label: '压缩后继续', action: 'compact_and_continue' }
    ]
  })

  return shouldContinue
}
```

## 配置建议

| 任务类型 | maxTokens | 说明 |
|---------|-----------|------|
| 简单搜索 | 10,000 | 快速任务 |
| 代码分析 | 50,000 | 中等复杂度 |
| 大型重构 | 100,000 | 复杂任务 |
| 研究任务 | 200,000 | 超长任务 |

---

参考：Claude Code 的 `taskBudget` 参数和 `autoContinue` 机制。
