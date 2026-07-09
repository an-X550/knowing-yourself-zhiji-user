import {
  buildSynthesisPrompt,
  corePerspectives,
  extractChatSummary,
  formatAnalyses,
  resolveReportPath,
  validateChatSummary,
} from './shared.js'

export const meta = {
  name: 'weekly-review',
  description: 'Process one week of journals through 3 core perspectives and synthesize into ONE Chinese report',
  phases: [
    { title: 'Analyze', detail: '3 core perspective agents in parallel' },
    { title: 'Synthesize', detail: 'Cross-perspective synthesis into simplified 复盘六问 report' },
  ],
}

var week = args.week
var reportPath = resolveReportPath('weekly_report', { week: week })

// 周志 = 小的月志，固定复用月度核心生活视角。
var PERSPECTIVES = corePerspectives()

phase('Analyze')

var agentTasks = PERSPECTIVES.map(function(p) {
  return function() {
    return agent('Process week ' + week + ' as ' + p.key, {
      label: p.name,
      phase: 'Analyze',
      agentType: 'monthly-processor',
    })
  }
})

var analyses = await parallel(agentTasks)

var successful = analyses.filter(Boolean)
log(successful.length + '/' + PERSPECTIVES.length + ' 个视角分析完成（' + week + '）')

if (successful.length < 2) {
  log('ERROR: 完成视角不足2个，无法综合。')
  return { error: 'Insufficient perspectives', count: successful.length }
}

phase('Synthesize')

var synthResult = await agent(
  buildSynthesisPrompt({
    periodLabel: 'week ' + week,
    pathKey: 'output.weekly_report',
    reportPath: reportPath,
    summaryLimit: 150,
    summaryShape: '3个关键发现+1个调整建议',
    successfulCount: successful.length,
    combinedAnalyses: formatAnalyses(PERSPECTIVES, analyses),
    extraInstruction: '周度报告是月度报告的轻量版。默认先消费每日反馈、verified-patterns、current 与下方视角分析；只有引用缺失、证据冲突或关键判断需要补证时，才抽查原始日志。最终只写唯一一份中文周度复盘报告。',
  }),
  { label: '周度综合', phase: 'Synthesize', agentType: 'weekly-synthesis' }
)

var summaryText = extractChatSummary(synthResult)
var summaryGate = validateChatSummary(summaryText)

if (summaryGate.ok) {
  log('📊 周度复盘完成：' + week + '（' + successful.length + ' 视角）\n（日期范围见报告标题）')
  log(summaryText)
  log('→ 完整报告：' + reportPath)
} else {
  log('周度复盘完成 ' + week + ' — 1 份中文报告（' + successful.length + ' 视角，日期范围见报告标题）[' + summaryGate.skipReason + '，摘要跳过]')
  log('→ 完整报告：' + reportPath)
}

return { week: week, perspectives: successful.length, synthesis: 'complete', reportPath: reportPath }
