# OpenClaw Skill System

OpenClaw 的 Skill 系统允许通过 Markdown + YAML frontmatter 定义可复用的技能模块。

## Skill 格式

每个 Skill 是一个 `.md` 文件，顶部的 YAML frontmatter 定义元数据，后面是 Markdown 正文：

```yaml
---
name: my-skill
description: 这个技能的描述
whenToUse: 什么时候使用
args:
  - name: arg1
    description: 参数描述
    required: true
    source: user
    shell: bash
---

# My Skill

这里是技能的详细描述和指令...
```

### Frontmatter 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 技能唯一名称 |
| `description` | string | ✅ | 简短描述 |
| `whenToUse` | string | ✅ | 使用场景说明 |
| `args` | array | ❌ | 参数定义列表 |
| `source` | string | ❌ | 来源标记（user/managed/plugin/bundled）|
| `shell` | string | ❌ | 运行环境（bash/node/python）|

### args 参数对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 参数名 |
| `description` | string | ✅ | 参数描述 |
| `required` | boolean | ❌ | 是否必填，默认 false |
| `source` | string | ❌ | 参数来源（user/shell/env）|
| `shell` | string | ❌ | 参数处理 shell 类型 |

## Skill 目录

| 来源 | 路径 |
|------|------|
| `userSettings` | `~/.openclaw/skills/` |
| `projectSettings` | `./.openclaw/skills/` |
| `managed` | 托管目录 |
| `plugin` | 插件目录 |
| `bundled` | 内置目录 |

## 使用方式

```typescript
import { loadSkills, getSkill, executeSkill } from './skill-system'

// 加载所有来源的技能
const allSkills = [
  ...loadSkills('userSettings'),
  ...loadSkills('bundled'),
]

// 获取指定技能
const skill = getSkill('my-skill')

// 执行技能
const result = await executeSkill(skill, { arg1: 'value' })
```

## 目录结构

```
openclaw-skill-system/
├── SKILL.md                      # 本文档
├── skill-system.ts               # 核心类型定义
├── skill-loader.ts               # 技能加载器
├── skill-parser.ts               # YAML frontmatter 解析器
├── skill-executor.ts             # 技能执行器
└── index.ts                      # 统一导出
```
