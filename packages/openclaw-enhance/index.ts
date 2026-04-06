/**
 * OpenClawEnhance - 统一导出
 * 
 * 整合 5 大模块的完整增强系统
 */

// ============================================================
// 核心集成器
// ============================================================

export {
  OpenClawEnhance,
  getEnhanceInstance,
  createEnhance,
  type EnhanceOptions,
  type ToolRegistrationOptions,
  type EnhanceContext,
  type ToolUseContext,
} from './integrator';

// ============================================================
// ToolFactory 导出
// ============================================================

export {
  buildTool,
  ToolRegistry,
  createReadOnlyTool,
  createDestructiveTool,
  createConcurrencySafeTool,
  type ToolDef,
  type BuiltTool,
  type ToolContext,
  type ToolResult,
  type ToolExecute,
  type PermissionResult,
} from '../openclaw-tool-factory/tool-factory';

// ============================================================
// FeatureFlag 导出
// ============================================================

export {
  isFeatureEnabled,
  getFeatureValue,
  setFeatureEnabled,
  initFeatureFlags,
  loadFeatureFlags,
  reloadFeatureFlags,
  saveFeatureFlags,
  getAllFeatureFlags,
  DEFAULT_FEATURES,
  type FeatureFlagConfig,
  type FeatureFlagOptions,
} from '../openclaw-feature-flag/feature-flag';

// ============================================================
// CacheCompact 导出
// ============================================================

export {
  CompletionCache,
  ToolSchemaCache,
  ConversationRecovery,
  compactSession,
  summarizeMessages,
  type Message,
  type CompactOptions,
  type CacheOptions,
  type ToolResult as CompactToolResult,
  type TaskState,
  type ConversationRecoveryState,
} from '../openclaw-cache-compact/src/index';

// ============================================================
// SkillSystem 导出
// ============================================================

export {
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
  type SkillArg,
  type SkillMetadata,
} from '../openclaw-skill-system/index';

// ============================================================
// HookSystem 导出
// ============================================================

export {
  getHooksForEvent,
  registerHook,
  removeHook,
  triggerHooks,
  executeHook,
  executeCommand,
  matchCondition,
  interpolate,
  loadHookConfig,
  saveHookConfig,
  initializeHookSystem,
  type HookStore,
  type HookEmitter,
} from '../openclaw-hook-system/hook-system';

// Hook types (re-exported for convenience)
export type {
  HookEvent,
  HookSource,
  HookCommand,
  HookContext,
  HookResult,
} from '../openclaw-hook-system/hook-system';

// ============================================================
// 版本信息
// ============================================================

export const VERSION = '1.0.0';
export const MODULES = [
  'tool-factory',
  'feature-flag', 
  'cache-compact',
  'skill-system',
  'hook-system',
] as const;
