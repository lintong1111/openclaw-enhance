---
name: skillify
description: >
  Capture learnings from conversation into reusable skills.
  Use when: the user says "create a skill from this", "save this workflow", 
  "make this repeatable", or when you notice a pattern being repeated 3+ times.
  Also automatically suggests skill creation when a feature request appears in learnings.
argument-hint: "<description of the workflow to capture>"
aliases:
  - create-skill
  - capture-workflow
  - save-as-skill
tags:
  - self-improvement
  - skill-creation
  - learning
---

# Skillify

从对话中提取可复用的工作流，创建为 OpenClaw Skill。

## 触发条件

- 用户明确要求："create a skill from this"、"save this workflow"
- 同一模式出现 3+ 次
- 功能需求在 learnings 中标记为高优先级

## 工作流程

### 1. 分析 Session

分析当前或历史的对话，识别：
- 什么操作是可复用的？
- 输入参数是什么？
- 具体步骤是什么？
- 成功标准是什么？

### 2. 询问用户

使用 `AskUserQuestion` 确认：
- Skill 名称和描述
- 触发词（when_to_use）
- 参数列表
- 保存位置（repo 专用 或 全局）

### 3. 生成 SKILL.md

```yaml
---
name: <skill-name>
description: >
  一句话描述
  Use when: <触发条件>
  Examples: '<example1>', '<example2>'
argument-hint: "<参数提示>"
allowed-tools:
  - <需要的工具>
context: inline
---

# <Skill Title>

## Inputs
- `$param`: 参数描述

## Goal
清晰的目标和成功标准

## Steps

### 1. Step Name
具体步骤

**Success criteria**: 完成标准
```

### 4. 保存和确认

保存到用户选择的位置，输出完整内容供确认。

## 示例

用户说："把刚才查 GitHub 仓库的流程保存成 skill"

→ 创建 `github-explorer` skill，包含：
- 仓库搜索步骤
- 信息提取格式
- 触发词：`"帮我看看这个项目"`, `"分析一下 repo"`

## 保存位置

- **Repo 专用**：`~/.openclaw/workspace/skills/<name>/`
- **全局**：`~/.openclaw/workspace/skills/<name>/`

## 工具权限

Skillify 需要以下工具：
- `Read` - 读取对话历史
- `Write` - 写入 skill 文件
- `Glob` - 检查 skill 是否存在
- `Grep` - 搜索历史模式
