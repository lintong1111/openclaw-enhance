# OpenClaw 自我进化模块

> 参考 Claude Code 泄露源码设计的自我学习能力

## 功能

- ✅ **自动记忆** — 记录用户偏好、习惯
- ✅ **错误追踪** — 自动记录失败和错误
- ✅ **教训记录** — 记录学习到的经验教训
- ✅ **功能需求追踪** — 记录想要但未实现的功能
- ✅ **Hook 自动提醒** — 每次启动时自动提醒反思
- ✅ **智能上下文注入** — 注入最近的 learnings 到 bootstrap 上下文

## 文件结构

```
openclaw-self-improvement/
├── .learnings/
│   ├── LEARNINGS.md       # 学到的教训
│   ├── ERRORS.md          # 错误记录
│   └── FEATURE_REQUESTS.md # 想要的功能
├── hooks/
│   └── self-improvement/
│       ├── HOOK.md        # Hook 定义
│       └── handler.ts     # Hook 处理逻辑
└── skills/
    └── skillify/         # Skill 生成器
```

## 安装

```bash
# 复制到 OpenClaw 工作目录
cp -r .learnings ~/.openclaw/workspace/
cp -r hooks ~/.openclaw/hooks/self-improvement
cp -r skills ~/.openclaw/workspace/skills/skillify
```
