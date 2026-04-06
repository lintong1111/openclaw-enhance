# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## 飞书配置

- App ID: cli_a94a022ce6399bce
- App Secret: xtwSKjDHIn0fFPkgZw4dGdwwA5ChUPkm
- User Open ID: ou_0e9129fe54cde04a4d42d5d5d128401d
- Token: t-g10441i5UG37VPXLAIVSRC4WHH2OMMAWB26SJMEI

发送消息 API: `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id`

---

## Windows Agent

- 地址: http://192.168.50.5:5000
- 用途: 控制 Windows 桌面应用（微信/QQ/浏览器/文件资源管理器）
- 共享目录: /mnt/shared/windows-agent/

### Windows Agent (桌面控制 v2.0)
- 地址: http://192.168.50.5:5000
- 共享路径: /mnt/shared/windows-agent/
- 能力: 截图 | 鼠标 | 键盘 | 游戏自动化

### 调用示例

```bash
# 截图
curl http://192.168.50.5:5000/api/computer/screenshot

# 鼠标移动
curl -X POST http://192.168.50.5:5000/api/computer/mouse/move -d '{"x": 500, "y": 300}'

# 键盘按键
curl -X POST http://192.168.50.5:5000/api/computer/keyboard/press -d '{"key": "space"}'

# 游戏动作序列
curl -X POST http://192.168.50.5:5000/api/game/action -d '{"actions": [{"type":"click","x":500,"y":300}]}'
```
