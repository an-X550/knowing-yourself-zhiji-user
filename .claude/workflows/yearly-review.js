import {
  buildSynthesisPrompt,
  extractChatSummary,
  resolveReportPath,
  validateChatSummary,
} from './shared.js'

export const meta = {
  name: 'yearly-review',
  description: 'Synthesize 12 monthly reports into an annual growth review',
  phases: [
    { title: 'Gather', detail: 'Read monthly reports' },
    { title: 'Synthesize', detail: 'Generate annual synthesis' },
  ],
}

var year = args.year
var reportPath = resolveReportPath('yearly_report', { year: year })

phase('Gather')
log('Reading monthly reports for ' + year + '...')

phase('Synthesize')

var result = await agent(
  buildSynthesisPrompt({
    periodLabel: 'yearly ' + year,
    pathKey: 'output.yearly_report',
    reportPath: reportPath,
    summaryLimit: 250,
    summaryShape: '3个关键发现+1个新年建议',
    extraInstruction: '综合全年月度报告，输出年度成长回顾。年度摘要额外遵守 `.claude/shared/banned-phrases.json` 的 `yearly_extra` 禁用词。',
  }),
  { label: 'synthesis', phase: 'Synthesize', agentType: 'yearly-synthesis' }
)

var summaryText = extractChatSummary(result)
var summaryGate = validateChatSummary(summaryText, { includeYearlyExtra: true })

if (summaryGate.ok) {
  log('📊 年度回顾完成：' + year + '\n')
  log(summaryText)
  log('→ 完整报告：' + reportPath)
} else {
  log('年度回顾完成 ' + year + ' [' + summaryGate.skipReason + '，摘要跳过]')
  log('→ 完整报告：' + reportPath)
}

return { year: year, status: 'complete', reportPath: reportPath }
