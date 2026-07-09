// Runtime mirrors sourced from .claude/shared/*. Keep these in sync with the
// human-readable contracts rather than redefining them inside workflows.

export var REPORT_PATH_TEMPLATES = {
  weekly_report: '复盘/每周复盘/{week}.md',
  monthly_report: '复盘/每月复盘/{month}.md',
  project_report: '复盘/项目复盘/{date}-project-{project}.md',
  yearly_report: '复盘/年度回顾/{year}-annual-review.md',
}

export var BANNED_PHRASE_GROUPS = {
  common: [
    '有波动',
    '总体还行',
    '有好有坏',
    '表现不错',
    '还可以',
    '情绪稳定',
    '整体良好',
    '继续努力',
    '保持下去',
    '有待提高',
    '需要改进',
    '要加强',
    '多注意',
    '总体不错',
    '还可以吧',
    '还行吧',
  ],
  yearly_extra: [
    '这一年有成长',
    '进步很大',
    '收获很多',
  ],
}
