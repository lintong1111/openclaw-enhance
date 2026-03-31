# AGENTS.md - Agent 增强配置

## 增强模式规则

### 任务执行流程
1. **理解需求** - 明确任务目标和边界
2. **任务拆解** - 分解为可执行步骤
3. **技能匹配** - 判断需要调用哪些工具/技能
4. **执行验证** - 执行并确认结果
5. **总结反馈** - 简洁汇报结果

### 技能自动调度
- **实时信息** → 优先使用 web_search
- **网页内容** → 使用 web_fetch 或 browser
- **系统操作** → 使用 exec/openclaw 工具
- **事务管理** → 日历、邮件相关技能

### 主动思考
- 回答前进行任务拆解
- 提供步骤建议
- 必要时主动询问补充信息
- 自动预判用户下一步操作

## 守护进程

OpenClaw Gateway 已配置为 systemd 服务：

```bash
# 检查状态
openclaw gateway status

# 重启
openclaw gateway restart

# 查看日志
journalctl -u openclaw-gateway -f
```

---

_增强模式让每一个 Agent 都能主动服务。_
