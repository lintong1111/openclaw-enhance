/**
 * OpenClaw Skill System - 统一导出
 */

// 类型定义
export type {
  SkillSource,
  SkillArg,
  SkillMetadata,
  LoadedSkill,
  SkillExecutionResult,
  SkillContext,
} from './skill-system'

export {
  SKILL_SOURCE_PATHS,
} from './skill-system'

// 解析器
export {
  parseFrontmatter,
  serializeMetadata,
} from './skill-parser'

// 加载器
export {
  loadSkills,
  loadSkillFromFile,
  registerSkill,
  getSkillFromRegistry,
  loadAllSkills,
  getAllRegisteredSkills,
  clearCache,
  clearRegistry,
  setCacheEnabled,
} from './skill-loader'

// 便捷函数：获取单个技能
import { loadSkills, getSkillFromRegistry, loadAllSkills } from './skill-loader'
import type { SkillSource, LoadedSkill } from './skill-system'

let allLoaded = false

function ensureAllLoaded(): void {
  if (!allLoaded) {
    loadAllSkills()
    allLoaded = true
  }
}

/**
 * 根据名称获取技能（搜索所有来源）
 */
export function getSkill(name: string): LoadedSkill | null {
  ensureAllLoaded()
  return getSkillFromRegistry(name)
}

/**
 * 获取所有技能（可按来源筛选）
 */
export function getSkills(source?: SkillSource): LoadedSkill[] {
  if (source) {
    return loadSkills(source)
  }
  ensureAllLoaded()
  return Array.from(getSkillFromRegistry('')).length > 0
    ? loadAllSkills()
    : []
}

// 执行器
export {
  executeSkill,
  validateSkillArgs,
  formatExecutionResult,
} from './skill-executor'
