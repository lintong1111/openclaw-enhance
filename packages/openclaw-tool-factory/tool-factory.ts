/**
 * OpenClaw Tool Factory
 * 
 * buildTool() 工厂模式 - 标准化 OpenClaw 工具创建
 * 参考 Claude Code 的工具定义设计
 */

// ============================================================
// 类型定义
// ============================================================

/** 工具执行函数签名 */
export type ToolExecute<TParams = unknown, TResult = unknown> = (
  params: TParams,
  context: ToolContext
) => Promise<TResult>

/** 工具执行上下文 */
export interface ToolContext {
  sessionId: string
  workspace: string
  userId?: string
  metadata?: Record<string, unknown>
}

/** 权限检查结果 */
export interface PermissionResult {
  behavior: 'allow' | 'deny' | 'prompt'
  reason?: string
}

/** 工具执行结果 */
export interface ToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/** 工具定义 - 传入 buildTool 的描述对象 */
export interface ToolDef<TParams = unknown, TResult = unknown> {
  /** 工具唯一名称 */
  name: string
  /** 工具描述 */
  description?: string
  /** 工具执行函数 */
  execute: ToolExecute<TParams, TResult>
  /** 工具是否启用 */
  isEnabled?: () => boolean
  /** 是否并发安全（可同时执行多个实例）*/
  isConcurrencySafe?: () => boolean
  /** 是否只读（不修改系统状态）*/
  isReadOnly?: () => boolean
  /** 是否为破坏性操作（删除、覆盖等）*/
  isDestructive?: () => boolean
  /** 权限检查函数 */
  checkPermissions?: () => PermissionResult
  /** 自动分类器输入生成 */
  toAutoClassifierInput?: () => string
  /** 用户可见的名称 */
  userFacingName?: () => string
}

/** 构建后的工具实例 - 包含完整的方法集 */
export interface BuiltTool<TParams = unknown, TResult = unknown> {
  /** 工具唯一名称 */
  name: string
  /** 工具描述 */
  description?: string
  /** 工具执行函数 */
  execute: ToolExecute<TParams, TResult>
  /** 工具是否启用 */
  isEnabled: () => boolean
  /** 是否并发安全 */
  isConcurrencySafe: () => boolean
  /** 是否只读 */
  isReadOnly: () => boolean
  /** 是否为破坏性操作 */
  isDestructive: () => boolean
  /** 权限检查 */
  checkPermissions: () => PermissionResult
  /** 自动分类器输入 */
  toAutoClassifierInput: () => string
  /** 用户可见名称 */
  userFacingName: () => string
}

// ============================================================
// 默认值
// ============================================================

const TOOL_DEFAULTS = {
  isEnabled: () => true,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  isDestructive: () => false,
  checkPermissions: () => ({ behavior: 'allow' as const }),
  toAutoClassifierInput: () => '',
  userFacingName: () => '',
}

// ============================================================
// buildTool 工厂函数
// ============================================================

/**
 * buildTool - 工具工厂函数
 * 
 * @param def 工具定义对象
 * @returns 构建完成的工具实例
 * 
 * @example
 * ```typescript
 * const readTool = buildTool({
 *   name: 'read',
 *   description: '读取文件内容',
 *   isReadOnly: () => true,
 *   isConcurrencySafe: () => true,
 *   execute: async (params) => {
 *     return { success: true, content: await readFile(params.path) }
 *   },
 * })
 * ```
 */
export function buildTool<TParams = unknown, TResult = unknown>(
  def: ToolDef<TParams, TResult>
): BuiltTool<TParams, TResult> {
  return {
    ...TOOL_DEFAULTS,
    userFacingName: () => def.name,
    ...def,
  } as BuiltTool<TParams, TResult>
}

// ============================================================
// 工具注册表
// ============================================================

/**
 * 工具注册表 - 管理所有已注册的工具
 * 
 * @example
 * ```typescript
 * const registry = ToolRegistry.getInstance()
 * registry.register('read', readTool)
 * const tool = registry.get('read')
 * ```
 */
export class ToolRegistry {
  private static _instance: ToolRegistry | null = null
  private _tools: Map<string, BuiltTool> = new Map()

  /** 获取单例实例 */
  static getInstance(): ToolRegistry {
    if (!ToolRegistry._instance) {
      ToolRegistry._instance = new ToolRegistry()
    }
    return ToolRegistry._instance
  }

  /** 禁止直接构造，请使用 getInstance() */
  private constructor() {}

  /**
   * 注册工具
   * @param name 工具名称
   * @param tool 工具实例
   */
  register(name: string, tool: BuiltTool): void {
    if (this._tools.has(name)) {
      console.warn(`[ToolRegistry] Tool "${name}" 已被注册，将被覆盖`)
    }
    this._tools.set(name, tool)
  }

  /**
   * 获取工具
   * @param name 工具名称
   * @returns 工具实例，不存在则返回 undefined
   */
  get(name: string): BuiltTool | undefined {
    return this._tools.get(name)
  }

  /**
   * 检查工具是否存在
   */
  has(name: string): boolean {
    return this._tools.has(name)
  }

  /**
   * 列出所有已注册的工具
   */
  list(): BuiltTool[] {
    return Array.from(this._tools.values())
  }

  /**
   * 列出所有工具名称
   */
  listNames(): string[] {
    return Array.from(this._tools.keys())
  }

  /**
   * 移除工具
   */
  unregister(name: string): boolean {
    return this._tools.delete(name)
  }

  /**
   * 清空所有工具
   */
  clear(): void {
    this._tools.clear()
  }

  /**
   * 获取工具数量
   */
  size(): number {
    return this._tools.size
  }

  /**
   * 获取所有只读工具
   */
  getReadOnlyTools(): BuiltTool[] {
    return this.list().filter(tool => tool.isReadOnly())
  }

  /**
   * 获取所有并发安全工具
   */
  getConcurrencySafeTools(): BuiltTool[] {
    return this.list().filter(tool => tool.isConcurrencySafe())
  }

  /**
   * 获取所有破坏性工具
   */
  getDestructiveTools(): BuiltTool[] {
    return this.list().filter(tool => tool.isDestructive())
  }

  /**
   * 执行工具（带权限检查）
   */
  async execute<TParams = unknown, TResult = unknown>(
    name: string,
    params: TParams,
    context: ToolContext
  ): Promise<ToolResult<TResult>> {
    const tool = this.get(name)
    
    if (!tool) {
      return { success: false, error: `Tool "${name}" not found` }
    }

    if (!tool.isEnabled()) {
      return { success: false, error: `Tool "${name}" is disabled` }
    }

    const permission = tool.checkPermissions()
    if (permission.behavior === 'deny') {
      return { success: false, error: permission.reason || 'Permission denied' }
    }

    if (permission.behavior === 'prompt') {
      // TODO: 实现用户提示逻辑
      console.warn(`[ToolRegistry] Tool "${name}" requires user prompt`)
    }

    try {
      const result = await tool.execute(params, context)
      return { success: true, data: result }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }
    }
  }

  /**
   * 导出所有工具为 JSON（用于调试/序列化）
   */
  toJSON(): Record<string, unknown> {
    const entries: Record<string, unknown> = {}
    for (const [name, tool] of this._tools) {
      entries[name] = {
        name: tool.name,
        description: tool.description,
        isEnabled: tool.isEnabled(),
        isConcurrencySafe: tool.isConcurrencySafe(),
        isReadOnly: tool.isReadOnly(),
        isDestructive: tool.isDestructive(),
        userFacingName: tool.userFacingName(),
      }
    }
    return entries
  }
}

// ============================================================
// 便捷函数
// ============================================================

/**
 * 创建只读工具
 */
export function createReadOnlyTool<TParams = unknown, TResult = unknown>(
  def: Omit<ToolDef<TParams, TResult>, 'isReadOnly'>
): BuiltTool<TParams, TResult> {
  return buildTool({
    ...def,
    isReadOnly: () => true,
    isConcurrencySafe: def.isConcurrencySafe ?? (() => true),
  })
}

/**
 * 创建破坏性工具
 */
export function createDestructiveTool<TParams = unknown, TResult = unknown>(
  def: Omit<ToolDef<TParams, TResult>, 'isDestructive'>
): BuiltTool<TParams, TResult> {
  return buildTool({
    ...def,
    isDestructive: () => true,
  })
}

/**
 * 创建并发安全工具
 */
export function createConcurrencySafeTool<TParams = unknown, TResult = unknown>(
  def: Omit<ToolDef<TParams, TResult>, 'isConcurrencySafe'>
): BuiltTool<TParams, TResult> {
  return buildTool({
    ...def,
    isConcurrencySafe: () => true,
  })
}
