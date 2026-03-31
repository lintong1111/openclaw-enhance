# Memory Tiers

多层记忆系统，分级存储不同类型的信息。

## 问题

当前只有单一的记忆存储：
- 所有信息都存在 `.learnings/`
- 不区分重要程度
- 不区分使用频率
- 查询效率低

## 解决方案

四层记忆架构：

```
┌─────────────────────────────────────┐
│  Session Memory     (当前会话)       │  ← 内存
├─────────────────────────────────────┤
│  Team Memory        (团队共享)       │  ← 进程内存
├─────────────────────────────────────┤
│  Agent Memory       (Agent 私有)     │  ← 磁盘
├─────────────────────────────────────┤
│  Persistent Memory (持久化)         │  ← 文件系统
└─────────────────────────────────────┘
```

## 各层说明

### 1. Session Memory（会话记忆）

当前会话内的信息，内存存储，会话结束清除。

```javascript
class SessionMemory {
  constructor() {
    this.messages = []      // 对话历史
    this.context = {}         // 当前上下文
    this.shortTerm = []      // 短期记忆（最近 N 条）
  }

  // 添加消息
  add(message) {
    this.messages.push(message)
    this.shortTerm.push(message)
    
    // 只保留最近 10 条短期记忆
    if (this.shortTerm.length > 10) {
      this.shortTerm.shift()
    }
  }

  // 获取相关记忆
  search(query) {
    return this.shortTerm.filter(msg => 
      msg.content.includes(query)
    )
  }
}
```

### 2. Team Memory（团队共享记忆）

团队成员共享的信息，进程内共享。

```javascript
class TeamMemory {
  constructor(teamId) {
    this.teamId = teamId
    this.shared = {}           // 共享数据
    this.syncInterval = 5000    // 同步间隔
  }

  // 设置共享数据
  set(key, value) {
    this.shared[key] = {
      value,
      updatedBy: currentAgent,
      timestamp: Date.now()
    }
  }

  // 获取共享数据
  get(key) {
    return this.shared[key]?.value
  }

  // 广播更新
  async broadcast() {
    // 通知所有团队成员
    for (const member of this.members) {
      await sendMessage(member, {
        type: 'memory_sync',
        data: this.shared
      })
    }
  }
}
```

### 3. Agent Memory（Agent 私有记忆）

单个 Agent 的私有记忆，持久化到磁盘。

```javascript
class AgentMemory {
  constructor(agentId) {
    this.agentId = agentId
    this.memoryDir = `~/.openclaw/agents/${agentId}/memory/`
    this.shortTerm = this.load('short-term.json') || []
    this.longTerm = this.load('long-term.json') || []
  }

  // 添加记忆
  add(memory, type = 'short') {
    const entry = {
      content: memory,
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    }

    if (type === 'short') {
      this.shortTerm.push(entry)
      // 短期记忆超过 100 条时提升到长期
      if (this.shortTerm.length > 100) {
        this.promote(this.shortTerm.shift())
      }
    } else {
      this.longTerm.push(entry)
    }

    this.save()
  }

  // 提升到长期记忆
  promote(memory) {
    this.longTerm.push({
      ...memory,
      promotedAt: Date.now()
    })
  }

  // 搜索记忆
  search(query) {
    const results = [
      ...this.shortTerm,
      ...this.longTerm
    ].filter(m => m.content.includes(query))
      .sort((a, b) => b.accessCount - a.accessCount)  // 按访问频率排序

    return results
  }
}
```

### 4. Persistent Memory（持久化记忆）

永久存储，跨会话持久化。

```javascript
class PersistentMemory {
  constructor() {
    this.memoryFile = '~/.openclaw/workspace/MEMORY.md'
    this.learningsDir = '~/.openclaw/workspace/.learnings/'
  }

  // 写入 MEMORY.md
  write(category, content) {
    const entry = `## ${new Date().toISOString()}\n\n${content}`
    appendToFile(this.memoryFile, entry)
  }

  // 读取相关记忆
  read(query) {
    const content = readFile(this.memoryFile)
    return this.extractRelevant(content, query)
  }

  // 从 learnings 提取
  extractFromLearnings() {
    const files = [
      'LEARNINGS.md',
      'ERRORS.md',
      'FEATURE_REQUESTS.md'
    ]

    return files.flatMap(file => {
      const content = readFile(path.join(this.learningsDir, file))
      return this.parseEntries(content)
    })
  }
}
```

## Memory Manager（统一管理）

```javascript
class MemoryManager {
  constructor() {
    this.session = new SessionMemory()
    this.teams = new Map()      // teamId -> TeamMemory
    this.agents = new Map()     // agentId -> AgentMemory
    this.persistent = new PersistentMemory()
  }

  // 搜索所有层级
  search(query) {
    return {
      session: this.session.search(query),
      team: this.currentTeam?.search(query) || [],
      agent: this.currentAgent?.search(query) || [],
      persistent: this.persistent.read(query)
    }
  }

  // 自动存档
  autoArchive() {
    // 1. 从 session 提取重要信息
    const important = this.session.shortTerm
      .filter(m => m.importance > 0.8)

    // 2. 写入 agent memory
    for (const memory of important) {
      this.currentAgent.add(memory.content, 'long')
    }

    // 3. 持久化
    for (const memory of important) {
      if (memory.permanent) {
        this.persistent.write('important', memory.content)
      }
    }
  }

  // 记忆压缩
  compact() {
    // 1. 合并相似的 agent memory
    this.currentAgent?.compact()

    // 2. 提取关键点到 persistent
    const summary = this.currentAgent?.summarize()
    if (summary) {
      this.persistent.write('summary', summary)
    }
  }
}
```

## 记忆流动

```
用户消息
    ↓
Session Memory (短期)
    ↓ (访问频率高)
Agent Memory (长期)
    ↓ (明确重要)
Persistent Memory (永久)
    ↓
MEMORY.md / .learnings/
```

## 记忆优先级

| 优先级 | 存储层 | 淘汰策略 |
|--------|--------|----------|
| 🔴 最高 | Persistent | 永不淘汰 |
| 🟠 高 | Agent Memory | 访问频率低的压缩 |
| 🟡 中 | Team Memory | 团队解散后清除 |
| 🟢 低 | Session Memory | 会话结束清除 |

## 使用场景

```javascript
// 1. 用户说"记住这个偏好"
memory.persistent.write('preference', '用户喜欢简洁的回复')

// 2. 用户说"之前的项目用了什么技术"
memory.search('之前项目')

// 3. 新会话开始
memory.loadFromPersistent()

// 4. 团队协作
memory.joinTeam('project-x')
memory.team.set('current-task', 'API 设计')

// 5. 记忆搜索
const results = memory.search('BTC')
// 返回所有层级的相关记忆
```

## 安装

```bash
# 自动包含在主安装中
# 或单独安装
cd advanced/memory-tiers
npm install
```

---

参考：Claude Code 的 `SessionMemory`、`TeamMemorySync`、`agentMemory` 多层记忆系统。
