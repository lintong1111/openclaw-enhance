/**
 * OpenClaw Feature Flag System
 * Feature Flag 条件编译系统，支持环境变量覆盖、灰度发布、运行时热更新
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============== 类型定义 ==============

export interface FeatureFlagConfig {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number; // 0-100
  defaultValue?: boolean;
  envVar?: string; // 环境变量名
}

export interface FeatureFlagOptions {
  configPath?: string;        // 配置文件路径
  enableEnvOverride?: boolean; // 是否启用环境变量覆盖
  enableRollout?: boolean;     // 是否启用灰度发布
}

// ============== 默认特性配置 ==============

export const DEFAULT_FEATURES: Record<string, Partial<FeatureFlagConfig>> = {
  'TOOL_REGISTRY_V2': {
    enabled: false,
    description: '新工具注册系统',
    rolloutPercentage: 0,
    defaultValue: false,
  },
  'HOOK_SYSTEM_V2': {
    enabled: false,
    description: '新Hook系统',
    rolloutPercentage: 0,
    defaultValue: false,
  },
  'AUTO_COMPACT': {
    enabled: false,
    description: '自动压缩',
    rolloutPercentage: 0,
    defaultValue: false,
  },
  'SKILL_SYSTEM_V2': {
    enabled: false,
    description: '新Skill系统',
    rolloutPercentage: 0,
    defaultValue: false,
  },
  'CACHE_V2': {
    enabled: false,
    description: '新缓存系统',
    rolloutPercentage: 0,
    defaultValue: false,
  },
};

// ============== Feature Flag 存储 ==============

let featureFlags: Map<string, FeatureFlagConfig> = new Map();
let runtimeOverrides: Map<string, boolean> = new Map();
let options: FeatureFlagOptions = {
  enableEnvOverride: true,
  enableRollout: true,
};

// ============== 工具函数 ==============

/**
 * 生成环境变量名
 */
function getEnvVarName(flagName: string): string {
  return `OPENCLAW_FLAG_${flagName.toUpperCase().replace(/\./g, '_').replace(/-/g, '_')}`;
}

/**
 * 获取用户 home 目录
 */
function getHomeDir(): string {
  return os.homedir();
}

/**
 * 获取默认配置文件路径
 */
function getDefaultConfigPath(): string {
  return path.join(getHomeDir(), '.openclaw', 'config', 'feature-flags.json');
}

/**
 * 生成随机数 (0-100)
 */
function getRandomPercentage(): number {
  return Math.random() * 100;
}

/**
 * 深度合并配置
 */
function mergeConfig(
  base: Partial<FeatureFlagConfig>,
  override: Partial<FeatureFlagConfig>
): FeatureFlagConfig {
  return {
    name: override.name || base.name || '',
    enabled: override.enabled ?? base.enabled ?? false,
    description: override.description || base.description,
    rolloutPercentage: override.rolloutPercentage ?? base.rolloutPercentage ?? 0,
    defaultValue: override.defaultValue ?? base.defaultValue ?? false,
    envVar: override.envVar || base.envVar,
  };
}

// ============== 核心 API ==============

/**
 * 初始化 Feature Flag 系统
 */
export function initFeatureFlags(opts?: FeatureFlagOptions): void {
  options = { ...options, ...opts };
  loadFeatureFlags();
}

/**
 * 从配置文件加载 Feature Flags
 */
export function loadFeatureFlags(): Map<string, FeatureFlagConfig> {
  const configPath = options.configPath || getDefaultConfigPath();
  
  // 初始化默认配置
  const flags = new Map<string, FeatureFlagConfig>();
  
  for (const [name, config] of Object.entries(DEFAULT_FEATURES)) {
    flags.set(name, mergeConfig(config, { name }));
  }

  // 尝试加载配置文件覆盖
  try {
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      const userConfig = JSON.parse(fileContent);
      
      if (userConfig.flags && typeof userConfig.flags === 'object') {
        for (const [name, config] of Object.entries(userConfig.flags)) {
          if (flags.has(name)) {
            const existing = flags.get(name)!;
            flags.set(name, mergeConfig(existing, config as Partial<FeatureFlagConfig>));
          } else {
            flags.set(name, mergeConfig({ name }, config as Partial<FeatureFlagConfig>));
          }
        }
      }
    }
  } catch (error) {
    console.warn(`[FeatureFlag] Failed to load config from ${configPath}:`, error);
  }

  featureFlags = flags;
  return featureFlags;
}

/**
 * 重新加载 Feature Flags (热更新)
 */
export function reloadFeatureFlags(): Map<string, FeatureFlagConfig> {
  console.log('[FeatureFlag] Reloading feature flags...');
  runtimeOverrides.clear();
  return loadFeatureFlags();
}

/**
 * 保存配置到文件
 */
export function saveFeatureFlags(): void {
  const configPath = options.configPath || getDefaultConfigPath();
  const configDir = path.dirname(configPath);
  
  // 确保目录存在
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const flagsObj: Record<string, Partial<FeatureFlagConfig>> = {};
  for (const [name, config] of featureFlags.entries()) {
    flagsObj[name] = {
      enabled: config.enabled,
      description: config.description,
      rolloutPercentage: config.rolloutPercentage,
      defaultValue: config.defaultValue,
    };
  }

  const configContent = {
    flags: flagsObj,
    _comment: 'Feature Flag Configuration - Managed by OpenClaw',
    _updated: new Date().toISOString(),
  };

  fs.writeFileSync(configPath, JSON.stringify(configContent, null, 2), 'utf-8');
  console.log(`[FeatureFlag] Saved to ${configPath}`);
}

/**
 * 检查环境变量覆盖
 */
function checkEnvOverride(name: string, currentValue: boolean): boolean {
  if (!options.enableEnvOverride) {
    return currentValue;
  }

  const envVar = getEnvVarName(name);
  const envValue = process.env[envVar];
  
  if (envValue !== undefined) {
    const parsed = envValue.toLowerCase();
    if (parsed === 'true' || parsed === '1' || parsed === 'yes') {
      return true;
    } else if (parsed === 'false' || parsed === '0' || parsed === 'no') {
      return false;
    }
  }
  
  return currentValue;
}

/**
 * 检查灰度发布
 */
function checkRollout(name: string, enabled: boolean, rolloutPercentage?: number): boolean {
  if (!options.enableRollout || !enabled) {
    return enabled;
  }
  
  if (rolloutPercentage === undefined || rolloutPercentage >= 100) {
    return true;
  }
  
  if (rolloutPercentage <= 0) {
    return false;
  }

  // 使用 name 的 hash 确保同一用户始终得到一致的结果
  const hash = hashString(name);
  const bucket = hash % 100;
  return bucket < rolloutPercentage;
}

/**
 * 简单的字符串 hash 函数
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 判断功能是否启用
 */
export function isFeatureEnabled(name: string): boolean {
  // 1. 优先检查运行时覆盖
  if (runtimeOverrides.has(name)) {
    return runtimeOverrides.get(name)!;
  }

  // 2. 检查环境变量
  const config = featureFlags.get(name);
  if (!config) {
    return false;
  }

  // 3. 检查环境变量覆盖
  let enabled = checkEnvOverride(name, config.enabled);
  
  // 4. 检查灰度发布
  enabled = checkRollout(name, enabled, config.rolloutPercentage);

  return enabled;
}

/**
 * 获取特性值 (带类型支持)
 */
export function getFeatureValue<T>(name: string, defaultValue: T): T {
  const enabled = isFeatureEnabled(name);
  
  if (typeof defaultValue === 'boolean') {
    return (enabled as unknown) as T;
  }
  
  const config = featureFlags.get(name);
  if (config && config.defaultValue !== undefined) {
    return (config.defaultValue as unknown) as T;
  }
  
  return defaultValue;
}

/**
 * 动态启用/禁用功能 (运行时)
 */
export function setFeatureEnabled(name: string, enabled: boolean): void {
  runtimeOverrides.set(name, enabled);
  console.log(`[FeatureFlag] Runtime override: ${name} = ${enabled}`);
}

/**
 * 获取所有 Feature Flags
 */
export function getAllFeatureFlags(): Map<string, FeatureFlagConfig> {
  return new Map(featureFlags);
}

/**
 * 获取单个 Feature Flag 配置
 */
export function getFeatureFlag(name: string): FeatureFlagConfig | undefined {
  return featureFlags.get(name);
}

/**
 * 添加或更新 Feature Flag
 */
export function setFeatureFlag(name: string, config: Partial<FeatureFlagConfig>): void {
  const existing = featureFlags.get(name);
  if (existing) {
    featureFlags.set(name, mergeConfig(existing, { name, ...config }));
  } else {
    featureFlags.set(name, mergeConfig({ name, enabled: false }, config));
  }
}

/**
 * 删除 Feature Flag
 */
export function deleteFeatureFlag(name: string): boolean {
  return featureFlags.delete(name);
}

// ============== GrowthBook 集成 (可选) ==============

export interface GrowthBookInstance {
  getFeatureValue: (name: string, defaultValue: unknown) => unknown;
  isOn: (name: string) => boolean;
}

/**
 * GrowthBook SDK 适配器初始化
 * 使用方式:
 *   npm install @growthbook/growthbook-sdk
 */
export async function initGrowthBook(config: {
  apiHost: string;
  clientKey: string;
  enableTracking?: boolean;
  attributes?: Record<string, unknown>;
}): Promise<GrowthBookInstance | null> {
  try {
    // 动态导入 GrowthBook SDK
    const { GrowthBook } = await import('@growthbook/growthbook-sdk');
    
    const gb = new GrowthBook({
      apiHost: config.apiHost,
      clientKey: config.clientKey,
      enableTracking: config.enableTracking ?? true,
    });

    if (config.attributes) {
      gb.setAttributes(config.attributes);
    }

    return {
      getFeatureValue: (name: string, defaultValue: unknown) => gb.getFeatureValue(name, defaultValue),
      isOn: (name: string) => gb.isOn(name),
    };
  } catch (error) {
    console.warn('[FeatureFlag] GrowthBook SDK not available:', error);
    return null;
  }
}

/**
 * 从 GrowthBook 获取值
 */
export function getGrowthBookValue<T>(
  gb: GrowthBookInstance,
  name: string,
  defaultValue: T
): T {
  return gb.getFeatureValue(name, defaultValue) as T;
}

// ============== Express/Koa 中间件示例 ==============

/**
 * Express 中间件 - 将 feature flags 注入 req
 */
export function featureFlagMiddleware(req: Record<string, unknown>, _res: unknown, next: () => void): void {
  (req as Record<string, unknown>).features = {
    isEnabled: isFeatureEnabled,
    getValue: getFeatureValue,
    flags: getAllFeatureFlags(),
  };
  next();
}

// ============== CLI 命令支持 ==============

export function listFeatureFlags(): void {
  console.log('\n=== Feature Flags ===\n');
  for (const [name, config] of featureFlags.entries()) {
    const isOn = isFeatureEnabled(name);
    const envVar = getEnvVarName(name);
    const envOverride = process.env[envVar];
    
    console.log(`  ${name}`);
    console.log(`    Enabled: ${isOn ? '✅' : '❌'}`);
    if (config.description) {
      console.log(`    Description: ${config.description}`);
    }
    if (config.rolloutPercentage !== undefined && config.rolloutPercentage > 0) {
      console.log(`    Rollout: ${config.rolloutPercentage}%`);
    }
    if (envOverride !== undefined) {
      console.log(`    Env Override: ${envVar}=${envOverride} (🔄 takes effect)`);
    } else {
      console.log(`    Env Var: ${envVar}`);
    }
    if (runtimeOverrides.has(name)) {
      console.log(`    Runtime: ${runtimeOverrides.get(name)} (⏱️ temporary)`);
    }
    console.log();
  }
}

// ============== 初始化 ==============

// 自动初始化
initFeatureFlags();

export default {
  initFeatureFlags,
  loadFeatureFlags,
  reloadFeatureFlags,
  saveFeatureFlags,
  isFeatureEnabled,
  getFeatureValue,
  setFeatureEnabled,
  getAllFeatureFlags,
  getFeatureFlag,
  setFeatureFlag,
  deleteFeatureFlag,
  initGrowthBook,
  getGrowthBookValue,
  featureFlagMiddleware,
  listFeatureFlags,
  DEFAULT_FEATURES,
};
