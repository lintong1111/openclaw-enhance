/**
 * OpenClaw Skill System - YAML Frontmatter 解析器
 */

import type { SkillMetadata } from './skill-system'

// Frontmatter 分隔符
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n/

/**
 * 解析 Markdown 文件中的 YAML frontmatter
 */
export function parseFrontmatter(content: string): { metadata: Partial<SkillMetadata>; body: string } {
  const match = content.match(FRONTMATTER_REGEX)

  if (!match) {
    return {
      metadata: {},
      body: content,
    }
  }

  const yamlStr = match[1]
  const body = content.slice(match[0].length)

  try {
    const metadata = parseYaml(yamlStr)
    return { metadata, body }
  } catch (error) {
    throw new Error(`Failed to parse frontmatter: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 简单的 YAML 解析器（处理基本类型）
 */
function parseYaml(yamlStr: string): Partial<SkillMetadata> {
  const result: Partial<SkillMetadata> = {}
  const lines = yamlStr.split('\n')
  let currentKey = ''
  let currentValue: string[] = []

  for (const line of lines) {
    // 空行处理
    if (!line.trim()) {
      continue
    }

    // 检测 key: value 格式
    const keyMatch = line.match(/^(\w+)(\*)?:\s*(.*)$/)
    if (keyMatch) {
      // 保存前一个 key 的值
      if (currentKey) {
        flushValue(result, currentKey, currentValue)
      }

      currentKey = keyMatch[1]
      const value = keyMatch[3]

      if (value && !value.startsWith('-')) {
        // 单行值
        result[currentKey as keyof SkillMetadata] = parseValue(value) as never
        currentKey = ''
      } else if (!value || value.trim() === '') {
        // 多行值开始
        currentValue = []
      } else {
        // 行内值如 "args: []"
        result[currentKey as keyof SkillMetadata] = parseInlineValue(value) as never
        currentKey = ''
      }
    } else if (currentKey && line.match(/^\s+-/)) {
      // 数组项
      currentValue.push(line)
    } else if (currentKey && !line.match(/^\s{2,}/)) {
      // 可能是续行
      if (line.trim()) {
        currentValue.push(line)
      }
    }
  }

  // 处理最后一个 key
  if (currentKey) {
    flushValue(result, currentKey, currentValue)
  }

  return result
}

function flushValue(result: Partial<SkillMetadata>, key: string, values: string[]): void {
  if (values.length === 0) return

  if (key === 'args') {
    result.args = parseArgs(values)
  } else {
    // 尝试解析为数组或字符串
    const joined = values.join(' ').trim()
    if (joined.startsWith('[') && joined.endsWith(']')) {
      try {
        result[key as keyof SkillMetadata] = JSON.parse(joined.replace(/'/g, '"')) as never
      } catch {
        result[key as keyof SkillMetadata] = joined as never
      }
    } else {
      result[key as keyof SkillMetadata] = joined.replace(/['"]/g, '') as never
    }
  }
}

function parseArgs(values: string[]): { name: string; description: string; required?: boolean }[] {
  const args: { name: string; description: string; required?: boolean }[] = []
  let currentArg: Record<string, string> | null = null

  for (const line of values) {
    const trimmed = line.trim()
    if (trimmed.startsWith('-')) {
      if (currentArg) {
        args.push(currentArg as { name: string; description: string; required?: boolean })
      }
      currentArg = {}
    } else if (currentArg) {
      const [k, ...vParts] = trimmed.split(':')
      const v = vParts.join(':').trim()
      if (k === 'name') currentArg.name = v
      else if (k === 'description') currentArg.description = v
      else if (k === 'required') currentArg.required = v === 'true'
    }
  }

  if (currentArg) {
    args.push(currentArg as { name: string; description: string; required?: boolean })
  }

  return args
}

function parseValue(value: string): unknown {
  const trimmed = value.trim()

  // 布尔值
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false

  // null
  if (trimmed === 'null' || trimmed === '~') return null

  // 数字
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed)
  }

  // 引号字符串
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }

  // 普通字符串
  return trimmed
}

function parseInlineValue(value: string): unknown {
  const trimmed = value.trim()

  // 空数组/对象
  if (trimmed === '[]' || trimmed === '{}') {
    return []
  }

  // JSON 格式
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      return JSON.parse(trimmed.replace(/'/g, '"'))
    } catch {
      return trimmed
    }
  }

  return parseValue(trimmed)
}

/**
 * 将元数据转为 YAML 字符串（序列化）
 */
export function serializeMetadata(metadata: SkillMetadata): string {
  const lines: string[] = ['---']

  lines.push(`name: ${metadata.name}`)
  lines.push(`description: ${metadata.description}`)
  lines.push(`whenToUse: ${metadata.whenToUse}`)

  if (metadata.args && metadata.args.length > 0) {
    lines.push('args:')
    for (const arg of metadata.args) {
      lines.push(`  - name: ${arg.name}`)
      lines.push(`    description: ${arg.description}`)
      if (arg.required) {
        lines.push(`    required: ${arg.required}`)
      }
    }
  }

  if (metadata.source) {
    lines.push(`source: ${metadata.source}`)
  }

  if (metadata.shell) {
    lines.push(`shell: ${metadata.shell}`)
  }

  lines.push('---')
  lines.push('')

  return lines.join('\n')
}
