# 🦞 OpenClaw Master

> OpenClaw 一站式增强包 — 一次安装，全部搞定

整合 5 大核心模块 + 自我进化 + 语音唤醒 + Workspace 配置，开机即用的贾维斯模式。

```
                    ┌─────────────────────────────────────┐
                    │          OpenClaw Master            │
                    │         「龙虾」增强包 v1.0          │
                    └─────────────────────────────────────┘
                                          │
        ┌─────────────────────────────────┼────────────────────────┐
        │                                 │                        │
        ▼                                 ▼                        ▼
┌───────────────────┐    ┌──────────────────────────┐    ┌──────────────────┐
│  OpenClaw Enhance │    │  OpenClaw Self-Improve    │    │ OpenClaw Voice   │
│   5大核心模块      │    │      自我进化             │    │    语音唤醒       │
│                   │    │                          │    │                  │
│ • ToolFactory     │    │ • 自动记忆               │    │ 待实现            │
│ • FeatureFlag     │    │ • 错误追踪               │    │ • Porcupine      │
│ • CacheCompact   │    │ • 教训记录               │    │ • 唤醒词「龙虾」  │
│ • SkillSystem    │    │ • 功能需求               │    │                  │
│ • HookSystem     │    │ • Hook提醒               │    └──────────────────┘
└───────────────────┘    └──────────────────────────┘
        │                                 │
        └──────────────┬──────────────────┘
                       ▼
            ┌─────────────────────┐
            │  OpenClaw Workspace │
            │    Workspace 配置    │
            │                     │
            │ • SOUL.md          │
            │ • USER.md           │
            │ • AGENTS.md         │
            │ • HEARTBEAT.md      │
            │ • MEMORY.md         │
            │ • .learnings/       │
            │ • hooks/           │
            └─────────────────────┘
```

## 📦 Packages

| Package | 说明 | 状态 |
|---------|------|------|
| `openclaw-enhance` | 核心增强包（5大模块） | ✅ |
| `openclaw-self-improvement` | 自我学习进化 | ✅ |
| `openclaw-voice-wake` | 语音唤醒 | 🔜 |
| `openclaw-workspace` | Workspace 配置 | ✅ |

---

## 🚀 一键安装

```bash
git clone https://github.com/lintong1111/openclaw-master.git
cd openclaw-master
chmod +x install.sh && ./install.sh
```

---

## 🎯 核心能力

### 1. buildTool 工厂模式
统一工具注册，强制安全标记（isReadOnly/isConcurrencySafe/isDestructive）

### 2. Feature Flag 系统
灰度发布、环境变量覆盖、热更新、GrowthBook 集成

### 3. 多级缓存
- L1 CompletionCache — API 响应缓存
- L2 ToolSchemaCache — Schema 只解析一次
- L3 ConversationRecovery — Checkpoint 持久化

### 4. AutoCompact
长会话自动压缩，保留关键上下文

### 5. Skill 系统
Markdown + YAML frontmatter 定义技能，5个来源加载

### 6. Hook 系统
6种事件 × 7级优先级 × 4种命令类型，细粒度拦截

### 7. 自我进化
每次交互后记录 learnings，自动增量学习

### 8. 语音唤醒 🔜
唤醒词「龙虾」，随时打断，随时响应

---

## ⚙️ Workspace 配置

| 文件 | 说明 |
|------|------|
| `SOUL.md` | 贾维斯灵魂配置 |
| `USER.md` | 用户画像 |
| `AGENTS.md` | 多智能体调度 |
| `HEARTBEAT.md` | 后台任务监控 |
| `MEMORY.md` | 长期记忆 |
| `TOOLS.md` | 工具配置 |
| `.learnings/` | 学习记录 |

---

## 📄 许可证

MIT
