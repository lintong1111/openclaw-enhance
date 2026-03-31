/**
 * Graceful Shutdown Manager
 * 优雅关闭，比 kill 更安全
 */

const EventEmitter = require('events')

class ShutdownManager extends EventEmitter {
  constructor(config = {}) {
    super()
    this.defaultDeadline = config.deadline || 5000 // 默认5秒
    this.pendingShutdowns = new Map()
    this.tasks = new Map()
    this.logger = config.logger || console
  }

  // 注册任务
  registerTask(taskId, task) {
    this.tasks.set(taskId, {
      ...task,
      shutdownRequested: false,
      shutdownConfirmed: false,
      pid: task.pid || null
    })
  }

  // 注销任务
  unregisterTask(taskId) {
    this.tasks.delete(taskId)
    this.pendingShutdowns.delete(taskId)
  }

  // 请求关闭
  requestShutdown(taskId, reason = 'User requested') {
    const task = this.tasks.get(taskId)
    if (!task) {
      this.logger.warn(`Shutdown: task ${taskId} not found`)
      return false
    }

    const deadline = Date.now() + this.defaultDeadline
    
    this.pendingShutdowns.set(taskId, {
      reason,
      deadline,
      confirmed: false,
      requestedAt: Date.now()
    })

    // 发送关闭请求事件
    this.emit('shutdown_request', {
      taskId,
      reason,
      deadline
    })

    // 设置强制关闭定时器
    setTimeout(() => {
      if (this.pendingShutdowns.has(taskId)) {
        this.logger.warn(`Graceful shutdown timeout for ${taskId}, forcing kill`)
        this.forceKill(taskId)
      }
    }, this.defaultDeadline)

    return true
  }

  // 确认关闭
  confirmShutdown(taskId) {
    const shutdown = this.pendingShutdowns.get(taskId)
    if (!shutdown) return false

    shutdown.confirmed = true
    this.emit('shutdown_confirmed', { taskId })
    
    // 从待关闭列表移除
    this.pendingShutdowns.delete(taskId)
    
    // 执行实际关闭
    this.tasks.delete(taskId)
    
    return true
  }

  // 强制杀
  forceKill(taskId) {
    const task = this.tasks.get(taskId)
    if (!task) return false

    this.logger.warn(`Force killing task ${taskId}`)
    
    if (task.pid) {
      try {
        process.kill(task.pid, 'SIGKILL')
      } catch (e) {
        this.logger.error(`Failed to kill ${taskId}: ${e.message}`)
      }
    }

    this.emit('force_killed', { taskId })
    this.pendingShutdowns.delete(taskId)
    this.tasks.delete(taskId)

    return true
  }

  // 批量关闭团队
  shutdownTeam(teamId, memberIds) {
    const results = []
    for (const memberId of memberIds) {
      results.push(this.requestShutdown(`${teamId}:${memberId}`, `Team ${teamId} deleted`))
    }
    return results
  }

  // 等待所有关闭完成
  async waitForAll(timeout = 30000) {
    const start = Date.now()
    while (this.pendingShutdowns.size > 0) {
      if (Date.now() - start > timeout) {
        this.logger.warn(`Timeout waiting for ${this.pendingShutdowns.size} shutdowns`)
        break
      }
      await new Promise(r => setTimeout(r, 100))
    }
  }

  // 获取状态
  getStatus() {
    return {
      pending: Array.from(this.pendingShutdowns.keys()),
      tasks: Array.from(this.tasks.keys()),
      stats: {
        pendingCount: this.pendingShutdowns.size,
        taskCount: this.tasks.size
      }
    }
  }

  // 清理所有
  killAll() {
    for (const taskId of this.tasks.keys()) {
      this.forceKill(taskId)
    }
  }
}

/**
 * Agent 端关闭处理器
 * 在 Agent 进程中使用
 */
class AgentShutdownHandler {
  constructor(agentName, onShutdown) {
    this.agentName = agentName
    this.onShutdown = onShutdown
    this.shuttingDown = false
  }

  // 处理关闭请求
  async handleShutdownRequest(message) {
    if (this.shuttingDown) return
    this.shuttingDown = true

    const { reason, deadline } = message

    console.log(`[${this.agentName}] 收到关闭请求: ${reason}`)
    console.log(`[${this.agentName}] 截止时间: ${new Date(deadline).toISOString()}`)

    try {
      // 1. 停止接收新任务
      this.acceptingTasks = false
      console.log(`[${this.agentName}] 停止接收新任务`)

      // 2. 等待当前任务完成
      if (this.currentTask) {
        console.log(`[${this.agentName}] 等待当前任务完成...`)
        await this.currentTask.waitForCompletion?.()
      }

      // 3. 保存状态
      if (this.saveState) {
        console.log(`[${this.agentName}] 保存状态...`)
        await this.saveState()
      }

      // 4. 清理资源
      if (this.cleanup) {
        console.log(`[${this.agentName}] 清理资源...`)
        await this.cleanup()
      }

      // 5. 发送确认
      console.log(`[${this.agentName}] 确认关闭`)
      
      // 6. 安全退出
      process.exit(0)
    } catch (error) {
      console.error(`[${this.agentName}] 关闭时出错: ${error.message}`)
      process.exit(1)
    }
  }

  // 模拟处理消息
  onMessage(message) {
    if (message.type === 'shutdown_request' && message.to === this.agentName) {
      this.handleShutdownRequest(message)
    }
  }
}

// 导出单例
const shutdownManager = new ShutdownManager()

module.exports = {
  ShutdownManager,
  AgentShutdownHandler,
  shutdownManager
}
