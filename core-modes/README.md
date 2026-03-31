# OpenClaw 核心能力开启

一键配置 OpenClaw 增强模式，实现长期记忆、主动思考、用户建模等核心能力。

## 模块列表

| 模块 | 说明 | 状态 |
|------|------|------|
| `memory/` | 长期记忆机制 | ✅ |
| `voice/` | 语音唤醒 | 🔜 |
| `jarvis/` | 贾维斯主动模式 | ✅ |
| `daemon/` | 后台守护进程 | ✅ |

## 一键安装全部核心能力

```bash
git clone https://github.com/lintong1111/openclaw-enhance.git
cd openclaw-enhance
chmod +x install-all.sh && ./install-all.sh
```

或者分别安装：

```bash
# 长期记忆
chmod +x memory/install.sh && ./memory/install.sh

# 贾维斯模式
chmod +x jarvis/install.sh && ./jarvis/install.sh

# 守护进程
chmod +x daemon/install.sh && ./daemon/install.sh
```

---

## 能力说明

### 长期记忆 (memory/)

**功能：**
- 自动记录用户使用习惯、偏好、常用任务类型
- 在未来对话中主动调用历史记忆
- 重要信息自动归档
- **禁止清除记忆，所有历史永久保存**

**文件：**
- `memory/SOUL.md` — 灵魂配置
- `memory/USER.md` — 用户画像
- `memory/MEMORY.md` — 长期记忆库
- `memory/.learnings/` — 学习记录

**安装后效果：**
- 每次对话自动学习用户偏好
- 重要信息自动归档到 MEMORY.md
- 下次对话自动调用相关记忆

---

### 语音唤醒 (voice/) 🔜

**功能：**
- 唤醒词：「龙虾」
- 支持随时打断、随时响应
- 需要外接麦克风设备

**待实现：**
- 需要安装 `say` 或 `espeak` 语音合成
- 需要麦克风设备支持

---

### 贾维斯模式 (jarvis/)

**功能：**
- 主动提醒、主动总结、主动优化
- 不啰嗦，高执行力
- 任务拆解、步骤建议
- 自动预判用户下一步操作

**文件：**
- `jarvis/SOUL.md` — 贾维斯灵魂配置
- `jarvis/AGENTS.md` — Agent 增强配置

**安装后效果：**
- 输出简洁、有结构、可执行
- 主动思考模式，回答前进行任务拆解
- 优先结果导向，避免空泛解释

---

### 守护进程 (daemon/)

**功能：**
- Gateway 开机自动启动
- 崩溃自动重启
- 24 小时持续运行

**文件：**
- `daemon/openclaw-gateway.service` — systemd 服务文件

**安装后效果：**
- 系统启动自动运行 OpenClaw Gateway
- 崩溃后自动恢复
- 无需手动干预

---

## 核心配置同步到 GitHub

安装后会自动将配置同步到 GitHub：

```bash
cd ~/.openclaw
git remote set-url origin https://<YOUR_TOKEN>@github.com/<YOUR_USERNAME>/openclaw-config.git
git add -A && git commit -m "Update config" && git push
```

---

## License

MIT
