#!/usr/bin/env node

/**
 * OpenClaw MCP Server
 * 
 * 将 OpenClaw 工具暴露为 MCP 工具，供外部 MCP Client 使用
 * 
 * 使用方式: node server.js
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { zodToJsonSchema } from 'zod';

const PORT = process.env.PORT || 3000;
const SERVER_NAME = 'openclaude';
const SERVER_VERSION = '1.0.0';

// 工具定义
const TOOLS = [
  {
    name: 'exec',
    description: 'Execute a shell command',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
        cwd: { type: 'string', description: 'Working directory' },
        timeout: { type: 'number', description: 'Timeout in milliseconds' }
      },
      required: ['command']
    }
  },
  {
    name: 'read',
    description: 'Read file contents',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
        offset: { type: 'number', description: 'Line offset to start reading' },
        limit: { type: 'number', description: 'Maximum lines to read' }
      },
      required: ['path']
    }
  },
  {
    name: 'write',
    description: 'Write content to a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'glob',
    description: 'Search for files matching a pattern',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern (e.g., **/*.js)' },
        cwd: { type: 'string', description: 'Working directory' }
      },
      required: ['pattern']
    }
  },
  {
    name: 'grep',
    description: 'Search for text in files',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Text pattern to search' },
        path: { type: 'string', description: 'Directory or file to search' },
        caseSensitive: { type: 'boolean', description: 'Case sensitive search' }
      },
      required: ['pattern']
    }
  }
];

// 工具执行函数
async function executeTool(name, args) {
  const { exec, read, write, glob, grep } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  const fs = await import('fs');
  const path = await import('path');

  switch (name) {
    case 'exec': {
      const { command, cwd = process.cwd(), timeout = 30000 } = args;
      try {
        const { stdout, stderr } = await execAsync(command, { cwd, timeout });
        return { stdout, stderr, success: true };
      } catch (error) {
        return { stdout: error.stdout || '', stderr: error.stderr || error.message, success: false };
      }
    }
    case 'read': {
      const { path: filePath, offset = 0, limit = 1000 } = args;
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const slice = lines.slice(offset, offset + limit);
        return { content: slice.join('\n'), lines: slice.length, total: lines.length };
      } catch (error) {
        return { error: error.message };
      }
    }
    case 'write': {
      const { path: filePath, content } = args;
      try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    }
    case 'glob': {
      const { pattern, cwd = process.cwd() } = args;
      // 简单 glob 实现
      const { execSync } = exec;
      try {
        const result = execSync(`find ${cwd} -name "${pattern.replace(/\*/g, '*')}" 2>/dev/null | head -100`, { encoding: 'utf-8' });
        return { files: result.split('\n').filter(Boolean) };
      } catch {
        return { files: [] };
      }
    }
    case 'grep': {
      const { pattern, path: searchPath = '.', caseSensitive = true } = args;
      const { execSync } = exec;
      const flag = caseSensitive ? '' : 'i';
      try {
        const result = execSync(`grep -r${flag} "${pattern}" "${searchPath}" 2>/dev/null | head -100`, { encoding: 'utf-8' });
        return { matches: result.split('\n').filter(Boolean) };
      } catch {
        return { matches: [] };
      }
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// 创建 MCP Server
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表处理器
server.setRequestHandler(
  { type: 'tools/list' },
  async () => {
    return {
      tools: TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  }
);

// 注册工具调用处理器
server.setRequestHandler(
  { type: 'tools/call' },
  async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      const result = await executeTool(name, args || {});
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_NAME} v${SERVER_VERSION} started`);
}

main().catch(console.error);
