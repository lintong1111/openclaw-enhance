/**
 * OpenClaw Tool Factory - 导出入口
 */

// 类型
export type {
  ToolDef,
  BuiltTool,
  ToolExecute,
  ToolContext,
  PermissionResult,
  ToolResult,
} from './tool-factory'

// 核心函数和类
export {
  buildTool,
  ToolRegistry,
  createReadOnlyTool,
  createDestructiveTool,
  createConcurrencySafeTool,
} from './tool-factory'
