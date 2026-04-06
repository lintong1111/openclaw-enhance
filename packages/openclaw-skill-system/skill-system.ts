/**
 * OpenClaw Skill System - 类型定义
 */

// Skill 来源
export type SkillSource =
  | 'userSettings'    // ~/.openclaw/skills/
  | 'projectSettings' // ./.openclaw/skills/
  | 'managed'         // 托管
  | 'plugin'          // 插件
  | 'bundled'         // 内置

// 参数定义
export interface SkillArg {
  name: string
  description: string
  required?: boolean
  source?: 'user' | 'shell' | 'env'
  shell?: string
}

// Skill 元数据（来自 frontmatter）
export interface SkillMetadata {
  name: string
  description: string
  whenToUse: string
  args?: SkillArg[]
  source?: string
  shell?: string
}

// 加载后的完整 Skill
export interface LoadedSkill {
  name: string
  description: string
  whenToUse: string
  content: string
  source: SkillSource
  filePath: string
  metadata: SkillMetadata
}

// Skill 执行结果
export interface SkillExecutionResult {
  success: boolean
  output?: string
  error?: string
  executionTime?: number
}

// Skill 执行上下文
export interface SkillContext {
  args: Record<string, unknown>
  env?: Record<string, string>
  cwd?: string
}

// Skill 来源对应的目录路径
export const SKILL_SOURCE_PATHS: Record<SkillSource, string | null> = {
  userSettings: expandPath('~/.openclaw/skills/'),
  projectSettings: expandPath('./.openclaw/skills/'),
  managed: expandPath('~/.openclaw/managed-skills/'),
  plugin: expandPath('~/.openclaw/plugins/'),
  bundled: expandPath('~/.npm-global/lib/node_modules/openclaw/skills/'),
}

function expandPath(path: string): string {
  if (path.startsWith('~/')) {
    const home = process.env.HOME || ''
    return path.replace('~', home)
  }
  return path
}
