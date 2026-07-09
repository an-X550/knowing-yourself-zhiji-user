// Shared runtime helpers for Claude workflow scripts.
// Runtime contract mirrors live in .claude/shared/, not in this helper file.

import {
  BANNED_PHRASE_GROUPS,
  REPORT_PATH_TEMPLATES,
} from '../shared/runtime-contracts.js'

export var PERSPECTIVE_REGISTRY = [
  { key: 'chronicle',         name: '实际发生的事', desc: '实际发生了什么？（关键事件、时间线）',             category: 'core',        number: 1 },
  { key: 'coach',             name: '目标与时间',   desc: '目标完成得怎么样？时间都去哪了？',                   category: 'core',        number: 2 },
  { key: 'therapist',         name: '情绪与心理',   desc: '情绪状态如何？有什么心理模式？',                     category: 'core',        number: 3 },
  { key: 'strengths',         name: '优势与成就',   desc: '做对了什么？有哪些被忽略的优势？',                   category: 'extended',    number: 4 },
  { key: 'relationships',     name: '人际与关系',   desc: '和重要的人相处得怎么样？社交活跃度如何？',           category: 'extended',    number: 5 },
  { key: 'values-meaning',    name: '意义与价值',   desc: '过得有意义吗？做的事和价值观一致吗？',               category: 'extended',    number: 6 },
  { key: 'growth-dimensions', name: '成长平衡度',   desc: '六个成长维度是否均衡？哪个维度被忽视了？',           category: 'methodology', number: 7 },
  { key: 'journal-quality',   name: '日志写作力',   desc: '日志写作本身有进步吗？（方法论评分）',               category: 'methodology', number: 8 },
  { key: 'review-coach',      name: '复盘方法论',   desc: '自我复盘的能力有提升吗？（方法论点评）',             category: 'methodology', number: 9 },
]

export var MODES = {
  fast:     { categories: ['core'], timeEstimate: '2-4分钟' },
  standard: { categories: ['core', 'extended'], timeEstimate: '5-8分钟' },
  full:     { categories: ['core', 'extended', 'methodology'], timeEstimate: '10-18分钟' },
}

export function renderPath(template, vars) {
  return template.replace(/\{([^}]+)\}/g, function (_, key) {
    return vars[key] || ''
  })
}

export function resolveReportPath(pathKey, vars) {
  var template = REPORT_PATH_TEMPLATES[pathKey]
  if (!template) {
    throw new Error('Unknown report path key: ' + pathKey)
  }
  return renderPath(template, vars)
}

export function sanitizeProjectSlug(input) {
  var value = (input || 'project-review').toString().trim().toLowerCase()
  value = value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return value || 'project-review'
}

export function resolvePerspectives(mode, perspectiveKeys) {
  if (perspectiveKeys && perspectiveKeys.length > 0) {
    var selected = []
    for (var i = 0; i < perspectiveKeys.length; i++) {
      var found = PERSPECTIVE_REGISTRY.filter(function (p) { return p.key === perspectiveKeys[i] })[0]
      if (found) selected.push(found)
    }
    if (selected.length > 0) return selected
  }

  var modeConfig = MODES[mode] || MODES.standard
  return PERSPECTIVE_REGISTRY.filter(function (p) {
    return modeConfig.categories.indexOf(p.category) !== -1
  })
}

export function corePerspectives() {
  return PERSPECTIVE_REGISTRY.filter(function (p) { return p.category === 'core' })
}

export function estimateTime(perspectives) {
  var count = perspectives.length
  var min = Math.round((count * 0.7 + 1))
  var max = Math.round((count * 1.5 + 3))
  return min + '-' + max + '分钟'
}

export function formatAnalyses(perspectives, analyses) {
  var combined = ''
  for (var i = 0; i < perspectives.length; i++) {
    if (analyses[i]) {
      combined += '\n\n======= ' + perspectives[i].key + ' ANALYSIS =======\n\n'
      combined += analyses[i]
    }
  }
  return combined
}

export function extractChatSummary(result) {
  if (!result || typeof result !== 'string') return ''
  var patterns = [
    /## 聊天摘要\s*\n\s*\n([\s\S]*?)(?=\n---\n\[聊天摘要结束[^\]]*\])/,
    /# 聊天摘要\s*\n\s*\n([\s\S]*?)(?=\n---\n\[聊天摘要结束[^\]]*\])/,
    /## 聊天摘要\s*\n\s*\n([\s\S]*?)(?=\n## )/,
    /# 聊天摘要\s*\n\s*\n([\s\S]*?)(?=\n## )/,
  ]

  for (var i = 0; i < patterns.length; i++) {
    var chatMatch = result.match(patterns[i])
    if (chatMatch) return chatMatch[1].trim()
  }

  return ''
}

export function validateChatSummary(summaryText, options) {
  options = options || {}
  var bannedPhrases = BANNED_PHRASE_GROUPS.common.slice()
  if (options.includeYearlyExtra) {
    bannedPhrases = bannedPhrases.concat(BANNED_PHRASE_GROUPS.yearly_extra)
  }

  var hasBanned = false
  for (var i = 0; i < bannedPhrases.length; i++) {
    if (summaryText.indexOf(bannedPhrases[i]) !== -1) {
      hasBanned = true
      break
    }
  }

  var tooShort = summaryText.length < 50
  var tooVague = (summaryText.match(/具体/g) || []).length === 0 && (summaryText.match(/\d+/g) || []).length === 0
  var ok = !!summaryText && !tooShort && !hasBanned && !tooVague
  var skipReason = tooShort ? '摘要过短(' + summaryText.length + '字)' : hasBanned ? '含模糊词' : '缺具体数据'

  return { ok: ok, skipReason: skipReason }
}

export function buildSynthesisPrompt(config) {
  var prompt = 'Synthesize ' + config.periodLabel + '。\n\n'
  prompt += '请遵守 `.claude/shared/prompt-rules.md` 的输出契约、证据规则和聊天摘要质量门。\n'
  prompt += '报告路径以 `.claude/shared/paths.md` 的 `' + config.pathKey + '` 为准，本次写入：`' + config.reportPath + '`。\n'
  prompt += '报告最前面必须包含“## 聊天摘要”区块（≤' + config.summaryLimit + '字，' + config.summaryShape + '），用于在聊天中即时展示。不要创建任何中间文件。\n'
  if (config.extraInstruction) {
    prompt += '\n' + config.extraInstruction + '\n'
  }
  if (config.combinedAnalyses) {
    prompt += '\n下面是 ' + config.successfulCount + ' 个视角的分析结果。请综合这些分析。\n\n' + config.combinedAnalyses
  }
  return prompt
}
