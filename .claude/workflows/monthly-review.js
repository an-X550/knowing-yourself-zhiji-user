import {
  buildSynthesisPrompt,
  estimateTime,
  extractChatSummary,
  formatAnalyses,
  resolveReportPath,
  resolvePerspectives,
  validateChatSummary,
} from './shared.js'

export const meta = {
  name: 'monthly-review',
  description: 'Process month of journals through selected perspectives and synthesize into ONE Chinese report',
  phases: [
    { title: 'Select', detail: 'Determine active perspectives' },
    { title: 'Analyze', detail: 'Perspective agents in parallel' },
    { title: 'Synthesize', detail: 'Cross-perspective synthesis' },
  ],
}

var month = args.month
var mode = args.mode || 'standard'
var perspectiveKeys = args.perspectives || []
var reportPath = resolveReportPath('monthly_report', { month: month })

phase('Select')

var activePerspectives = resolvePerspectives(mode, perspectiveKeys)
var timeEstimate = estimateTime(activePerspectives)

log('月度复盘 ' + month + ' — ' + activePerspectives.length + ' 个视角（预计 ' + timeEstimate + '）')
log('已选视角：' + activePerspectives.map(function(p) { return '[' + p.number + '] ' + p.name }).join('、'))

var coreCount = activePerspectives.filter(function(p) { return p.category === 'core' }).length
if (coreCount === 0) {
  log('⚠️ 未选择任何核心视角（实际发生的事/目标与时间/情绪与心理），可能影响报告完整性')
}
if (activePerspectives.length === 1) {
  log('⚠️ 仅选择单一视角，无法交叉验证，报告深度受限')
}

phase('Analyze')

var agentTasks = activePerspectives.map(function(p) {
  return function() {
    return agent('Process ' + month + ' as ' + p.key, {
      label: p.name,
      phase: 'Analyze',
      agentType: 'monthly-processor',
    })
  }
})

var analyses = await parallel(agentTasks)

var successful = analyses.filter(Boolean)
log(successful.length + '/' + activePerspectives.length + ' 个视角分析完成')

if (successful.length < 2) {
  log('ERROR: 完成视角不足2个，无法综合。')
  return { error: 'Insufficient perspectives', count: successful.length }
}

phase('Synthesize')

var synthResult = await agent(
  buildSynthesisPrompt({
    periodLabel: month,
    pathKey: 'output.monthly_report',
    reportPath: reportPath,
    summaryLimit: 200,
    summaryShape: '3个关键发现+1个建议',
    successfulCount: successful.length,
    combinedAnalyses: formatAnalyses(activePerspectives, analyses),
    extraInstruction: '默认先消费下方视角分析、verified-patterns、current 与上月月报，不要重新读取原始日志、方法论文档或质量标准文档。只有视角冲突、上月假说需要补证或关键引用缺失时，才抽查原始日志。按主题综合，不按视角顺序展开。',
  }),
  { label: '综合引擎', phase: 'Synthesize', agentType: 'monthly-synthesis' }
)

var summaryText = extractChatSummary(synthResult)
var summaryGate = validateChatSummary(summaryText)

if (summaryGate.ok) {
  log('📊 月度复盘完成：' + month + '（' + activePerspectives.length + ' 视角，' + mode + ' 模式）\n')
  log(summaryText)
  log('→ 完整报告：' + reportPath)
} else {
  log('月度复盘完成 ' + month + ' — 1 份中文报告（' + activePerspectives.length + ' 视角）[' + summaryGate.skipReason + '，摘要跳过]')
  log('→ 完整报告：' + reportPath)
}

return { month: month, perspectives: successful.length, mode: mode, synthesis: 'complete', reportPath: reportPath }
