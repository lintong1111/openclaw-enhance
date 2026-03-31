/**
 * Memory Tiers
 * 多层记忆系统
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

function expandUser(p) {
  if (p.startsWith('~/')) {
    return path.join(os.homedir(), p.slice(2))
  }
  return p
}

/**
 * Session Memory（会话记忆）
 * 当前会话内的信息，内存存储
 */
class SessionMemory {
  constructor(maxShortTerm = 20) {
    this.messages = []
    this.context = {}
    this.shortTerm = []
    this.maxShortTerm = maxShortTerm
    this.metadata = {
      createdAt: Date.now(),
      lastAccessed: Date.now()
    }
  }

  // 添加消息
  add(entry) {
    const memoryEntry = {
      id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: entry.content || entry,
      type: entry.type || 'message',
      importance: entry.importance || 0.5,
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      tags: entry.tags || []
    }

    this.messages.push(memoryEntry)
    this.shortTerm.push(memoryEntry)

    // 只保留最近 N 条短期记忆
    if (this.shortTerm.length > this.maxShortTerm) {
      const removed = this.shortTerm.shift()
      // 重要的提升到长期
      if (removed.importance > 0.8) {
        return { promoted: true, entry: removed }
      }
    }

    this.metadata.lastAccessed = Date.now()
    return { promoted: false }
  }

  // 搜索
  search(query) {
    const q = query.toLowerCase()
    return this.messages.filter(m => {
      if (typeof m.content === 'string') {
        return m.content.toLowerCase().includes(q)
      }
      return false
    }).sort((a, b) => {
      // 按相关度和访问频率排序
      const scoreA = a.accessCount + (a.content.toLowerCase().includes(q) ? 10 : 0)
      const scoreB = b.accessCount + (b.content.toLowerCase().includes(q) ? 10 : 0)
      return scoreB - scoreA
    })
  }

  // 获取最近
  getRecent(n = 5) {
    return this.shortTerm.slice(-n)
  }

  // 获取统计
  getStats() {
    return {
      total: this.messages.length,
      shortTerm: this.shortTerm.length,
      created: this.metadata.createdAt,
      lastAccessed: this.metadata.lastAccessed
    }
  }

  // 清空
  clear() {
    this.messages = []
    this.shortTerm = []
  }
}

/**
 * Agent Memory（Agent 私有记忆）
 */
class AgentMemory {
  constructor(agentId, baseDir = '~/.openclaw/agents') {
    this.agentId = agentId
    this.baseDir = expandUser(baseDir)
    this.memoryDir = path.join(this.baseDir, agentId, 'memory')
    this.shortTermFile = path.join(this.memoryDir, 'short-term.json')
    this.longTermFile = path.join(this.memoryDir, 'long-term.json')
    
    this.shortTerm = []
    this.longTerm = []
    
    this.ensureDir()
    this.load()
  }

  ensureDir() {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true })
    }
  }

  load() {
    try {
      if (fs.existsSync(this.shortTermFile)) {
        this.shortTerm = JSON.parse(fs.readFileSync(this.shortTermFile, 'utf-8'))
      }
      if (fs.existsSync(this.longTermFile)) {
        this.longTerm = JSON.parse(fs.readFileSync(this.longTermFile, 'utf-8'))
      }
    } catch (e) {
      console.error(`[AgentMemory] Load error: ${e.message}`)
    }
  }

  save() {
    try {
      fs.writeFileSync(this.shortTermFile, JSON.stringify(this.shortTerm, null, 2))
      fs.writeFileSync(this.longTermFile, JSON.stringify(this.longTerm, null, 2))
    } catch (e) {
      console.error(`[AgentMemory] Save error: ${e.message}`)
    }
  }

  // 添加记忆
  add(entry, type = 'short') {
    const memoryEntry = {
      id: `am-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: entry.content || entry,
      type: entry.type || 'learned',
      importance: entry.importance || 0.5,
      source: entry.source || 'session',
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      tags: entry.tags || []
    }

    if (type === 'short') {
      this.shortTerm.push(memoryEntry)
      
      // 超过100条时提升
      if (this.shortTerm.length > 100) {
        const removed = this.shortTerm.shift()
        this.promote(removed)
      }
    } else {
      this.longTerm.push(memoryEntry)
    }

    this.save()
    return memoryEntry
  }

  // 提升到长期
  promote(entry) {
    const promoted = {
      ...entry,
      promotedAt: Date.now()
    }
    this.longTerm.push(promoted)
    return promoted
  }

  // 搜索
  search(query) {
    const q = query.toLowerCase()
    const results = [
      ...this.shortTerm,
      ...this.longTerm
    ].filter(m => {
      if (typeof m.content === 'string') {
        return m.content.toLowerCase().includes(q)
      }
      return false
    }).map(m => {
      m.accessCount++
      m.lastAccessed = Date.now()
      return m
    }).sort((a, b) => {
      return (b.accessCount + b.importance * 5) - (a.accessCount + a.importance * 5)
    })

    return results
  }

  // 提取摘要
  summarize(limit = 10) {
    return this.longTerm
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit)
      .map(m => ({
        content: m.content,
        importance: m.importance,
        createdAt: m.createdAt
      }))
  }

  // 压缩
  compact() {
    // 合并相似的记忆
    const merged = new Map()
    
    for (const m of this.longTerm) {
      const key = m.content.substring(0, 50)
      if (merged.has(key)) {
        const existing = merged.get(key)
        existing.accessCount += m.accessCount
        existing.importance = Math.max(existing.importance, m.importance)
      } else {
        merged.set(key, { ...m })
      }
    }
    
    this.longTerm = Array.from(merged.values())
    this.save()
  }

  getStats() {
    return {
      agentId: this.agentId,
      shortTerm: this.shortTerm.length,
      longTerm: this.longTerm.length
    }
  }
}

/**
 * Team Memory（团队共享记忆）
 */
class TeamMemory {
  constructor(teamId) {
    this.teamId = teamId
    this.shared = new Map()
    this.syncInterval = 5000
    this.listeners = []
  }

  // 设置共享数据
  set(key, value, metadata = {}) {
    this.shared.set(key, {
      value,
      updatedBy: metadata.updatedBy || 'unknown',
      timestamp: Date.now(),
      version: (this.shared.get(key)?.version || 0) + 1
    })
    this.notify()
  }

  // 获取共享数据
  get(key) {
    const entry = this.shared.get(key)
    return entry?.value
  }

  // 获取所有
  getAll() {
    const result = {}
    for (const [key, entry] of this.shared) {
      result[key] = entry.value
    }
    return result
  }

  // 删除
  delete(key) {
    this.shared.delete(key)
  }

  // 监听变化
  listen(callback) {
    this.listeners.push(callback)
  }

  notify() {
    const data = this.getAll()
    for (const listener of this.listeners) {
      listener(data)
    }
  }

  clear() {
    this.shared.clear()
  }

  getStats() {
    return {
      teamId: this.teamId,
      entries: this.shared.size
    }
  }
}

/**
 * Persistent Memory（持久化记忆）
 */
class PersistentMemory {
  constructor(baseDir = '~/.openclaw/workspace') {
    this.baseDir = expandUser(baseDir)
    this.learningsDir = path.join(this.baseDir, '.learnings')
    this.memoryFile = path.join(this.baseDir, 'MEMORY.md')
    
    this.ensureDir()
  }

  ensureDir() {
    if (!fs.existsSync(this.learningsDir)) {
      fs.mkdirSync(this.learningsDir, { recursive: true })
    }
  }

  // 写入
  write(category, content, metadata = {}) {
    const entry = {
      id: `pm-${Date.now()}`,
      category,
      content,
      createdAt: new Date().toISOString(),
      tags: metadata.tags || [],
      importance: metadata.importance || 0.5
    }

    const file = path.join(this.learningsDir, `${category}.md`)
    const content_str = `\n## ${entry.createdAt}\n\n${content}\n`

    try {
      fs.appendFileSync(file, content_str, 'utf-8')
      return entry
    } catch (e) {
      console.error(`[PersistentMemory] Write error: ${e.message}`)
      return null
    }
  }

  // 读取
  read(category, query = null) {
    const file = path.join(this.learningsDir, `${category}.md`)
    
    if (!fs.existsSync(file)) {
      return []
    }

    let content = fs.readFileSync(file, 'utf-8')
    
    if (query) {
      const q = query.toLowerCase()
      content = content.split('\n## ')
        .filter(block => block.toLowerCase().includes(q))
        .join('\n## ')
    }

    return content
  }

  // 列出所有类别
  listCategories() {
    if (!fs.existsSync(this.learningsDir)) {
      return []
    }
    return fs.readdirSync(this.learningsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
  }

  getStats() {
    const categories = this.listCategories()
    const stats = {}
    for (const cat of categories) {
      const file = path.join(this.learningsDir, `${cat}.md`)
      const content = fs.readFileSync(file, 'utf-8')
      stats[cat] = content.split('## ').length - 1
    }
    return stats
  }
}

/**
 * Memory Manager（统一管理）
 */
class MemoryManager {
  constructor(config = {}) {
    this.session = new SessionMemory()
    this.teams = new Map()
    this.agents = new Map()
    this.persistent = new PersistentMemory(config.persistentDir)
  }

  // 获取/创建 Agent Memory
  getAgentMemory(agentId) {
    if (!this.agents.has(agentId)) {
      this.agents.set(agentId, new AgentMemory(agentId))
    }
    return this.agents.get(agentId)
  }

  // 获取/创建 Team Memory
  getTeamMemory(teamId) {
    if (!this.teams.has(teamId)) {
      this.teams.set(teamId, new TeamMemory(teamId))
    }
    return this.teams.get(teamId)
  }

  // 搜索所有层级
  search(query) {
    return {
      session: this.session.search(query),
      agent: [], // 需要指定 agent
      team: [],  // 需要指定 team
      persistent: this.persistent.read(null, query)
    }
  }

  // 记忆存档
  archive(agentId, importantOnly = true) {
    const agentMemory = this.getAgentMemory(agentId)
    const recent = this.session.getRecent(20)
    
    for (const m of recent) {
      if (!importantOnly || m.importance > 0.7) {
        agentMemory.add({
          content: m.content,
          type: m.type,
          importance: m.importance,
          source: 'session_archive'
        }, 'short')
      }
    }
  }

  // 获取统计
  getStats() {
    return {
      session: this.session.getStats(),
      agents: Array.from(this.agents.keys()).map(id => 
        this.agents.get(id).getStats()
      ),
      teams: Array.from(this.teams.keys()).map(id =>
        this.teams.get(id).getStats()
      ),
      persistent: this.persistent.getStats()
    }
  }
}

// 导出单例
const memoryManager = new MemoryManager()

module.exports = {
  SessionMemory,
  AgentMemory,
  TeamMemory,
  PersistentMemory,
  MemoryManager,
  memoryManager
}
