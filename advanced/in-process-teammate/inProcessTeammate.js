/**
 * In-Process Teammate
 * 进程内 Teammate，通信更快
 */

const EventEmitter = require('events')

/**
 * 进程内消息
 */
class InProcessMessage {
  constructor(from, to, content, options = {}) {
    this.id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.from = from
    this.to = to
    this.content = content
    this.type = options.type || 'message'
    this.timestamp = Date.now()
    this.callback = options.callback || null
    this.sync = options.sync || false // 同步还是异步
  }
}

/**
 * 进程内 Teammate
 */
class InProcessTeammate extends EventEmitter {
  constructor(name, agentType, config = {}) {
    super()
    this.name = name
    this.agentType = agentType
    this.config = config
    
    this.messageQueue = []
    this.isRunning = false
    this.currentTask = null
    
    // 处理函数
    this.handlers = new Map()
    this.defaultHandler = null
    
    // 注册默认处理器
    this.registerHandler('message', this.handleMessage.bind(this))
    this.registerHandler('shutdown_request', this.handleShutdown.bind(this))
  }

  // 注册消息处理器
  registerHandler(type, handler) {
    this.handlers.set(type, handler)
  }

  // 发送消息（同步）
  send(message) {
    if (typeof message === 'string') {
      message = { content: message }
    }
    
    const msg = new InProcessMessage(
      this.name,
      message.to || 'main',
      message.content,
      { type: message.type || 'message' }
    )
    
    return this.deliver(msg)
  }

  // 发送消息（异步）
  sendAsync(message) {
    return new Promise((resolve, reject) => {
      if (typeof message === 'string') {
        message = { content: message }
      }
      
      const msg = new InProcessMessage(
        this.name,
        message.to || 'main',
        message.content,
        { 
          type: message.type || 'message',
          callback: (result) => resolve(result)
        }
      )
      
      this.deliver(msg)
    })
  }

  // 投递消息
  deliver(message) {
    const handler = this.handlers.get(message.type)
    
    if (handler) {
      const result = handler(message)
      if (message.callback) {
        message.callback(result)
      }
      return result
    }
    
    if (this.defaultHandler) {
      const result = this.defaultHandler(message)
      if (message.callback) {
        message.callback(result)
      }
      return result
    }
    
    return { error: `No handler for message type: ${message.type}` }
  }

  // 处理普通消息
  handleMessage(message) {
    console.log(`[${this.name}] 收到消息: ${message.content.substring(0, 50)}...`)
    return { received: true }
  }

  // 处理关闭请求
  handleShutdown(message) {
    console.log(`[${this.name}] 收到关闭请求: ${message.reason}`)
    
    // 停止接收新任务
    this.isRunning = false
    
    // 保存状态
    this.saveState?.()
    
    // 清理资源
    this.cleanup?.()
    
    // 发送确认
    this.emit('shutdown_confirmed', { agent: this.name })
    
    return { shutdown: true, agent: this.name }
  }

  // 接收消息（外部调用）
  receive(message) {
    message.to = this.name
    return this.deliver(message)
  }

  // 开始运行
  start() {
    this.isRunning = true
    this.emit('started', { agent: this.name })
    this.processQueue()
  }

  // 处理消息队列
  async processQueue() {
    while (this.isRunning && this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      await this.deliver(message)
    }
  }

  // 设置当前任务
  setTask(task) {
    this.currentTask = task
    this.emit('task_started', { agent: this.name, task })
  }

  // 完成任务
  completeTask(result) {
    this.currentTask = null
    this.emit('task_completed', { agent: this.name, result })
    return result
  }

  // 获取状态
  getStatus() {
    return {
      name: this.name,
      type: this.agentType,
      isRunning: this.isRunning,
      queueLength: this.messageQueue.length,
      hasTask: !!this.currentTask,
      handlers: Array.from(this.handlers.keys())
    }
  }
}

/**
 * 消息总线（支持进程内和跨进程）
 */
class MessageBus extends EventEmitter {
  constructor() {
    super()
    this.inProcessTeammates = new Map()
    this.remoteTeammates = new Map()
    this.localHandler = null
  }

  // 注册进程内 Teammate
  registerInProcess(name, teammate) {
    this.inProcessTeammates.set(name, teammate)
    teammate.on('shutdown_confirmed', (data) => {
      this.emit('teammate_shutdown', data)
    })
    console.log(`[MessageBus] 注册进程内 teammate: ${name}`)
  }

  // 注册远程 Teammate
  registerRemote(name, connection) {
    this.remoteTeammates.set(name, connection)
    console.log(`[MessageBus] 注册远程 teammate: ${name}`)
  }

  // 注销 Teammate
  unregister(name) {
    this.inProcessTeammates.delete(name)
    this.remoteTeammates.delete(name)
    console.log(`[MessageBus] 注销 teammate: ${name}`)
  }

  // 发送消息（自动选择路径）
  send(message) {
    // 优先进程内
    if (this.inProcessTeammates.has(message.to)) {
      return this.sendInProcess(message)
    }
    
    // 远程
    if (this.remoteTeammates.has(message.to)) {
      return this.sendRemote(message)
    }
    
    return { error: `Teammate not found: ${message.to}` }
  }

  // 发送消息（异步）
  sendAsync(message) {
    return new Promise((resolve, reject) => {
      if (this.inProcessTeammates.has(message.to)) {
        const teammate = this.inProcessTeammates.get(message.to)
        const result = teammate.receive({ ...message, callback: resolve })
        if (result?.error) {
          reject(new Error(result.error))
        }
      } else if (this.remoteTeammates.has(message.to)) {
        // 远程需要实现...
        reject(new Error('Remote sendAsync not implemented'))
      } else {
        reject(new Error(`Teammate not found: ${message.to}`))
      }
    })
  }

  // 进程内发送
  sendInProcess(message) {
    const teammate = this.inProcessTeammates.get(message.to)
    return teammate.receive(message)
  }

  // 远程发送
  sendRemote(message) {
    // TODO: 实现远程通信
    console.log(`[MessageBus] 远程消息到 ${message.to}: ${message.content.substring(0, 50)}...`)
    return { sent: true, via: 'remote' }
  }

  // 广播
  broadcast(message) {
    const results = []
    for (const [name, teammate] of this.inProcessTeammates) {
      results.push(this.sendInProcess({ ...message, to: name }))
    }
    return results
  }

  // 获取状态
  getStatus() {
    return {
      inProcess: Array.from(this.inProcessTeammates.keys()),
      remote: Array.from(this.remoteTeammates.keys())
    }
  }
}

// 导出单例
const messageBus = new MessageBus()

module.exports = {
  InProcessMessage,
  InProcessTeammate,
  MessageBus,
  messageBus
}
