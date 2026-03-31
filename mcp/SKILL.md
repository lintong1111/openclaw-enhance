---
name: mcp
description: MCP (Model Context Protocol) server - exposes OpenClaw tools as MCP tools
allowed-tools:
  - exec
  - read
  - write
when_to_use: |
  Use when you need to connect to external MCP servers or expose OpenClaw tools to other MCP clients.
  Examples: 'start MCP server', 'connect to MCP server', 'run MCP tools'
context: fork
---

# MCP - Model Context Protocol

## 功能

1. **MCP Server 模式**：将 OpenClaw 工具暴露给外部 MCP Client
2. **MCP Client 模式**：连接外部 MCP Server 获取更多工具

## 使用方式

### 启动 MCP Server（将 OpenClaw 作为 Host）

```bash
openclaw mcp
```

### 连接外部 MCP Server

在 `openclaw.json` 中配置：
```json
{
  "mcp": {
    "servers": [
      {
        "name": "filesystem",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
      }
    ]
  }
}
```

## MCP 工具

当 OpenClaw 作为 MCP Host 时，外部客户端可以使用以下工具：
- `exec` - 执行命令
- `read` - 读取文件
- `write` - 写入文件
- `glob` - 文件搜索
- `grep` - 内容搜索

## 协议

使用标准 MCP 协议（stdio 传输），兼容所有 MCP 客户端。
