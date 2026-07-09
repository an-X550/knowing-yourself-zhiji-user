import {
  buildSynthesisPrompt,
  extractChatSummary,
  resolveReportPath,
  sanitizeProjectSlug,
  validateChatSummary,
} from './shared.js'

export const meta = {
  name: 'project-review',
  description: 'Synthesize project materials into one Chinese project retrospective report',
  phases: [
    { title: 'Gather', detail: 'Resolve project name, mode, and output path' },
    { title: 'Synthesize', detail: 'Generate one six-question project review report' },
  ],
}

var projectName = (args.project || 'project-review').trim()
var mode = args.mode || 'standard'
var today = new Date().toISOString().slice(0, 10)
var projectSlug = sanitizeProjectSlug(projectName)
var reportPath = resolveReportPath('project_report', {
  date: today,
  project: projectSlug,
})

phase('Gather')

log('项目复盘主题：' + projectName)
log('模式：' + mode)
log('输出路径：' + reportPath)

phase('Synthesize')

var result = await agent(
  buildSynthesisPrompt({
    periodLabel: 'project review ' + projectName,
    pathKey: 'output.project_report',
    reportPath: reportPath,
    summaryLimit: mode === 'full' ? 220 : 180,
    summaryShape: '3个关键发现 + 1个后续建议',
    extraInstruction:
      '这是项目复盘，不是周复盘或月复盘。请优先综合当前对话中用户提供的项目背景、优化目标、验收诉求、版本变化、过程记录与相关文件内容。最终只输出一份中文项目复盘报告，固定使用六问一级标题。项目复盘内部重点关注里程碑、验收结果、关键决策、协作流程、机制问题与可复用经验。若证据不足，必须明确写出边界，不要假装完整。' +
      (mode === 'full'
        ? ' full 模式下，可适度补充目标漂移、机制层原因、协作与流程层改进、后续复用策略。'
        : ' standard 模式下，保持聚焦，只保留最关键的问题链与行动建议。'),
  }),
  { label: '项目复盘综合', phase: 'Synthesize', agentType: 'project-synthesis' }
)

var summaryText = extractChatSummary(result)
var summaryGate = validateChatSummary(summaryText)

if (summaryGate.ok) {
  log('📌 项目复盘完成：' + projectName + '\n')
  log(summaryText)
  log('→ 完整报告：' + reportPath)
} else {
  log('项目复盘完成 ' + projectName + ' [' + summaryGate.skipReason + '，摘要跳过]')
  log('→ 完整报告：' + reportPath)
}

return {
  project: projectName,
  mode: mode,
  status: 'complete',
  reportPath: reportPath,
}
