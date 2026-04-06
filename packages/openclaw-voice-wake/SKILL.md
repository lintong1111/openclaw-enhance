# OpenClaw Voice Wake - 语音唤醒模块

## 状态：待实现

唤醒词：「龙虾」

## 技术方案

使用 Porcupine (Picovoice) 实现自定义唤醒词：

```
npm install @picovoice/porcupine
```

## 使用方法

```javascript
import { WakeWord } from './wake-word'

const wake = new WakeWord({
  keyword: 'lobster',  // 唤醒词
  sensitivity: 0.7
})

wake.on('wake', () => {
  console.log('🦞 龙虾被唤醒！')
})

wake.start()
```

## 待完成

- [ ] 安装 Porcupine SDK
- [ ] 训练「龙虾」唤醒词模型
- [ ] 集成到 OpenClaw
- [ ] 测试验证
