/**
 * OpenClaw Hook System
 * Enhanced Hook system for intercepting events and executing custom logic
 */

const fs = require('fs');
const path = require('path');
const { exec: execAsync } = require('child_process');
const yaml = require('js-yaml');

// ============================================================================
// Types & Constants
// ============================================================================

/**
 * @typedef {'PreToolUse' | 'PostToolUse' | 'Stop' | 'SessionStart' | 'SessionEnd' | 'PreToolUse_MCP'} HookEvent
 */

/**
 * @typedef {'policySettings' | 'userSettings' | 'projectSettings' | 'localSettings' | 'pluginHook' | 'sessionHook' | 'builtinHook'} HookSource
 */

/**
 * @typedef {{ type: 'command', command: string, shell?: string, if?: string }} HookCommandCommand
 * @typedef {{ type: 'prompt', prompt: string, if?: string }} HookCommandPrompt
 * @typedef {{ type: 'agent', prompt: string, if?: string }} HookCommandAgent
 * @typedef {{ type: 'http', url: string, if?: string }} HookCommandHttp
 * @typedef {HookCommandCommand | HookCommandPrompt | HookCommandAgent | HookCommandHttp} HookCommand
 */

/**
 * @typedef {Object} HookEntry
 * @property {string} name
 * @property {HookSource} source
 * @property {boolean} [enabled=true]
 * @property {HookCommand[]} commands
 */

/**
 * @typedef {Object} HookContext
 * @property {Object} [tool] - tool.name, tool.args
 * @property {Object} [session] - session.id, session.duration, session.messages
 * @property {Object} [event] - event.type
 * @property {Object} [context] - context.channel, context.model, etc.
 */

/**
 * @typedef {Object} HookResult
 * @property {boolean} success
 * @property {string} [output]
 * @property {string} [error]
 */

// 7级优先级 (数字越小优先级越高)
const SOURCE_PRIORITY = {
  'policySettings': 1,   // 托管策略(最高)
  'userSettings': 2,     // 用户设置
  'projectSettings': 3, // 项目设置
  'localSettings': 4,    // 本地设置
  'pluginHook': 5,       // 插件Hook
  'sessionHook': 6,       // 会话Hook
  'builtinHook': 7,       // 内置Hook(最低)
};

// 所有支持的事件类型
const VALID_EVENTS = [
  'PreToolUse',
  'PostToolUse',
  'Stop',
  'SessionStart',
  'SessionEnd',
  'PreToolUse_MCP'
];

// ============================================================================
// Hook Store (In-Memory)
// ============================================================================

class HookStore {
  constructor() {
    /** @type {Map<HookEvent, HookEntry[]>} */
    this.hooks = new Map();
    
    // 初始化所有事件类型
    for (const event of VALID_EVENTS) {
      this.hooks.set(event, []);
    }
  }

  /**
   * Register a hook for an event
   * @param {HookEvent} event 
   * @param {HookEntry} hookEntry 
   */
  registerHook(event, hookEntry) {
    if (!VALID_EVENTS.includes(event)) {
      throw new Error(`Invalid event type: ${event}`);
    }
    
    const hooks = this.hooks.get(event);
    
    // 检查是否已存在同名hook
    const existingIndex = hooks.findIndex(h => h.name === hookEntry.name);
    if (existingIndex >= 0) {
      hooks[existingIndex] = { ...hookEntry, source: hookEntry.source || 'builtinHook' };
    } else {
      hooks.push({
        enabled: true,
        ...hookEntry,
        source: hookEntry.source || 'builtinHook'
      });
    }
    
    // 按优先级排序
    hooks.sort((a, b) => {
      const priorityA = SOURCE_PRIORITY[a.source] || 7;
      const priorityB = SOURCE_PRIORITY[b.source] || 7;
      return priorityA - priorityB;
    });
  }

  /**
   * Remove a hook by name
   * @param {HookEvent} event 
   * @param {string} name 
   */
  removeHook(event, name) {
    const hooks = this.hooks.get(event);
    if (hooks) {
      const index = hooks.findIndex(h => h.name === name);
      if (index >= 0) {
        hooks.splice(index, 1);
      }
    }
  }

  /**
   * Get all hooks for an event (sorted by priority)
   * @param {HookEvent} event 
   * @returns {HookEntry[]}
   */
  getHooksForEvent(event) {
    return this.hooks.get(event) || [];
  }

  /**
   * Get all registered hooks
   * @returns {Map<HookEvent, HookEntry[]>}
   */
  getAllHooks() {
    return this.hooks;
  }

  /**
   * Clear all hooks for an event or all
   * @param {HookEvent} [event]
   */
  clearHooks(event) {
    if (event) {
      this.hooks.set(event, []);
    } else {
      for (const evt of VALID_EVENTS) {
        this.hooks.set(evt, []);
      }
    }
  }
}

// 全局 Hook Store
const globalHookStore = new HookStore();

// ============================================================================
// Condition Matching
// ============================================================================

/**
 * Match a condition string against context
 * @param {string} condition - e.g., "tool.name == 'exec'"
 * @param {HookContext} context 
 * @returns {boolean}
 */
function matchCondition(condition, context = {}) {
  if (!condition || condition.trim() === '') {
    return true; // 空条件始终匹配
  }

  try {
    // 构建求值上下文
    const evalContext = buildEvalContext(context);
    
    // 安全替换变量引用
    let safeCondition = condition;
    
    // 处理字符串字面量中的引号，避免替换
    const stringLiterals = [];
    safeCondition = safeCondition.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
      stringLiterals.push(match);
      return `__STRING_LITERAL_${stringLiterals.length - 1}__`;
    });

    // 替换变量访问为安全访问
    // tool.name -> evalContext.tool?.name
    safeCondition = safeCondition.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\b/g, 
      (match, obj, prop) => {
        if (['Math', 'JSON', 'Date', 'Array', 'String', 'Number', 'Boolean', 'RegExp'].includes(obj)) {
          return match;
        }
        return `((${obj} && ${obj}.${prop}) || ${obj}?.${prop} || '')`;
      }
    );

    // 还原字符串字面量
    stringLiterals.forEach((lit, i) => {
      safeCondition = safeCondition.replace(`__STRING_LITERAL_${i}__`, lit);
    });

    // 处理函数调用 (startsWith, endsWith, contains, etc.)
    safeCondition = safeCondition.replace(/\b(\w+)\s*\.\s*(startsWith|endsWith|contains|includes|length)\s*\(/g, 
      (match, obj, method) => {
        if (['Math', 'JSON', 'Date', 'Array', 'String', 'Number', 'Boolean', 'RegExp'].includes(obj)) {
          return match;
        }
        return `${obj}?.${method}(`;
      }
    );

    // 创建沙箱函数进行求值
    const safeEval = new Function(
      'context',
      `with (context) { return !!( ${safeCondition} ); }`
    );
    
    return safeEval(evalContext);
  } catch (error) {
    console.error(`Condition matching error: ${error.message}`, { condition, context });
    return false;
  }
}

/**
 * Build evaluation context from HookContext
 * @param {HookContext} context 
 * @returns {Object}
 */
function buildEvalContext(context) {
  const evalContext = {
    // 工具信息
    tool: context.tool || {},
    // 会话信息
    session: context.session || {},
    // 事件信息
    event: context.event || {},
    // 额外上下文
    ...context.context,
    
    // 辅助函数
    startsWith: (str, prefix) => String(str || '').startsWith(prefix),
    endsWith: (str, suffix) => String(str || '').endsWith(suffix),
    contains: (str, search) => String(str || '').includes(search),
    includes: (arr, item) => Array.isArray(arr) && arr.includes(item),
  };
  
  return evalContext;
}

// ============================================================================
// Template Interpolation
// ============================================================================

/**
 * Interpolate variables in a string
 * @param {string} template 
 * @param {HookContext} context 
 * @returns {string}
 */
function interpolate(template, context = {}) {
  if (!template) return template;
  
  const evalContext = buildEvalContext(context);
  
  try {
    // 支持 {{variable.path}} 语法
    let result = template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = getNestedValue(evalContext, path.trim());
      return value !== undefined ? String(value) : match;
    });
    
    return result;
  } catch (error) {
    console.error(`Interpolation error: ${error.message}`, { template, context });
    return template;
  }
}

/**
 * Get nested value from object by path
 * @param {Object} obj 
 * @param {string} path - e.g., "tool.name"
 * @returns {*}
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// ============================================================================
// Hook Execution
// ============================================================================

/**
 * Execute a single hook command
 * @param {HookCommand} command 
 * @param {HookContext} context 
 * @returns {Promise<HookResult>}
 */
async function executeCommand(command, context = {}) {
  const { type } = command;
  
  try {
    switch (type) {
      case 'command': {
        const shell = command.shell || '/bin/bash';
        let cmd = interpolate(command.command, context);
        
        return new Promise((resolve) => {
          execAsync(cmd, { shell }, (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, error: error.message, output: stderr });
            } else {
              resolve({ success: true, output: stdout || stderr });
            }
          });
        });
      }
      
      case 'prompt': {
        const prompt = interpolate(command.prompt, context);
        return { success: true, output: prompt, type: 'prompt' };
      }
      
      case 'agent': {
        const prompt = interpolate(command.prompt, context);
        return { success: true, output: prompt, type: 'agent' };
      }
      
      case 'http': {
        const url = interpolate(command.url, context);
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...command.headers
            }
          });
          const data = await response.text();
          return { 
            success: response.ok, 
            output: data,
            status: response.status 
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
      
      default:
        return { success: false, error: `Unknown command type: ${type}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Execute all commands in a hook entry
 * @param {HookEntry} hookEntry 
 * @param {HookContext} context 
 * @returns {Promise<HookResult[]>}
 */
async function executeHook(hookEntry, context = {}) {
  if (!hookEntry.enabled) {
    return [{ success: true, output: 'Hook disabled, skipping' }];
  }
  
  const results = [];
  
  for (const command of hookEntry.commands || []) {
    // 检查条件
    if (command.if && !matchCondition(command.if, context)) {
      results.push({ success: true, output: 'Condition not met, skipping', skipped: true });
      continue;
    }
    
    const result = await executeCommand(command, context);
    results.push(result);
    
    // 如果命令失败，默认继续执行后续命令
    // 可以通过配置添加 stopOnError 行为
  }
  
  return results;
}

// ============================================================================
// Configuration Loading
// ============================================================================

/**
 * Load hook configuration from file
 * @param {string} configPath 
 * @returns {HookStore}
 */
function loadHookConfig(configPath) {
  const defaultPath = path.join(process.env.HOME || '/home/tony', '.openclaw', 'hooks.yaml');
  const filePath = configPath || defaultPath;
  
  const store = new HookStore();
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = yaml.load(content);
      
      if (config && config.hooks) {
        for (const [event, hooks] of Object.entries(config.hooks)) {
          if (VALID_EVENTS.includes(event)) {
            for (const hook of hooks) {
              if (hook.enabled !== false) {
                store.registerHook(event, hook);
              }
            }
          }
        }
      }
      
      console.log(`Loaded hooks from: ${filePath}`);
    } else {
      console.log(`Hook config not found at: ${filePath}, using empty store`);
    }
  } catch (error) {
    console.error(`Error loading hook config: ${error.message}`, error);
  }
  
  return store;
}

/**
 * Save hook configuration to file
 * @param {HookStore} store 
 * @param {string} configPath 
 */
function saveHookConfig(store, configPath) {
  const defaultPath = path.join(process.env.HOME || '/home/tony', '.openclaw', 'hooks.yaml');
  const filePath = configPath || defaultPath;
  
  try {
    const config = {
      version: '1.0',
      hooks: {}
    };
    
    for (const [event, hooks] of store.getAllHooks()) {
      if (hooks.length > 0) {
        config.hooks[event] = hooks;
      }
    }
    
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, yaml.dump(config), 'utf8');
    console.log(`Saved hooks to: ${filePath}`);
  } catch (error) {
    console.error(`Error saving hook config: ${error.message}`, error);
    throw error;
  }
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Get hooks for a specific event
 * @param {HookEvent} event 
 * @param {HookStore} [store] - optional custom store
 * @returns {HookEntry[]}
 */
function getHooksForEvent(event, store = globalHookStore) {
  return store.getHooksForEvent(event);
}

/**
 * Register a hook
 * @param {HookEvent} event 
 * @param {HookEntry} hookEntry 
 * @param {HookStore} [store]
 */
function registerHook(event, hookEntry, store = globalHookStore) {
  store.registerHook(event, hookEntry);
}

/**
 * Remove a hook
 * @param {HookEvent} event 
 * @param {string} name 
 * @param {HookStore} [store]
 */
function removeHook(event, name, store = globalHookStore) {
  store.removeHook(event, name);
}

/**
 * Trigger all hooks for an event
 * @param {HookEvent} event 
 * @param {HookContext} context 
 * @param {HookStore} [store]
 * @returns {Promise<HookResult[]>}
 */
async function triggerHooks(event, context = {}, store = globalHookStore) {
  const hooks = store.getHooksForEvent(event);
  const allResults = [];
  
  for (const hook of hooks) {
    const results = await executeHook(hook, context);
    allResults.push(...results);
  }
  
  return allResults;
}

/**
 * Initialize hook system with config
 * @param {string} [configPath]
 * @returns {HookStore}
 */
function initializeHookSystem(configPath) {
  const store = loadHookConfig(configPath);
  return store;
}

// ============================================================================
// Event Emitter for Hook Lifecycle
// ============================================================================

class HookEmitter {
  constructor() {
    /** @type {Map<HookEvent, Set<Function>>} */
    this.listeners = new Map();
    
    for (const event of VALID_EVENTS) {
      this.listeners.set(event, new Set());
    }
  }

  /**
   * Add a listener for an event
   * @param {HookEvent} event 
   * @param {Function} listener 
   */
  on(event, listener) {
    this.listeners.get(event)?.add(listener);
  }

  /**
   * Remove a listener
   * @param {HookEvent} event 
   * @param {Function} listener 
   */
  off(event, listener) {
    this.listeners.get(event)?.delete(listener);
  }

  /**
   * Emit an event to all listeners
   * @param {HookEvent} event 
   * @param {HookContext} context 
   * @returns {Promise<HookResult[]>}
   */
  async emit(event, context = {}) {
    const listeners = this.listeners.get(event) || new Set();
    const results = [];
    
    for (const listener of listeners) {
      try {
        const result = await listener(context);
        results.push(result);
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }
}

// ============================================================================
// Export
// ============================================================================

module.exports = {
  // Types (for reference)
  HookEvent: VALID_EVENTS,
  SOURCE_PRIORITY,
  
  // Classes
  HookStore,
  HookEmitter,
  
  // Core functions
  getHooksForEvent,
  registerHook,
  removeHook,
  triggerHooks,
  executeHook,
  executeCommand,
  matchCondition,
  interpolate,
  
  // Configuration
  loadHookConfig,
  saveHookConfig,
  initializeHookSystem,
  
  // Global store access
  getGlobalStore: () => globalHookStore,
  
  // Constants
  SOURCES: Object.keys(SOURCE_PRIORITY),
  VALID_EVENTS
};

// ============================================================================
// CLI / Quick Test
// ============================================================================

if (require.main === module) {
  console.log('OpenClaw Hook System');
  console.log('====================');
  console.log(`Valid events: ${VALID_EVENTS.join(', ')}`);
  console.log(`Source priority:`, SOURCE_PRIORITY);
  
  // Quick test
  const store = initializeHookSystem();
  
  // Register a test hook
  registerHook('PreToolUse', {
    name: 'test-hook',
    source: 'builtinHook',
    enabled: true,
    commands: [
      {
        type: 'command',
        command: 'echo "Tool: {{tool.name}}"',
        if: "tool.name == 'exec'"
      }
    ]
  });
  
  console.log('\nRegistered hooks for PreToolUse:', getHooksForEvent('PreToolUse'));
  
  // Test condition matching
  console.log('\nCondition tests:');
  console.log(`tool.name == 'exec': ${matchCondition("tool.name == 'exec'", { tool: { name: 'exec' } })}`);
  console.log(`tool.name == 'read': ${matchCondition("tool.name == 'exec'", { tool: { name: 'read' } })}`);
  console.log(`session.duration > 60: ${matchCondition("session.duration > 60", { session: { duration: 120 } })}`);
}
