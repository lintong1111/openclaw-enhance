/**
 * OpenClaw Skill System - 技能加载器
 */

import * as fs from 'fs'
import * as path from 'path'
import type { SkillSource, LoadedSkill, SkillMetadata } from './skill-system'
import { SKILL_SOURCE_PATHS } from './skill-system'
import { parseFrontmatter } from './skill-parser'

// 缓存已加载的技能
const skillCache = new Map<SkillSource, LoadedSkill[]>()
let cacheEnabled = true

/**
 * 启用/禁用缓存
 */
export function setCacheEnabled(enabled: boolean): void {
  cacheEnabled = enabled
  if (!enabled) {
    skillCache.clear()
  }
}

/**
 * 加载指定来源的所有技能
 */
export function loadSkills(source: SkillSource): LoadedSkill[] {
  if (cacheEnabled && skillCache.has(source)) {
    return skillCache.get(source)!
  }

  const skills: LoadedSkill[] = []
  const sourcePath = SKILL_SOURCE_PATHS[source]

  if (!sourcePath) {
    return skills
  }

  // 检查目录是否存在
  if (!fs.existsSync(sourcePath)) {
    return skills
  }

  try {
    const files = walkDir(sourcePath, ['.md'])
    for (const filePath of files) {
      try {
        const skill = loadSkillFromFile(filePath, source)
        if (skill) {
          skills.push(skill)
        }
      } catch (error) {
        console.warn(`Failed to load skill from ${filePath}:`, error)
      }
    }
  } catch (error) {
    console.warn(`Failed to read skills directory ${sourcePath}:`, error)
  }

  if (cacheEnabled) {
    skillCache.set(source, skills)
  }

  return skills
}

/**
 * 从文件加载单个技能
 */
export function loadSkillFromFile(filePath: string, source: SkillSource): LoadedSkill | null {
  const content = fs.readFileSync(filePath, 'utf-8')
  const { metadata, body } = parseFrontmatter(content)

  // 验证必需字段
  if (!metadata.name || !metadata.description) {
    return null
  }

  const skill: LoadedSkill = {
    name: metadata.name,
    description: metadata.description,
    whenToUse: metadata.whenToUse || '',
    content: body.trim(),
    source,
    filePath,
    metadata: metadata as SkillMetadata,
  }

  return skill
}

/**
 * 遍历目录查找匹配的文件
 */
function walkDir(dir: string, extensions: string[]): string[] {
  const results: string[] = []

  if (!fs.existsSync(dir)) {
    return results
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // 递归处理子目录
      results.push(...walkDir(fullPath, extensions))
    } else if (entry.isFile()) {
      // 检查扩展名
      const ext = path.extname(entry.name).toLowerCase()
      if (extensions.includes(ext)) {
        results.push(fullPath)
      }
    }
  }

  return results
}

/**
 * 全局技能注册表
 */
const globalSkillRegistry = new Map<string, LoadedSkill>()

/**
 * 注册技能到全局注册表
 */
export function registerSkill(skill: LoadedSkill): void {
  globalSkillRegistry.set(skill.name, skill)
}

/**
 * 从全局注册表获取技能
 */
export function getSkillFromRegistry(name: string): LoadedSkill | null {
  return globalSkillRegistry.get(name) || null
}

/**
 * 加载所有来源的技能并注册到全局注册表
 */
export function loadAllSkills(): LoadedSkill[] {
  const sources: SkillSource[] = ['userSettings', 'projectSettings', 'managed', 'plugin', 'bundled']
  const allSkills: LoadedSkill[] = []

  for (const source of sources) {
    const skills = loadSkills(source)
    for (const skill of skills) {
      registerSkill(skill)
      allSkills.push(skill)
    }
  }

  return allSkills
}

/**
 * 获取所有已注册的技能
 */
export function getAllRegisteredSkills(): LoadedSkill[] {
  return Array.from(globalSkillRegistry.values())
}

/**
 * 清除缓存
 */
export function clearCache(): void {
  skillCache.clear()
}

/**
 * 清除所有注册的技能
 */
export function clearRegistry(): void {
  globalSkillRegistry.clear()
}
