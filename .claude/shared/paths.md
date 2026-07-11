---
type: shared_config
purpose: 供 agent/workflow/command 统一读取的命名路径契约。所有运行时路径都应先查这里。
last_updated: 2026-07-11
---

# 共享路径约定

> 本文件是项目运行时路径字符串的单一权威来源。任何 agent、command、workflow 需要输入、输出、上下文或报告路径时，先读取本文件并引用这里的命名 key，而不是重复硬编码目录字符串。若 workflow 需要运行时镜像，只能从 `.claude/shared/runtime-contracts.js` 消费，且镜像键名必须以本文件为准。

## 使用方式

1. 先按 key 找路径：运行文档里优先写 `output.daily_feedback` 这类命名 key。
2. 谁写文件，谁确保父目录存在。
3. 命令里的路径示例只用于说明，运行时以这里为准。
4. `deprecated.*` 只用于识别历史材料，不作为新输出位置。

## 输入路径

| Key | 路径 | 说明 |
|-----|------|------|
| `input.journal_dir` | `日志/` | 日志根目录 |
| `input.daily_journal` | `日志/YYYY-MM-DD.md` | 独立日志文件 |
| `input.monthly_journal_glob_cn` | `日志/*YYYY*M月*.md` | 合并月日志中文月份模式 |
| `input.monthly_journal_glob_iso` | `日志/*YYYY-MM*.md` | 合并月日志 ISO 月份模式 |
| `input.daily_feedback` | `复盘/每日反馈/YYYY-MM-DD.md` | 上一条每日反馈，用于昨日闭环 |
| `context.core_profile` | `关于我/core-profile.md` | 核心画像 |
| `context.current` | `关于我/current.md` | 当前状态 |
| `context.verified_patterns` | `关于我/verified-patterns.md` | 已验证 / 已证伪 / 待验证的行为模式 |
| `context.thinking_dir` | `关于我/思考/` | 用户确认后的主题思考根目录 |
| `context.thinking_index` | `关于我/思考/index.md` | 主题、别名、核心问题与更新时间的轻量路由索引 |
| `context.thinking_topic` | `关于我/思考/{topic}.md` | 按用户确认主题动态创建的思考文件，不是预置分类 |
| `standards.analysis` | `docs/analysis-standards.md` | 分析质量标准 |
| `standards.review_methodology` | `docs/methodology-review.md` | 复盘方法论 |
| `perspective.definition` | `perspectives/{视角名}.md` | 视角定义 |
| `analysis.monthly_perspective` | `关于我/Analysis/{视角}/YYYY-MM-{视角}.md` | 月度视角分析中间产物 |
| `analysis.yearly_perspective` | `关于我/Analysis/{视角}/[YEAR]-{视角}.md` | 年度综合回读的视角分析 |

## 输出路径

| Key | 路径 | 创建/写入责任 |
|-----|------|----------------|
| `output.daily_feedback` | `复盘/每日反馈/YYYY-MM-DD.md` | `daily-analyzer` 调用方 |
| `output.coach_report` | `复盘/每日反馈/coach-report-YYYY-MM-DD.md` | `/journal-coach` |
| `output.weekly_report` | `复盘/每周复盘/YYYY-Www.md` | `weekly-synthesis` |
| `output.monthly_report` | `复盘/每月复盘/YYYY-MM.md` | `monthly-synthesis` |
| `output.project_report` | `复盘/项目复盘/YYYY-MM-DD-project-{project}.md` | `project-synthesis` |
| `output.yearly_report` | `复盘/年度回顾/YYYY-annual-review.md` | `yearly-synthesis` |
| `output.life_design_report` | `复盘/人生设计/YYYY-MM-DD-life-design[-{topic}].md` | `life-design-synthesis` |
| `output.perspective_analysis` | `关于我/Analysis/{视角}/YYYY-MM-{视角}.md` | `monthly-processor` |

## 上下文文件

| Key | 路径 | 缺失时处理 |
|-----|------|------------|
| `context.core_profile` | `关于我/core-profile.md` | 标注“画像缺失”，继续使用日志证据 |
| `context.current` | `关于我/current.md` | 标注“当前状态缺失”，不读旧路径 |
| `context.verified_patterns` | `关于我/verified-patterns.md` | 缺失时由调用方按标准模板创建 |
| `context.thinking_index` | `关于我/思考/index.md` | 缺失时不预读主题；首次确认保存时创建目录与空索引 |
| `context.thinking_topic` | `关于我/思考/{topic}.md` | 缺失时只在用户确认新主题摘要后创建 |

## 已废弃路径

| Key | 旧路径 | 状态 |
|-----|--------|------|
| `deprecated.focus_personal` | `关于我/focus-personal.md` | 已并入 coach 视角分析 |
| `deprecated.context_dir` | `07 Context/` | 已迁移至 `关于我/` |
| `deprecated.legacy_journal_dir` | `06 Agenda/Journal/` | 已迁移至 `日志/` |
