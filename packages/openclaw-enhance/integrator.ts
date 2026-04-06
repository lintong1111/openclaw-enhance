/**
 * OpenClawEnhance - 核心集成器
 * 
 * 将 5 大模块整合成统一系统：
 * 1. ToolFactory    - 工具工厂
 * 2. FeatureFlag   - 功能开关
 * 3. HookSystem     - 事件拦截
 * 4. CacheCompact   - 多级缓存 + 自动压缩
 * 5. SkillSystem    - 技能系统
 */

import * as path from 'path';
import * as os from 'os';

// ============================================================
// 导入 5 大模块
// ============================================================

// 1. ToolFactory
import {
  buildTool as _buildTool,
  ToolRegistry,
  createReadOnlyTool,
  createDestructiveTool,
  createConcurrencySafeTool,
  type ToolDef,
  type BuiltTool,
  type ToolContext,
  type ToolResult,
  type ToolExecute,
} from '../openclaw-tool-factory/tool-factory';

// 2. FeatureFlag
import {
  isFeatureEnabled as _isFeatureEnabled,
  getFeatureValue as _getFeatureValue,
  setFeatureEnabled as _setFeatureEnabled,
  initFeatureFlags,
  loadFeatureFlags,
  reloadFeatureFlags,
  saveFeatureFlags,
  getAllFeatureFlags,
  DEFAULT_FEATURES,
  type FeatureFlagConfig,
} from '../openclaw-feature-flag/feature-flag';

// 3. CacheCompact
import {
  CompletionCache,
  ToolSchemaCache,
  ConversationRecovery,
  compactSession,
  summarizeMessages,
  type Message,
  type CompactOptions,
  type CacheOptions,
} from '../openclaw-cache-compact/src/index';

// 4. SkillSystem
import {
  loadSkills,
  getSkill,
  getSkills,
  executeSkill,
  validateSkillArgs,
  loadAllSkills,
  getAllRegisteredSkills,
  clearCache as clearSkillCache,
  SKILL_SOURCE_PATHS,
  type SkillSource,
  type LoadedSkill,
  type SkillExecutionResult,
  type SkillContext,
} from '../openclaw-skill-system/index';

// 5. HookSystem (CommonJS)
const hookSystem = require('../openclaw-hook-system/hook-system');

// ============================================================
// 类型定义
// ============================================================

export interface EnhanceOptions {
  /** 是否启用各模块的 Feature Flag 校验 */
  useFeatureFlags?: boolean;
  /** 缓存配置 */
  cacheOptions?: {
    completion?: CacheOptions;
    schema?: CacheOptions;
    recovery?: { storagePath?: string };
  };
  /** 压缩配置 */
  compactOptions?: CompactOptions;
  /** Hook 配置文件路径 */
  hooksConfigPath?: string;
  /** 技能目录 */
  skillsPaths?: Partial<Record<SkillSource, string>>;
}

export interface ToolRegistrationOptions {
  /** 关联的 Feature Flag 名称 */
  featureFlag?: string;
  /** 是否强制启用（忽略 Feature Flag）*/
  forceEnabled?: boolean;
}

export interface EnhanceContext {
  sessionId?: string;
  workspace?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface ToolUseContext {
  tool: { name: string; args: unknown };
  session?: { id: string; duration?: number };
  event?: { type: string };
  context?: EnhanceContext;
}

// ============================================================
// 默认 Feature Flags（增强系统专用）
// ============================================================

const ENHANCE_FLAGS = {
  'ENHANCE_SYSTEM': {
    enabled: false,
    description: '整个增强系统',
  },
  'TOOL_FACTORY': {
    enabled: false,
    description: '工具工厂',
  },
  'FEATURE_FLAG': {
    enabled: false,
    description: 'Feature Flag 系统',
  },
  'HOOK_SYSTEM': {
    enabled: false,
    description: 'Hook 系统',
  },
  'CACHE_SYSTEM': {
    enabled: false,
    description: '缓存系统',
  },
  'AUTO_COMPACT': {
    enabled: false,
    description: '自动压缩',
  },
  'SKILL_SYSTEM': {
    enabled: false,
    description: 'Skill 系统',
  },
};

// ============================================================
// OpenClawEnhance 集成器
// ============================================================

export class OpenClawEnhance {
  // 模块实例
  private _toolRegistry: ToolRegistry;
  private _completionCache: CompletionCache | null = null;
  private _schemaCache: ToolSchemaCache | null = null;
  private _conversationRecovery: ConversationRecovery | null = null;
  private _hookStore: ReturnType<typeof hookSystem.initializeHookSystem> | null = null;
  private _initialized = false;
  
  // 配置
  private _options: EnhanceOptions;

  // 运行时上下文
  private _currentContext: EnhanceContext = {};

  constructor(options: EnhanceOptions = {}) {
    this._options = options;
    this._toolRegistry = ToolRegistry.getInstance();
  }

  // ============================================================
  // 1. 初始化所有模块
  // ============================================================

  async init(): Promise<void> {
    if (this._initialized) {
      console.warn('[OpenClawEnhance] Already initialized');
      return;
    }

    console.log('[OpenClawEnhance] Initializing...');

    // 初始化 Feature Flags
    this._initFeatureFlags();

    // 初始化缓存
    this._initCache();

    // 初始化 Hook 系统
    this._initHookSystem();

    // 加载 Skills
    if (this._isEnabled('SKILL_SYSTEM')) {
      await this.loadSkills();
    }

    this._initialized = true;
    console.log('[OpenClawEnhance] Initialization complete');
  }

  private _initFeatureFlags(): void {
    if (!this._isEnabled('FEATURE_FLAG') && this._options.useFeatureFlags !== false) {
      // 注册增强系统专用 flags
      for (const [name, config] of Object.entries(ENHANCE_FLAGS)) {
        this.setFeatureFlag(name, config);
      }
    }
    loadFeatureFlags();
  }

  private _initCache(): void {
    if (!this._isEnabled('CACHE_SYSTEM')) return;

    const { cacheOptions = {} } = this._options;

    // L1: CompletionCache
    if (cacheOptions.completion) {
      this._completionCache = new CompletionCache(cacheOptions.completion);
    } else {
      this._completionCache = new CompletionCache({ maxSize: 200 });
    }

    // L2: ToolSchemaCache
    this._schemaCache = new ToolSchemaCache();

    // L3: ConversationRecovery
    const recoveryPath = cacheOptions.recovery?.storagePath 
      || path.join(os.homedir(), '.openclaw', 'session-checkpoints');
    this._conversationRecovery = new ConversationRecovery({ storagePath: recoveryPath });
  }

  private _initHookSystem(): void {
    if (!this._isEnabled('HOOK_SYSTEM')) return;

    const configPath = this._options.hooksConfigPath 
      || path.join(os.homedir(), '.openclaw', 'hooks.yaml');
    
    this._hookStore = hookSystem.initializeHookSystem(configPath);
  }

  // ============================================================
  // 2. 工具注册（带 Feature Flag）
  // ============================================================

  registerTool<TParams = unknown, TResult = unknown>(
    def: ToolDef<TParams, TResult>,
    options: ToolRegistrationOptions = {}
  ): BuiltTool<TParams, TResult> | null {
    // Feature Flag 检查
    if (this._options.useFeatureFlags !== false && !options.forceEnabled) {
      if (options.featureFlag && !this.isEnabled(options.featureFlag)) {
        console.log(`[OpenClawEnhance] Tool "${def.name}" skipped (feature flag: ${options.featureFlag})`);
        return null;
      }
      if (!options.featureFlag && !this._isEnabled('TOOL_FACTORY')) {
        return null;
      }
    }

    // 使用 buildTool 创建
    const tool = _buildTool(def);

    // 注册到 ToolRegistry
    this._toolRegistry.register(def.name, tool);

    console.log(`[OpenClawEnhance] Tool registered: ${def.name}`);
    return tool;
  }

  /**
   * 创建只读工具
   */
  registerReadOnlyTool<TParams = unknown, TResult = unknown>(
    def: Omit<ToolDef<TParams, TResult>, 'isReadOnly'>,
    options?: ToolRegistrationOptions
  ): BuiltTool<TParams, TResult> | null {
    return this.registerTool({
      ...def,
      isReadOnly: () => true,
      isConcurrencySafe: def.isConcurrencySafe ?? (() => true),
    }, options);
  }

  /**
   * 创建破坏性工具
   */
  registerDestructiveTool<TParams = unknown, TResult = unknown>(
    def: Omit<ToolDef<TParams, TResult>, 'isDestructive'>,
    options?: ToolRegistrationOptions
  ): BuiltTool<TParams, TResult> | null {
    return this.registerTool({
      ...def,
      isDestructive: () => true,
    }, options);
  }

  /**
   * 获取已注册的工具
   */
  getTool(name: string): BuiltTool | undefined {
    return this._toolRegistry.get(name);
  }

  /**
   * 列出所有已注册的工具
   */
  listTools(): BuiltTool[] {
    return this._toolRegistry.list();
  }

  /**
   * 执行工具（带 Hook 触发）
   */
  async executeTool<TParams = unknown, TResult = unknown>(
    name: string,
    params: TParams,
    context?: Partial<ToolContext>
  ): Promise<ToolResult<TResult>> {
    const fullContext: ToolContext = {
      sessionId: this._currentContext.sessionId || 'unknown',
      workspace: this._currentContext.workspace || os.homedir(),
      userId: this._currentContext.userId,
      metadata: this._currentContext.metadata,
      ...context,
    };

    // PreToolUse Hook
    await this.triggerPreToolUse({ name, args: params } as ToolUseContext['tool']);

    // 执行工具
    const result = await this._toolRegistry.execute(name, params, fullContext);

    // PostToolUse Hook
    await this.triggerPostToolUse({ name, args: params } as ToolUseContext['tool'], result);

    return result;
  }

  // ============================================================
  // 3. Hook 触发（在工具调用前后）
  // ============================================================

  /**
   * 触发 PreToolUse Hook
   */
  async triggerPreToolUse(
    tool: { name: string; args: unknown },
    context?: Partial<ToolUseContext>
  ): Promise<unknown[]> {
    if (!this._isEnabled('HOOK_SYSTEM') || !this._hookStore) {
      return [];
    }

    const hookContext: ToolUseContext = {
      tool,
      session: {
        id: this._currentContext.sessionId || 'unknown',
        duration: 0,
      },
      event: { type: 'PreToolUse' },
      context: this._currentContext,
      ...context,
    };

    return hookSystem.triggerHooks('PreToolUse', hookContext, this._hookStore);
  }

  /**
   * 触发 PostToolUse Hook
   */
  async triggerPostToolUse(
    tool: { name: string; args: unknown },
    result: ToolResult,
    context?: Partial<ToolUseContext>
  ): Promise<unknown[]> {
    if (!this._isEnabled('HOOK_SYSTEM') || !this._hookStore) {
      return [];
    }

    const hookContext: ToolUseContext = {
      tool,
      session: {
        id: this._currentContext.sessionId || 'unknown',
        duration: 0,
      },
      event: { type: 'PostToolUse' },
      context: { ...this._currentContext, metadata: { ...this._currentContext.metadata, result } },
      ...context,
    };

    return hookSystem.triggerHooks('PostToolUse', hookContext, this._hookStore);
  }

  /**
   * 触发任意事件 Hook
   */
  async triggerHook(
    event: string,
    context?: ToolUseContext
  ): Promise<unknown[]> {
    if (!this._isEnabled('HOOK_SYSTEM') || !this._hookStore) {
      return [];
    }

    return hookSystem.triggerHooks(event as any, context || {}, this._hookStore);
  }

  /**
   * 注册自定义 Hook
   */
  registerHook(
    event: string,
    name: string,
    config: {
      source?: string;
      enabled?: boolean;
      commands: Array<{
        type: 'command' | 'prompt' | 'agent' | 'http';
        command?: string;
        prompt?: string;
        url?: string;
        shell?: string;
        if?: string;
      }>;
    }
  ): void {
    if (!this._isEnabled('HOOK_SYSTEM') || !this._hookStore) {
      console.warn('[OpenClawEnhance] Hook system not enabled');
      return;
    }

    hookSystem.registerHook(event as any, {
      name,
      source: config.source || 'builtinHook',
      enabled: config.enabled ?? true,
      commands: config.commands,
    }, this._hookStore);
  }

  // ============================================================
  // 4. Skill 加载和执行
  // ============================================================

  /**
   * 加载所有来源的 Skills
   */
  async loadSkills(source?: SkillSource): Promise<LoadedSkill[]> {
    if (!this._isEnabled('SKILL_SYSTEM')) {
      console.warn('[OpenClawEnhance] Skill system not enabled');
      return [];
    }

    if (source) {
      return loadSkills(source);
    }

    loadAllSkills();
    return Array.from(getAllRegisteredSkills());
  }

  /**
   * 获取指定 Skill
   */
  getSkill(name: string): LoadedSkill | null {
    if (!this._isEnabled('SKILL_SYSTEM')) {
      return null;
    }
    return getSkill(name);
  }

  /**
   * 获取所有 Skills（可选按来源筛选）
   */
  getSkills(source?: SkillSource): LoadedSkill[] {
    if (!this._isEnabled('SKILL_SYSTEM')) {
      return [];
    }
    return getSkills(source);
  }

  /**
   * 执行 Skill
   */
  async executeSkill(
    name: string,
    args: Record<string, unknown> = {},
    context?: SkillContext
  ): Promise<SkillExecutionResult> {
    if (!this._isEnabled('SKILL_SYSTEM')) {
      return { success: false, error: 'Skill system not enabled' };
    }

    const skill = getSkill(name);
    if (!skill) {
      return { success: false, error: `Skill "${name}" not found` };
    }

    // 验证参数
    const validation = validateSkillArgs(skill, args);
    if (!validation.valid) {
      return { success: false, error: `Invalid args: ${validation.errors.join(', ')}` };
    }

    // 执行
    const skillContext: SkillContext = {
      workspace: this._currentContext.workspace || os.homedir(),
      sessionId: this._currentContext.sessionId || 'unknown',
      userId: this._currentContext.userId,
      ...context,
    };

    return executeSkill(skill, args, skillContext);
  }

  // ============================================================
  // 5. 缓存管理
  // ============================================================

  /**
   * 获取缓存实例
   */
  getCache(type: 'completion' | 'schema' | 'conversation'): 
    CompletionCache | ToolSchemaCache | ConversationRecovery | null {
    if (!this._isEnabled('CACHE_SYSTEM')) {
      return null;
    }

    switch (type) {
      case 'completion':
        return this._completionCache;
      case 'schema':
        return this._schemaCache;
      case 'conversation':
        return this._conversationRecovery;
    }
  }

  /**
   * CompletionCache 操作
   */
  cacheCompletion(key: string, response: unknown, tokens?: number): void {
    this._completionCache?.set(key, response, tokens);
  }

  getCachedCompletion(key: string): unknown | null {
    return this._completionCache?.get(key) ?? null;
  }

  hasCachedCompletion(key: string): boolean {
    return this._completionCache?.has(key) ?? false;
  }

  /**
   * ToolSchemaCache 操作
   */
  cacheSchema(toolName: string, schema: unknown): void {
    this._schemaCache?.set(toolName, schema as any);
  }

  getCachedSchema(toolName: string): unknown | null {
    return this._schemaCache?.get(toolName) ?? null;
  }

  /**
   * ConversationRecovery 操作
   */
  saveCheckpoint(state: unknown): string | null {
    if (!this._conversationRecovery) return null;
    const id = `checkpoint-${Date.now()}`;
    this._conversationRecovery.save({ id, ...state as any });
    return id;
  }

  loadCheckpoint(id: string): unknown | null {
    if (!this._conversationRecovery) return null;
    return this._conversationRecovery.load(id);
  }

  listCheckpoints(): string[] {
    if (!this._conversationRecovery) return [];
    return this._conversationRecovery.list();
  }

  // ============================================================
  // 6. 会话压缩
  // ============================================================

  /**
   * 压缩会话消息到目标 token 数
   */
  async compactSession(
    messages: Message[],
    targetTokens: number,
    options?: Partial<CompactOptions>
  ): Promise<Message[]> {
    if (!this._isEnabled('AUTO_COMPACT')) {
      return messages;
    }

    const defaultOptions: CompactOptions = {
      targetTokens,
      preserveSystem: true,
      preserveRecentMessages: 2,
      preserveTools: true,
    };

    return compactSession(messages, { ...defaultOptions, ...options });
  }

  /**
   * 总结消息（用于压缩）
   */
  async summarizeMessages(messages: Message[]): Promise<string> {
    return summarizeMessages(messages);
  }

  // ============================================================
  // 7. Feature Flag 检查
  // ============================================================

  /**
   * 检查功能是否启用
   */
  isEnabled(flag: string): boolean {
    // 全局开关检查
    if (!this._isEnabled('ENHANCE_SYSTEM')) {
      // 如果整个系统未启用，但某个模块单独启用也可以
    }

    if (this._options.useFeatureFlags === false) {
      return true;
    }

    return _isFeatureEnabled(flag);
  }

  /**
   * 内部模块开关检查
   */
  private _isEnabled(flag: string): boolean {
    if (this._options.useFeatureFlags === false) {
      return true;
    }
    return _isFeatureEnabled(flag);
  }

  /**
   * 获取特性值
   */
  getFeatureValue<T>(flag: string, defaultValue: T): T {
    return _getFeatureValue(flag, defaultValue);
  }

  /**
   * 运行时启用/禁用功能
   */
  setFeatureEnabled(flag: string, enabled: boolean): void {
    _setFeatureEnabled(flag, enabled);
  }

  /**
   * 获取所有 Feature Flags
   */
  getAllFlags(): Map<string, FeatureFlagConfig> {
    return getAllFeatureFlags();
  }

  /**
   * 设置 Feature Flag
   */
  setFeatureFlag(name: string, config: Partial<FeatureFlagConfig>): void {
    const { setFeatureFlag: _setFF } = require('../openclaw-feature-flag/feature-flag');
    if (typeof _setFF === 'function') {
      _setFF(name, config);
    }
  }

  // ============================================================
  // 上下文管理
  // ============================================================

  /**
   * 设置当前上下文
   */
  setContext(context: EnhanceContext): void {
    this._currentContext = { ...this._currentContext, ...context };
  }

  /**
   * 获取当前上下文
   */
  getContext(): EnhanceContext {
    return { ...this._currentContext };
  }

  /**
   * 清除当前上下文
   */
  clearContext(): void {
    this._currentContext = {};
  }

  // ============================================================
  // 工具
  // ============================================================

  /**
   * 重新加载 Feature Flags（热更新）
   */
  reloadFlags(): void {
    reloadFeatureFlags();
  }

  /**
   * 保存 Feature Flags 到文件
   */
  saveFlags(): void {
    saveFeatureFlags();
  }

  /**
   * 清理缓存
   */
  clearCache(type?: 'completion' | 'schema' | 'all'): void {
    if (type === 'completion' || type === 'all') {
      this._completionCache?.clear();
    }
    if (type === 'schema' || type === 'all') {
      this._schemaCache?.clear();
    }
    if (type === 'all') {
      clearSkillCache();
    }
  }

  /**
   * 导出状态（用于调试）
   */
  toJSON(): Record<string, unknown> {
    return {
      initialized: this._initialized,
      context: this._currentContext,
      toolCount: this._toolRegistry.size(),
      cacheEnabled: this._isEnabled('CACHE_SYSTEM'),
      hookEnabled: this._isEnabled('HOOK_SYSTEM'),
      skillEnabled: this._isEnabled('SKILL_SYSTEM'),
      compactEnabled: this._isEnabled('AUTO_COMPACT'),
      featureFlags: Object.fromEntries(getAllFeatureFlags()),
    };
  }
}

// ============================================================
// 便捷函数
// ============================================================

/**
 * 创建默认实例（全局单例）
 */
let _defaultInstance: OpenClawEnhance | null = null;

export function getEnhanceInstance(options?: EnhanceOptions): OpenClawEnhance {
  if (!_defaultInstance) {
    _defaultInstance = new OpenClawEnhance(options);
  }
  return _defaultInstance;
}

export function createEnhance(options?: EnhanceOptions): OpenClawEnhance {
  return new OpenClawEnhance(options);
}

export default OpenClawEnhance;
