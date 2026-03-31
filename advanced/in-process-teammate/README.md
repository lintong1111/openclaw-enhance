# In-Process Teammate

进程内 Teammate，Agent 之间通信更快，不需要跨进程。

## 问题

当前的多 Agent 协作是跨进程的：
- Agent 之间通信有延迟
- 需要序列化/反序列化消息
- 状态同步复杂

## 解决方案

同一进程内的 Teammate：

```javascript
// 进程内通信 vs 跨进程通信
// 
// 跨进程 (slow):
//   Main Agent → IPC → Teammate Process → IPC → Main Agent
//
// 进程内 (fast):
//   Main Agent → Function Call → Teammate → Return
```

## 实现

### 消息格式

```javascript
// In-process message（函数调用）
{
  type: 'in-process',
  from: 'main',
  to: 'researcher',
  content: '分析这段代码',
  callback: (result) => { ... }
}

// vs 跨进程 message
{
  type: 'ipc',
  from: 'main',
  to: 'researcher',
  content: '分析这段代码'
}
```

### 核心类

```javascript
class InProcessTeammate {
  constructor(name, agentType, config) {
    this.name = name
    this.type = agentType
    this.agent = null
    this.messageQueue = []
  }

  // 发送消息（直接调用）
  send(message) {
    const result = this.processMessage(message)
    if (message.callback) {
      message.callback(result)
    }
    return result
  }

  // 接收消息
  receive(message) {
    this.messageQueue.push(message)
    return this.processQueue()
  }

  // 处理消息
  async processMessage(message) {
    // 处理并返回结果
  }
}
```

### MessageBus 增强

```javascript
// 扩展现有 MessageBus
class MessageBus {
  constructor() {
    this.inProcessTeammates = new Map()
    this.remoteTeammates = new Map()
  }

  // 注册进程内 Teammate
  registerInProcess(name, teammate) {
    this.inProcessTeammates.set(name, teammate)
  }

  // 自动选择最快的路径
  send(message) {
    if (this.inProcessTeammates.has(message.to)) {
      return this.sendInProcess(message)
    }
    return this.sendRemote(message)
  }
}
```

## 工作流程

```
1. 主 Agent 创建 Team
   → TeamManager.create('project-x')

2. 添加进程内 Teammate
   → TeamManager.addMember('project-x', 'researcher', 'read-only', {
       inProcess: true
     })

3. Teammate 注册到 MessageBus
   → MessageBus.registerInProcess('researcher', teammate)

4. 主 Agent 发消息
   → MessageBus.send({ to: 'researcher', content: '...' })
   → 直接函数调用，无需 IPC

5. 快速响应
   → researcher.processMessage(message)
   → 立即返回结果
```

## 适用场景

| 场景 | 推荐 |
|------|------|
| 需要快速响应的协作 | 进程内 |
| 独立的长时间任务 | 跨进程 |
| 资源密集型任务 | 跨进程 |
| 简单查询 | 进程内 |

## 安装

自动包含在 `openclaw-enhance` 主安装中。

---

参考：Claude Code 的 `in_process_teammate` 任务类型。
