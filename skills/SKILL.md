---
name: team
displayName: Team 协作
description: Multi-agent collaboration system - create teams, manage tasks, coordinate agents
allowed-tools:
  - exec
  - read
  - write
  - glob
when_to_use: |
  Use when you need multiple agents to work together on a complex task.
  Examples: 'create a team', 'assign task to agent', 'team status', '/team', 
  'start a project with multiple agents', 'coordinate agents'
context: fork
argument-hint: "<team-command> [arguments]"
aliases:
  - team-create
  - team-delete
  - task-create
  - task-list
  - task-update
  - send-message
tags:
  - multi-agent
  - collaboration
  - team
  - task-management
---

# Team - 多 Agent 协作系统

## 概念

- **Team**：一个团队，包含多个 Agent 成员
- **Task**：任务，归属某个团队，可分配给成员
- **Message**：成员间消息通信

## 团队管理

### 创建团队
```
teamCreate("project-alpha", "Building the new feature")
```

### 添加成员
```
teamAddMember("project-alpha", "backend-dev", "general-purpose")
teamAddMember("project-alpha", "frontend-dev", "general-purpose")
teamAddMember("project-alpha", "reviewer", "read-only")
```

### 删除团队
```
teamDelete("project-alpha")
```

## 任务管理

### 创建任务
```
taskCreate("Implement login API", "project-alpha", "backend-dev")
```

### 查看任务
```
taskList("project-alpha")  // 所有任务
taskList("project-alpha", "pending")  // 只看 pending
```

### 更新任务状态
```
taskUpdate("task-1234567890", { status: "running" })
taskUpdate("task-1234567890", { status: "completed" })
```

## 消息通信

### 发送消息
```
sendMessage("backend-dev", "Login API 完成了，开始做用户模块", "project-alpha")
```

## 工作流程

1. **创建团队** → `teamCreate()`
2. **添加成员** → `teamAddMember()`
3. **创建任务** → `taskCreate()`
4. **分配任务** → `taskUpdate({ owner: "backend-dev" })`
5. **成员工作** → `sendMessage()` 通知
6. **完成** → `taskUpdate({ status: "completed" })`
7. **关闭团队** → `teamDelete()`

## 工具文件

工具实现在：`~/.openclaw/workspace/agents/team/skills/team-tools.js`
