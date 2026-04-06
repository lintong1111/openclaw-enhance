/**
 * Feature Flag 使用示例
 * 
 * 运行方式:
 *   npx ts-node example-usage.ts
 *   
 * 环境变量覆盖示例:
 *   OPENCLAW_FLAG_TOOL_REGISTRY_V2=true npx ts-node example-usage.ts
 */

import {
  isFeatureEnabled,
  getFeatureValue,
  setFeatureEnabled,
  getAllFeatureFlags,
  reloadFeatureFlags,
  listFeatureFlags,
  DEFAULT_FEATURES,
} from './feature-flag';

console.log('=== OpenClaw Feature Flag Demo ===\n');

// 列出所有 flags
console.log('1. 所有配置的 Feature Flags:');
console.log(DEFAULT_FEATURES);
console.log();

// 检查单个功能
console.log('2. 检查 TOOL_REGISTRY_V2 是否启用:');
const isToolRegistryV2Enabled = isFeatureEnabled('TOOL_REGISTRY_V2');
console.log(`   TOOL_REGISTRY_V2: ${isToolRegistryV2Enabled ? '✅ 启用' : '❌ 禁用'}`);
console.log();

// 获取特性值
console.log('3. 获取特性值 (带默认值):');
const cacheValue = getFeatureValue('CACHE_V2', false);
console.log(`   CACHE_V2 = ${cacheValue}`);
console.log();

// 运行时动态启用
console.log('4. 运行时动态启用:');
console.log(`   启用前 AUTO_COMPACT: ${isFeatureEnabled('AUTO_COMPACT')}`);
setFeatureEnabled('AUTO_COMPACT', true);
console.log(`   启用后 AUTO_COMPACT: ${isFeatureEnabled('AUTO_COMPACT')}`);
console.log();

// 获取所有 flags
console.log('5. 获取所有 Feature Flags:');
const allFlags = getAllFeatureFlags();
for (const [name, config] of allFlags.entries()) {
  console.log(`   ${name}: ${config.enabled ? '✅' : '❌'}`);
}
console.log();

// 热更新
console.log('6. 重新加载配置 (reloadFeatureFlags):');
reloadFeatureFlags();
console.log();

// CLI 风格列表
console.log('7. CLI 风格列表:');
listFeatureFlags();

// 示例：在业务代码中使用
console.log('8. 业务代码示例:');

// 工具注册示例
function registerTools() {
  if (isFeatureEnabled('TOOL_REGISTRY_V2')) {
    console.log('   [V2] 使用新的工具注册系统');
    // registerToolsV2();
  } else {
    console.log('   [V1] 使用旧的工具注册系统');
    // registerToolsV1();
  }
}

// Hook 系统示例
function triggerHooks() {
  if (isFeatureEnabled('HOOK_SYSTEM_V2')) {
    console.log('   [V2] 触发新的 Hook 系统');
    // triggerHooksV2();
  } else {
    console.log('   [V1] 触发旧的 Hook 系统');
    // triggerHooksV1();
  }
}

// 缓存示例
function getCachedData() {
  if (isFeatureEnabled('CACHE_V2')) {
    console.log('   [V2] 使用新缓存系统');
    // return cacheV2.get(key);
  } else {
    console.log('   [V1] 使用旧缓存系统或无缓存');
    // return cacheV1.get(key);
  }
  return null;
}

registerTools();
triggerHooks();
getCachedData();

console.log('\n=== Demo 完成 ===');
