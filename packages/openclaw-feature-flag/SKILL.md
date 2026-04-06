# OpenClaw Feature Flag System

Feature Flag 条件编译系统，用于动态控制功能开关、支持灰度发布和环境变量覆盖。

## 目录结构

```
openclaw-feature-flag/
├── SKILL.md                    # 本文档
├── feature-flag.ts             # 核心实现
├── config.ts                   # 默认配置
└── example-usage.ts            # 使用示例
```

## 核心 API

### `loadFeatureFlags(): Map<string, FeatureFlagConfig>`
从配置文件加载所有 Feature Flag 配置。

### `isFeatureEnabled(name: string): boolean`
判断某个功能是否启用。支持：
- 环境变量覆盖：`OPENCLAW_FLAG_<NAME>=true|false`
- Rollout percentage 灰度发布

### `getFeatureValue<T>(name: string, defaultValue: T): T`
获取特性值，支持类型转换。

### `setFeatureEnabled(name: string, enabled: boolean): void`
运行时动态启用/禁用功能。

### `reloadFeatureFlags(): void`
重新加载配置文件（热更新）。

## 环境变量覆盖

```bash
# 启用某功能
OPENCLAW_FLAG_TOOL_REGISTRY_V2=true

# 禁用某功能
OPENCLAW_FLAG_HOOK_SYSTEM_V2=false
```

## 内置 Feature Flags

| Flag | 默认值 | 描述 |
|------|--------|------|
| TOOL_REGISTRY_V2 | false | 新工具注册系统 |
| HOOK_SYSTEM_V2 | false | 新Hook系统 |
| AUTO_COMPACT | false | 自动压缩 |
| SKILL_SYSTEM_V2 | false | 新Skill系统 |
| CACHE_V2 | false | 新缓存系统 |

## GrowthBook 集成（可选）

如需使用 GrowthBook SDK：
```typescript
import { initGrowthBook, getGrowthBookValue } from './growthbook-adapter';

// 初始化 GrowthBook
const gb = initGrowthBook({
  apiHost: 'https://cdn.growthbook.io',
  clientKey: 'your-client-key',
  enableTracking: true,
});

// 获取值
const value = getGrowthBookValue(gb, 'FEATURE_NAME', false);
```

## 使用示例

```typescript
import { isFeatureEnabled, getFeatureValue, setFeatureEnabled } from './feature-flag';

// 检查功能
if (isFeatureEnabled('TOOL_REGISTRY_V2')) {
  // 使用新的工具注册系统
}

// 获取特性值
const timeout = getFeatureValue('CACHE_V2', true);

// 动态启用
setFeatureEnabled('AUTO_COMPACT', true);
```
