# OpenClaw 多 Agent 协作系统

基于 Claude Code Team + Task 模型的多 Agent 协作实现。

## 核心模块

```
agents/team/
├── TeamManager.js   # 团队管理：创建/删除团队，成员管理
├── TaskManager.js   # 任务管理：状态机、创建/更新/查询任务
├── MessageBus.js    # 消息总线：Agent 间通信
├── coordinator.js   # 协调器：整合各模块，统一协调
├── tools.js         # 工具函数：提供给 Agent 调用的接口
└── example.js       # 使用示例
```

## 概念

### Team（团队）
- 包含多个 Agent 成员
- 可创建任务、广播消息
- 支持动态添加/移除成员

### Task（任务）
- 状态机：`pending → running → completed/failed/killed`
- 包含标题、描述、负责人、所属团队
- 支持结果和错误信息

### Message（消息）
- 类型：`message`, `shutdown_request`, `task_update`, `task_assignment`, `broadcast`
- 支持点对点和广播
- 每个 Agent 有独立收件箱

## 快速开始

```javascript
const Coordinator = require('./agents/team/coordinator');
const coordinator = new Coordinator();

// 创建团队
coordinator.createTeam({
  name: 'project-alpha',
  description: '项目A开发团队',
  members: [
    { name: 'backend-dev', agentType: 'general-purpose' },
    { name: 'frontend-dev', agentType: 'general-purpose' }
  ]
});

// 创建任务
coordinator.createTask({
  title: '实现登录功能',
  owner: 'backend-dev',
  teamName: 'project-alpha'
});

// Agent 间通信
coordinator.sendMessage({
  type: 'message',
  to: 'backend-dev',
  from: 'frontend-dev',
  content: '登录 API 文档在哪里？'
});
```

## 工具函数

在 OpenClaw 配置中加载 `tools.js`，Agent 可直接调用：

```javascript
// Team 操作
await tools.teamCreate({ name: 'team-name', members: [...] });
await tools.teamDelete({ name: 'team-name' });
await tools.teamList();
await tools.teamAddMember({ teamName: 'team-name', name: 'agent-1' });

// Task 操作
await tools.taskCreate({ title: '任务标题', owner: 'agent-1' });
await tools.taskUpdate({ taskId: 'task-1', updates: { owner: 'agent-2' } });
await tools.taskStatus({ taskId: 'task-1', status: 'completed' });
await tools.taskList({ teamName: 'team-name' });

// Message 操作
await tools.sendMessage({ to: 'agent-1', content: 'Hello!' });
await tools.broadcastToTeam({ teamName: 'team-name', content: '会议开始' });
await tools.getMessages({ agentName: 'agent-1', clear: true });

// Workflow
await tools.startTeamWorkflow({ teamName: 'team-name', tasks: [...] });
await tools.shutdownTeam({ teamName: 'team-name' });
await tools.getStatus();
```

## 协作流程

```
用户                    Main Agent              Backend Dev
 │                          │                       │
 │── "创建 feature-x 团队" ──→│                       │
 │                          │── teamCreate ─────────→│
 │                          │←─── team created ──────│
 │                          │                       │
 │── "创建任务: 实现登录" ───→│                       │
 │                          │── taskCreate ─────────→│
 │                          │←─── task created ──────│
 │                          │                       │
 │                          │←─── getMessages() ────│
 │                          │─── task assignment ───→│
 │                          │                       │
 │                          │←─── taskComplete() ───│
 │←─── 任务完成通知 ──────────│                       │
```

## 事件系统

各模块通过 EventEmitter 触发事件：

```javascript
coordinator.teamManager.on('team:created', (team) => { ... });
coordinator.teamManager.on('member:added', ({ team, member }) => { ... });
coordinator.taskManager.on('task:created', (task) => { ... });
coordinator.taskManager.on('task:completed', (task) => { ... });
coordinator.taskManager.on('task:failed', (task) => { ... });
coordinator.messageBus.on('message:sent', (message) => { ... });
```

## 任务状态机

```
     ┌─────────┐
     │ pending │
     └────┬────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌───────┐
│running │  │killed │
└───┬────┘  └───────┘
    │
  ┌─┴──┐
  │    │
  ▼    ▼
┌──┐  ┌───┐
│  │  │   │
▼  ▼  ▼   ▼
completed  failed
```

## 消息类型

| 类型 | 说明 |
|------|------|
| `message` | 普通消息 |
| `shutdown_request` | 关闭请求 |
| `task_update` | 任务状态更新 |
| `task_assignment` | 任务分配 |
| `task_complete` | 任务完成 |
| `task_fail` | 任务失败 |
| `broadcast` | 广播消息 |

## 集成 OpenClaw

在 OpenClaw 配置中添加：

```yaml
agents:
  team:
    enabled: true
    defaultAgents:
      - name: coder
        type: general-purpose
      - name: reviewer
        type: read-only

# 加载团队协作工具
tools:
  - name: team协作
    path: agents/team/tools.js
```
