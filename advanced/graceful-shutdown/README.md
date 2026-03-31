# Graceful Shutdown

优雅关闭，Agent 收到关闭请求后可以保存状态、清理资源再退出。

## 问题

当前关闭 Agent 是强制杀进程：
- 可能丢失未保存的数据
- 资源没有正确清理
- 状态不一致

## 解决方案

三级关闭机制：

```javascript
// 1. 优雅关闭请求
{
  type: 'shutdown_request',
  reason: '任务完成',
  deadline: Date.now() + 5000  // 5秒后强制关闭
}

// 2. Agent 收到请求
async function handleShutdownRequest(message) {
  // 保存当前状态
  await saveState()
  
  // 清理资源
  await cleanup()
  
  // 发送确认
  sendMessage(message.from, {
    type: 'shutdown_ack',
    agent: myName
  })
  
  // 安全退出
  process.exit(0)
}

// 3. 如果超时，强制杀
setTimeout(() => {
  process.kill(pid, 'SIGKILL')
}, deadline - Date.now())
```

## 实现

### ShutdownManager

```javascript
class GracefulShutdownManager {
  constructor() {
    this.pendingShutdowns = new Map()
    this.deadline = 5000  // 默认5秒
  }

  // 请求关闭
  requestShutdown(targetAgent, reason = 'User requested') {
    const deadline = Date.now() + this.deadline
    
    this.pendingShutdowns.set(targetAgent, {
      reason,
      deadline,
      confirmed: false
    })

    // 发送关闭请求
    sendMessage(targetAgent, {
      type: 'shutdown_request',
      reason,
      deadline
    })

    // 设置强制关闭定时器
    setTimeout(() => {
      if (this.pendingShutdowns.has(targetAgent)) {
        this.forceKill(targetAgent)
      }
    }, deadline - Date.now())
  }

  // 确认关闭
  confirmShutdown(agentName) {
    const shutdown = this.pendingShutdowns.get(agentName)
    if (shutdown) {
      shutdown.confirmed = true
    }
  }

  // 强制杀
  forceKill(agentName) {
    const task = this.tasks.get(agentName)
    if (task) {
      task.kill()
      this.pendingShutdowns.delete(agentName)
    }
  }
}
```

### Agent 端处理

```javascript
// 在 Agent 运行时添加 shutdown 监听
process.on('message', async (message) => {
  if (message.type === 'shutdown_request') {
    console.log('收到关闭请求:', message.reason)
    
    // 1. 停止接收新任务
    this.acceptingTasks = false
    
    // 2. 等待当前任务完成（如果有）
    if (this.currentTask) {
      await this.currentTask.waitForCompletion()
    }
    
    // 3. 保存状态
    await this.saveState()
    
    // 4. 清理资源
    await this.cleanup()
    
    // 5. 确认关闭
    sendMessage(message.from, {
      type: 'shutdown_ack',
      agent: this.name
    })
    
    // 6. 安全退出
    process.exit(0)
  }
})
```

### TeamManager 集成

```javascript
// TeamManager.delete 改用优雅关闭
async function teamDelete(teamName) {
  const team = this.teams.get(teamName)
  
  // 向所有成员发送关闭请求
  for (const member of team.members) {
    await this.shutdownManager.requestShutdown(member.name, 'Team deleted')
  }
  
  // 等待确认或超时
  await this.waitForAllShutdowns(team.members)
  
  // 清理团队
  this.teams.delete(teamName)
}
```

## 关闭流程图

```
主 Agent                    Teammate
    |                          |
    |--- shutdown_request ----->|
    |                          |
    |                     1. 停止接任务
    |                     2. 等待当前完成
    |                     3. 保存状态
    |                     4. 清理资源
    |                     5. shutdown_ack
    |<---- acknowledgment -----|
    |                          |
    |                     (安全退出)
    |                          X
    |
    (继续其他任务)
```

## 状态持久化

```javascript
// 保存的内容
const stateToSave = {
  name: this.name,
  currentTask: this.currentTask,
  completedTasks: this.completedTasks,
  memory: this.memory.extract(),
  pendingMessages: this.pendingMessages,
  timestamp: Date.now()
}
```

## 安装

```bash
# 自动包含在主安装中
# 或单独安装
cd advanced/graceful-shutdown
npm install
```

---

参考：Claude Code 的 `shutdown_request` 消息类型。
