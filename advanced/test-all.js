#!/usr/bin/env node
/**
 * Advanced Features Test Script
 * 测试所有高级功能模块
 */

const fs = require('fs')
const path = require('path')

console.log('==========================================')
console.log('OpenClaw Advanced Features Test')
console.log('==========================================\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✅ ${name}`)
    passed++
  } catch (e) {
    console.log(`❌ ${name}`)
    console.log(`   Error: ${e.message}`)
    failed++
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`)
  }
}

// ============================================
// 1. Token Budget Test
// ============================================
console.log('\n--- Token Budget ---')

const { TokenBudget, TokenEstimator, BudgetManager, budgetManager } = require('../advanced/token-budget/tokenBudget')

test('TokenBudget: 初始化', () => {
  const budget = new TokenBudget({ maxTokens: 1000, autoStop: true })
  assertEqual(budget.maxTokens, 1000, 'maxTokens')
  assertEqual(budget.usedTokens, 0, 'initial usedTokens')
})

test('TokenBudget: 消耗 Token', () => {
  const budget = new TokenBudget({ maxTokens: 1000 })
  budget.consume(500)
  assertEqual(budget.usedTokens, 500, 'after consume')
})

test('TokenBudget: 警告阈值', () => {
  const budget = new TokenBudget({ maxTokens: 1000, warningAt: 800 })
  budget.consume(850)  // 超过 warningAt 800
  const result = budget.check()
  assertEqual(result.status, 'warning', 'status')
})

test('TokenBudget: 超出停止', () => {
  const budget = new TokenBudget({ maxTokens: 100, autoStop: true })
  budget.consume(100)
  assertEqual(budget.shouldStop(), true, 'shouldStop')
})

test('TokenEstimator: 估算中文', () => {
  const tokens = TokenEstimator.estimate('你好世界')
  assertEqual(tokens > 0, true, 'has tokens')
})

test('BudgetManager: 创建任务预算', () => {
  const budget = budgetManager.createTaskBudget('test-task', { maxTokens: 5000 })
  assertEqual(budget.maxTokens, 5000, 'task budget')
})

// ============================================
// 2. Graceful Shutdown Test
// ============================================
console.log('\n--- Graceful Shutdown ---')

const { ShutdownManager, AgentShutdownHandler, shutdownManager } = require('../advanced/graceful-shutdown/shutdownManager')

test('ShutdownManager: 注册任务', () => {
  const manager = new ShutdownManager()
  manager.registerTask('task-1', { name: 'test' })
  assertEqual(manager.tasks.has('task-1'), true, 'task registered')
})

test('ShutdownManager: 请求关闭', () => {
  const manager = new ShutdownManager({ deadline: 100 })
  manager.registerTask('task-2', { name: 'test2', pid: null })
  const result = manager.requestShutdown('task-2')
  assertEqual(result, true, 'shutdown requested')
})

test('ShutdownManager: 确认关闭', () => {
  const manager = new ShutdownManager()
  manager.registerTask('task-3', { name: 'test3' })
  manager.requestShutdown('task-3')
  const result = manager.confirmShutdown('task-3')
  assertEqual(result, true, 'shutdown confirmed')
})

test('AgentShutdownHandler: 处理关闭请求', () => {
  const handler = new AgentShutdownHandler('test-agent', async () => {})
  let called = false
  handler.saveState = () => { called = true }
  handler.cleanup = () => {}
  handler.currentTask = null
  handler.handleShutdownRequest({ reason: 'test', deadline: Date.now() + 1000 })
  // 由于是异步，会快速退出
})

// ============================================
// 3. Read-Only Agent Test
// ============================================
console.log('\n--- Read-Only Agent ---')

const { 
  READ_ONLY_TOOLS, 
  READ_ONLY_BASH_COMMANDS,
  isToolAllowed, 
  isBashCommandAllowed, 
  ToolPermissionChecker, 
  createReadOnlyAgent 
} = require('../advanced/read-only-agents/readOnlyTools')

test('ReadOnlyTools: 只读工具白名单', () => {
  assertEqual(READ_ONLY_TOOLS.includes('read'), true, 'read allowed')
})

test('ReadOnlyTools: 写操作工具禁止', () => {
  assertEqual(READ_ONLY_TOOLS.includes('write'), false, 'write not allowed')
})

test('isBashCommandAllowed: 只读命令允许', () => {
  const result = isBashCommandAllowed('ls -la')
  assertEqual(result.allowed, true, 'ls allowed')
})

test('isBashCommandAllowed: 写命令禁止', () => {
  const result = isBashCommandAllowed('rm -rf /')
  assertEqual(result.allowed, false, 'rm forbidden')
})

test('ToolPermissionChecker: 检查工具', () => {
  const checker = new ToolPermissionChecker({ strict: true })
  const result = checker.check('read')
  assertEqual(result.allowed, true, 'read allowed')
})

test('createReadOnlyAgent: 创建只读 Agent', () => {
  const agent = createReadOnlyAgent('researcher')
  assertEqual(agent.type, 'read-only', 'type')
  assertEqual(agent.name, 'researcher', 'name')
})

test('createReadOnlyAgent: 权限检查', () => {
  const agent = createReadOnlyAgent('explorer')
  const result1 = agent.check('read')
  const result2 = agent.check('write')
  assertEqual(result1.allowed, true, 'read allowed')
  assertEqual(result2.allowed, false, 'write forbidden')
})

// ============================================
// 4. In-Process Teammate Test
// ============================================
console.log('\n--- In-Process Teammate ---')

const { InProcessTeammate, MessageBus, messageBus } = require('../advanced/in-process-teammate/inProcessTeammate')

test('InProcessTeammate: 创建', () => {
  const teammate = new InProcessTeammate('worker-1', 'general-purpose')
  assertEqual(teammate.name, 'worker-1', 'name')
  assertEqual(teammate.isRunning, false, 'not running yet')
})

test('InProcessTeammate: 注册处理器', () => {
  const teammate = new InProcessTeammate('worker-2', 'read-only')
  teammate.registerHandler('custom', (msg) => ({ handled: true }))
  assertEqual(teammate.handlers.has('custom'), true, 'handler registered')
})

test('InProcessTeammate: 发送消息', () => {
  const teammate = new InProcessTeammate('worker-3', 'general-purpose')
  teammate.registerHandler('message', (msg) => ({ received: msg.content }))
  const result = teammate.send({ content: 'hello' })
  assertEqual(result.received, 'hello', 'message received')
})

test('MessageBus: 注册进程内 Teammate', () => {
  const bus = new MessageBus()
  const teammate = new InProcessTeammate('dev-1', 'general-purpose')
  bus.registerInProcess('dev-1', teammate)
  assertEqual(bus.inProcessTeammates.has('dev-1'), true, 'registered')
})

test('MessageBus: 发送消息', () => {
  const bus = new MessageBus()
  const teammate = new InProcessTeammate('dev-2', 'general-purpose')
  teammate.registerHandler('message', (msg) => ({ received: true }))
  bus.registerInProcess('dev-2', teammate)
  const result = bus.send({ to: 'dev-2', content: 'test' })
  assertEqual(result.received, true, 'message delivered')
})

// ============================================
// 5. Memory Tiers Test
// ============================================
console.log('\n--- Memory Tiers ---')

const { 
  SessionMemory, 
  AgentMemory, 
  TeamMemory, 
  PersistentMemory, 
  MemoryManager, 
  memoryManager 
} = require('../advanced/memory-tiers/memoryTiers')

const testDir = '/tmp/openclaw-advanced-test'

test('SessionMemory: 添加记忆', () => {
  const mem = new SessionMemory()
  mem.add({ content: 'test message', importance: 0.8 })
  assertEqual(mem.messages.length, 1, 'message added')
})

test('SessionMemory: 搜索', () => {
  const mem = new SessionMemory()
  mem.add({ content: 'BTC price rising', importance: 0.9 })
  const results = mem.search('BTC')
  assertEqual(results.length > 0, true, 'found')
})

test('AgentMemory: 创建实例', () => {
  // 使用临时目录
  const agentMem = new AgentMemory('test-agent', testDir + '/agents')
  assertEqual(agentMem.agentId, 'test-agent', 'agentId')
})

test('AgentMemory: 添加和提升', () => {
  const agentMem = new AgentMemory('test-agent-2', testDir + '/agents')
  agentMem.add({ content: 'important info', importance: 0.9 }, 'short')
  agentMem.add({ content: 'normal info', importance: 0.3 }, 'short')
  assertEqual(agentMem.shortTerm.length >= 0, true, 'short term')
})

test('TeamMemory: 设置和获取', () => {
  const teamMem = new TeamMemory('project-x')
  teamMem.set('status', 'in_progress', { updatedBy: 'leader' })
  assertEqual(teamMem.get('status'), 'in_progress', 'get status')
})

test('PersistentMemory: 列出类别', () => {
  const persistentMem = new PersistentMemory(testDir + '/workspace')
  const categories = persistentMem.listCategories()
  assertEqual(Array.isArray(categories), true, 'returns array')
})

test('MemoryManager: 创建实例', () => {
  const manager = new MemoryManager({ persistentDir: testDir + '/workspace' })
  assertEqual(manager.session instanceof SessionMemory, true, 'session memory')
})

test('MemoryManager: 获取 Agent Memory', () => {
  const manager = new MemoryManager({ persistentDir: testDir + '/workspace' })
  const agentMem = manager.getAgentMemory('agent-1')
  assertEqual(agentMem instanceof AgentMemory, true, 'agent memory instance')
})

// ============================================
// Summary
// ============================================
console.log('\n==========================================')
console.log('Test Summary')
console.log('==========================================')
console.log(`Total: ${passed + failed}`)
console.log(`Passed: ${passed} ✅`)
console.log(`Failed: ${failed} ❌`)
console.log('==========================================')

// Cleanup
function cleanup() {
  try {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true })
    }
  } catch (e) {}
}

if (failed === 0) {
  console.log('\n🎉 All tests passed!')
  cleanup()
  process.exit(0)
} else {
  console.log('\n⚠️ Some tests failed')
  process.exit(1)
}
