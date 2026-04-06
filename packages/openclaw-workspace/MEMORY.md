# MEMORY.md - 长期记忆

## 用户配置 (2026-03-30 更新)

### 增强模式已启用 ✅
- 长期记忆机制 — 永不丢失
- 主动思考模式 — 任务拆解、步骤建议
- 技能自动调度 — 实时信息/web_search、网页/browser/ playwright、事务管理/日历邮箱
- 用户建模 — 分析风格、优化回复
- 贾维斯模式 — 主动提醒、主动总结、主动优化
- 输出原则：简洁、结构化、结果导向、可执行优先

### 特殊规则 ⚠️
- 禁止清除记忆
- 禁止重置配置
- 所有历史永久保存
- 自动增量学习，每次交互后总结学习点

### 用户特征（从对话中学习）
- **表达风格**：简洁直接，说完即止，不废话
- **决策风格**：快速果断，问什么答什么，不纠结
- **技术偏好**：喜欢具体数字和方案，不喜欢空泛理论
- **行为模式**：问完"可以吗"就去做，执行力强
- **幽默感**：偶尔，比如"给你用"配96G内存

### 系统配置（新机器 2026-03-30）
| 项目 | 值 |
|------|-----|
| IP | 10.10.10.100 |
| Hostname | tony-MU70-SU0 |
| CPU | Xeon E5-2696 v4 (22c44t) |
| 内存 | 96GB |
| 系统盘 | 1.8TB NVMe (/) |
| 数据盘 | 512GB SSD (/mnt) |
| Gateway | 18789 端口 |
| 状态 | 迁移完成，配置就绪 |

### 旧机器（已退役）
- IP: 192.168.50.100
- 状态: 已关机

### 多智能体架构 (6个Agent)
| Agent | 职责 |
|-------|------|
| main | 主控调度 |
| research | 搜索/分析 |
| coding | 代码/脚本 |
| doc | 文档/报告 |
| scheduler | 日程/提醒 |
| memory | 记忆/学习 |

### API配置
- Minimax M2.5 / M2.7 (默认)
- OpenClaw Gateway 服务运行中

## 常用网站
- **ClawHub**: https://clawhub.ai/ - OpenClaw 技能商店
- **飞书**: https://feishu.cn

## 待学习
- 用户具体项目和工作流程
- 更多技术偏好
- 自动化场景需求

## 持久化配置（永不丢失）

### Self-Improvement Hook ✅
- 安装目录: `~/.openclaw/hooks/self-improvement/`
- 学习记录: `~/.openclaw/workspace/.learnings/`
- Hook 名称: `self-improvement`
- 功能: 每次交互后自动记录错误、用户纠正、feature request

### Cron 定时任务
| 名称 | 执行时间 | 功能 |
|------|---------|------|
| 每日对话总结 | 每天 10:00 | 总结最近两天对话，推送给用户 |
| TurboQuant 监控 | 每天 10:00 | 监控 Ollama/vLLM 集成进展，有进展推送 |

### 用户偏好记录
- 凌晨时段活跃（01:00 左右经常在）
- 说话简短，"算了，没事"= 暂时不需要
- 技术问题要具体数字和方案
- 喜欢高配置硬件
- 有 Homelab / 软路由背景
- 两台宽带（翻墙/不翻墙）
- 显卡: 3090 Ti（待到货）

### 硬件资产
- CPU: Xeon E5-2696 v4 (22c44t)
- 内存: 96GB
- 显卡: 3090 Ti（购买中）
- 系统盘: 1.8TB NVMe
- 数据盘: 512GB SSD

### Claude Code 泄露源码
- 路径: `~/.openclaw/workspace/claude-code-leaked/`
- 大小: 44MB, 1902文件, 1332个TypeScript
- 内容: Anthropic Claude Code 完整泄露源码
- 分析报告: `~/.openclaw/workspace/data/claude-code-analysis/00_overview.md`
- 用途: 参考 Claude Code 的架构设计优化 OpenClaw

### 重要教训 ⚠️
- Cron 任务跟 session 绑定，session reset 会丢失 → 已改用持久化 cron 存储
- 飞书 WebSocket 长连接断线后需要 restart gateway 重连
- 迁移机器时要备份 `~/.openclaw/` 整个目录
