# OpenClaw 自我进化技能包

让 OpenClaw 具备自我学习、记忆和持续改进能力。

**增强版：** 参考 Claude Code 的 self-improvement 设计，增加了智能学习和 Skill 生成功能。

## 功能特性

- ✅ **自动记忆** — 记录用户偏好、习惯
- ✅ **错误追踪** — 自动记录失败和错误
- ✅ **教训记录** — 记录学习到的经验教训
- ✅ **功能需求追踪** — 记录想要但未实现的功能
- ✅ **Hook 自动提醒** — 每次启动时自动提醒反思
- ✅ **智能上下文注入** — 注入最近的 learnings 到 bootstrap 上下文
- ✅ **Skill 生成** — 从 learnings 自动创建可复用的 Skill

## 快速安装

### 一键安装

```bash
git clone https://github.com/lintong1111/openclaw-self-improvement.git
cd openclaw-self-improvement
chmod +x install.sh && ./install.sh
```

### 手动安装

```bash
# 创建目录
mkdir -p ~/.openclaw/workspace/.learnings
mkdir -p ~/.openclaw/hooks/self-improvement
mkdir -p ~/.openclaw/workspace/skills/skillify

# 复制学习记录模板
cp -r .learnings/* ~/.openclaw/workspace/.learnings/

# 复制 Hook 配置
cp -r hooks/openclaw/* ~/.openclaw/hooks/self-improvement/

# 复制 Skillify skill
cp -r skills/skillify/* ~/.openclaw/workspace/skills/skillify/

# 启用 Hook
openclaw hooks enable self-improvement
```

### 验证安装

```bash
openclaw hooks list
ls ~/.openclaw/workspace/.learnings/
ls ~/.openclaw/workspace/skills/skillify/
```

## 文件结构

```
.
├── README.md
├── install.sh
├── .learnings/                    # 学习记录目录（workspace 级别）
│   ├── LEARNINGS.md              # 教训记录
│   ├── ERRORS.md                 # 错误记录
│   └── FEATURE_REQUESTS.md       # 功能需求
├── hooks/
│   └── openclaw/                 # OpenClaw Hook（增强版）
│       ├── HOOK.md
│       ├── handler.js             # 智能提醒 + 上下文注入
│       └── handler.ts
└── skills/
    └── skillify/                 # Skill 生成 Skill
        └── SKILL.md
```

## 核心功能

### 1. Hook 增强版（handler.js）

**智能提醒：**
- 每次 `agent:bootstrap` 自动触发
- 读取 `.learnings/` 下最近的教训
- 注入到 bootstrap 上下文供 Agent 参考
- 自动检测高优先级的功能需求，提示创建 Skill

**上下文注入：**
```
agent:bootstrap
    ↓
handler.js 读取 recent learnings
    ↓
注入到 bootstrapFiles
    ↓
Agent 看到最近的教训和提醒
```

### 2. Skillify（从学习创建 Skill）

**触发条件：**
- 用户明确要求："create a skill from this"
- 同一模式出现 3+ 次
- 功能需求标记为高优先级

**工作流程：**
```
分析 session → 询问确认 → 生成 SKILL.md → 保存 → 确认
```

## 学习记录格式

### LEARNINGS.md — 教训记录

```markdown
## 2026-03-31 tool-gotcha: 错误描述

**问题：** 简述问题
**原因：** 根本原因
**解决：** 解决方案
**Pattern：** 抽象出的模式
```

### ERRORS.md — 错误记录

```markdown
## 2026-03-31 integration: 服务名

**错误：** 错误信息
**影响：** 影响范围
**修复：** 修复方法
**预防：** 预防措施
```

### FEATURE_REQUESTS.md — 功能需求

```markdown
## 功能名称

**描述：** 功能说明
**场景：** 使用场景
**优先级：** 高/中/低
```

## 使用场景

| 情况 | 记录位置 |
|------|---------|
| 用户纠正你 | `.learnings/LEARNINGS.md` |
| 命令执行失败 | `.learnings/ERRORS.md` |
| 用户想要新功能 | `.learnings/FEATURE_REQUESTS.md` |
| 发现更好的方法 | `.learnings/LEARNINGS.md` |
| 重要教训 | 升级到 `MEMORY.md` |
| 可复用的工作流 | 用 `skillify` 创建 Skill |

## 重要教训升级规则

| 内容类型 | 升级目标 |
|---------|---------|
| 行为模式 | `SOUL.md` |
| 工作流改进 | `AGENTS.md` |
| 工具技巧 | `TOOLS.md` |
| 可复用流程 | 创建 Skill |

## 卸载

```bash
openclaw hooks disable self-improvement
rm -rf ~/.openclaw/hooks/self-improvement
rm -rf ~/.openclaw/workspace/skills/skillify
```

## 更新日志

- **2026-03-31 v2**：增强 Hook handler，添加智能上下文注入和 skillify 功能
- 2026-03-31 v1：初始版本，基础 learnings 功能

## 参考

- Claude Code self-improvement 分析
- OpenClaw Hook 系统文档

## License

MIT
