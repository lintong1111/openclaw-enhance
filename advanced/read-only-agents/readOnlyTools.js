/**
 * Read-Only Agent Tools
 * 只读 Agent 的工具权限控制
 */

// 只读工具白名单
const READ_ONLY_TOOLS = [
  'read',
  'glob',
  'grep',
  'find',
  'cat',
  'head',
  'tail',
  'wc',
  'tree',
  'stat'
]

// 只读 Bash 命令白名单
const READ_ONLY_BASH_COMMANDS = [
  // 文件列表
  'ls', 'la', 'll', 'dir',
  // Git 只读
  'git status', 'git log', 'git log --oneline', 'git log -n',
  'git diff', 'git diff --staged', 'git show',
  'git branch', 'git tag', 'git remote -v',
  'git stash list', 'git reflog',
  'git describe', 'git rev-parse',
  // 搜索
  'find', 'grep', 'rg', 'ag', 'findstr',
  // 文件内容
  'cat', 'head', 'tail', 'less', 'more',
  'wc', 'sort', 'uniq', 'cut', 'tr',
  // 信息
  'pwd', 'whoami', 'id', 'date', 'cal',
  'which', 'whereis', 'file',
  'df', 'du', 'free', 'top', 'ps',
  'env', 'printenv', 'set',
  // 网络
  'ping', 'curl', 'wget', 'nslookup', 'dig',
  // 其他
  'tree', 'stat', 'md5sum', 'sha256sum',
  'base64', 'xxd', 'hexdump'
]

// 写操作工具黑名单
const WRITE_TOOLS = [
  'write',
  'edit',
  'delete',
  'mkdir',
  'touch',
  'rm',
  'cp',
  'mv',
  'chmod',
  'chown',
  'exec',
  'bash (写操作)',
  'shell (写操作)'
]

// Bash 写操作命令黑名单
const WRITE_BASH_COMMANDS = [
  // 文件操作
  'touch', 'mkdir', 'rm', 'rmdir', 'rm -rf',
  'cp', 'mv', 'ln', 'unlink',
  'chmod', 'chown', 'chgrp',
  'cat >', 'echo >', 'printf >', 'tee',
  'dd', 'mkfs',
  // 包管理
  'apt', 'apt-get', 'aptitude',
  'yum', 'dnf', 'pacman', 'zypper',
  'npm install', 'npm uninstall', 'npm add',
  'pip install', 'pip uninstall',
  'yarn add', 'yarn remove',
  'pnpm add', 'pnpm remove',
  // Git 写操作
  'git add', 'git commit', 'git push', 'git pull',
  'git merge', 'git rebase',
  'git checkout', 'git switch',
  'git stash', 'git stash pop', 'git stash drop',
  'git reset', 'git revert',
  'git rm', 'git mv',
  // Docker
  'docker build', 'docker run', 'docker exec',
  'docker stop', 'docker rm', 'docker rmi',
  'docker-compose up', 'docker-compose down',
  // 系统
  'sudo', 'su',
  'kill', 'killall', 'pkill',
  'reboot', 'shutdown', 'halt', 'poweroff',
  'systemctl', 'service',
  // 网络
  'ssh', 'scp', 'sftp',
  'curl -X POST', 'curl -X PUT', 'curl -X DELETE',
  'wget --post-data',
  // 其他
  'vim', 'vi', 'nano', 'emacs', 'subl',
  'crontab', 'at',
  'export', 'source',
  'eval', 'exec'
]

/**
 * 检查工具是否允许
 */
function isToolAllowed(toolName, allowedTools = READ_ONLY_TOOLS) {
  if (allowedTools.includes('*')) return true // 全允许
  return allowedTools.includes(toolName)
}

/**
 * 检查 Bash 命令是否只读
 */
function isBashCommandAllowed(command, allowedCommands = READ_ONLY_BASH_COMMANDS) {
  const normalized = command.trim().toLowerCase()
  
  // 检查是否匹配白名单
  for (const allowed of allowedCommands) {
    if (normalized === allowed.toLowerCase() || normalized.startsWith(allowed.toLowerCase() + ' ')) {
      return { allowed: true }
    }
  }
  
  // 检查是否在黑名单中
  for (const forbidden of WRITE_BASH_COMMANDS) {
    if (normalized.includes(forbidden.toLowerCase())) {
      return {
        allowed: false,
        reason: `只读 Agent 不能执行: ${forbidden}`
      }
    }
  }
  
  return { allowed: true }
}

/**
 * 工具权限检查器
 */
class ToolPermissionChecker {
  constructor(config = {}) {
    this.allowedTools = config.allowedTools || READ_ONLY_TOOLS
    this.allowedBashCommands = config.allowedBashCommands || READ_ONLY_BASH_COMMANDS
    this.strict = config.strict || false
  }

  check(toolName, args = {}) {
    // 非严格模式下，Bash 命令单独检查
    if (toolName === 'bash' || toolName === 'exec') {
      return this.checkBash(args.command || '')
    }
    
    // 非严格模式下，Read 工具默认允许
    if (READ_ONLY_TOOLS.includes(toolName)) {
      return { allowed: true }
    }
    
    // 严格模式：只允许白名单
    if (this.strict) {
      if (this.allowedTools.includes('*')) {
        return { allowed: true }
      }
      if (this.allowedTools.includes(toolName)) {
        return { allowed: true }
      }
      return {
        allowed: false,
        reason: `只读 Agent 不能使用工具: ${toolName}`
      }
    }
    
    return { allowed: true }
  }

  checkBash(command) {
    const result = isBashCommandAllowed(command, this.allowedBashCommands)
    if (!result.allowed && this.strict) {
      return {
        allowed: false,
        reason: result.reason,
        suggestion: '使用只读命令如 git status, cat, ls 等'
      }
    }
    return result
  }

  getAllowedTools() {
    return [...READ_ONLY_TOOLS, 'bash']
  }

  getInfo() {
    return {
      mode: this.strict ? 'strict' : 'permissive',
      allowedTools: this.allowedTools,
      allowedBashCount: this.allowedBashCommands.length,
      writeCommandsBlocked: WRITE_BASH_COMMANDS.length
    }
  }
}

/**
 * 只读 Agent 工厂
 */
function createReadOnlyAgent(name = 'read-only') {
  return {
    name,
    type: 'read-only',
    description: '只读调研 Agent，用于搜索和分析',
    tools: READ_ONLY_TOOLS,
    checker: new ToolPermissionChecker({ strict: true }),
    
    check(toolName, args) {
      return this.checker.check(toolName, args)
    },
    
    getInfo() {
      return {
        name: this.name,
        type: this.type,
        description: this.description,
        ...this.checker.getInfo()
      }
    }
  }
}

// 导出
module.exports = {
  READ_ONLY_TOOLS,
  READ_ONLY_BASH_COMMANDS,
  WRITE_TOOLS,
  WRITE_BASH_COMMANDS,
  isToolAllowed,
  isBashCommandAllowed,
  ToolPermissionChecker,
  createReadOnlyAgent
}
