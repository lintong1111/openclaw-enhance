/**
 * OpenClaw Skill System - 技能执行器
 */

import { spawn } from 'child_process'
import type { LoadedSkill, SkillContext, SkillExecutionResult } from './skill-system'

/**
 * 执行技能
 */
export async function executeSkill(
  skill: LoadedSkill,
  context: SkillContext
): Promise<SkillExecutionResult> {
  const startTime = Date.now()

  try {
    // 根据 shell 类型选择执行方式
    const shell = skill.metadata.shell || 'bash'

    if (shell === 'bash' || shell === 'sh') {
      return await executeBash(skill.content, context, startTime)
    } else if (shell === 'node' || shell === 'javascript') {
      return await executeNode(skill.content, context, startTime)
    } else if (shell === 'python' || shell === 'python3') {
      return await executePython(skill.content, context, startTime)
    } else {
      // 默认作为 bash 脚本执行
      return await executeBash(skill.content, context, startTime)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime: Date.now() - startTime,
    }
  }
}

/**
 * 执行 Bash 脚本
 */
function executeBash(
  script: string,
  context: SkillContext,
  startTime: number
): Promise<SkillExecutionResult> {
  return new Promise((resolve) => {
    const shell = spawn('bash', ['-c', script], {
      env: { ...process.env, ...context.env },
      cwd: context.cwd || process.cwd(),
    })

    let stdout = ''
    let stderr = ''

    shell.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    shell.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    shell.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr || undefined,
        executionTime: Date.now() - startTime,
      })
    })

    shell.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      })
    })
  })
}

/**
 * 执行 Node.js 脚本
 */
function executeNode(
  script: string,
  context: SkillContext,
  startTime: number
): Promise<SkillExecutionResult> {
  return new Promise((resolve) => {
    const child = spawn('node', ['-e', script], {
      env: { ...process.env, ...context.env },
      cwd: context.cwd || process.cwd(),
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr || undefined,
        executionTime: Date.now() - startTime,
      })
    })

    child.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      })
    })
  })
}

/**
 * 执行 Python 脚本
 */
function executePython(
  script: string,
  context: SkillContext,
  startTime: number
): Promise<SkillExecutionResult> {
  return new Promise((resolve) => {
    const child = spawn('python3', ['-c', script], {
      env: { ...process.env, ...context.env },
      cwd: context.cwd || process.cwd(),
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr || undefined,
        executionTime: Date.now() - startTime,
      })
    })

    child.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      })
    })
  })
}

/**
 * 验证技能参数
 */
export function validateSkillArgs(
  skill: LoadedSkill,
  args: Record<string, unknown>
): { valid: boolean; missing?: string[]; errors?: string[] } {
  const errors: string[] = []
  const missing: string[] = []

  if (!skill.metadata.args || skill.metadata.args.length === 0) {
    return { valid: true }
  }

  for (const argDef of skill.metadata.args) {
    // 检查必填参数
    if (argDef.required && !(argDef.name in args)) {
      missing.push(argDef.name)
    }

    // 检查类型（如果有额外验证规则可以在这里添加）
    if (argDef.name in args && args[argDef.name] === undefined) {
      errors.push(`Argument '${argDef.name}' is undefined`)
    }
  }

  if (missing.length > 0) {
    return { valid: false, missing }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true }
}

/**
 * 格式化技能执行结果为可读字符串
 */
export function formatExecutionResult(result: SkillExecutionResult): string {
  const lines: string[] = []

  lines.push(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`)

  if (result.executionTime !== undefined) {
    lines.push(`Execution time: ${result.executionTime}ms`)
  }

  if (result.output) {
    lines.push('\n--- Output ---')
    lines.push(result.output)
  }

  if (result.error) {
    lines.push('\n--- Error ---')
    lines.push(result.error)
  }

  return lines.join('\n')
}
