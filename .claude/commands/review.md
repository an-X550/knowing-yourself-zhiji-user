---
description: Manual review entry that routes explicit requests or checks what one follow-up action is most valuable.
manual_no_argument_dispatch: review-readiness-checker
manual_readiness_writes: false
manual_readiness_reports: false
allowed-tools:
  - Task
  - Glob
  - Read
  - Write
  - Bash
  - Workflow
---

# Review Command（统一复盘入口）

一句话复盘，你不需要记住日 / 周 / 月 / 项目 / 年 / 人生设计分别用什么命令。说出你想分析的范围即可。

## Input

自然语言，来自：`$ARGUMENTS`

**无参数**：
- 如果当前对话里已经有可分析的日志内容，优先直接进入对应分析
- 只有在当前对话里没有明确日志材料时，才做智能检测并主动提议

## 路由规则

### 1. 解析用户意图

从 `$ARGUMENTS` 中提取关键词，按优先级匹配：

| 输入示例 | 路由目标 |
|---------|---------|
| （无参数） | 先看当前对话是否已有日志；有则直接分析，无则智能检测 |
| `昨天` `今天` `YYYY-MM-DD` | 按 `/daily-review` 同样的闭环规则处理 |
| `上周` `本周` `YYYY-Www` | weekly-review workflow（含日期范围） |
| `上月` `六月` `2026-07` | monthly-review workflow |
| `项目复盘` `版本复盘` `里程碑复盘` `验收复盘` | project-review workflow |
| `人生设计` `职业方向` `长期方向` `奥德赛计划` `人生规划` | life-design-synthesis agent |
| `今年` `去年` `2026` | yearly-review workflow |
| `--deep` `深度` | 追加 full 模式 |
| `--quick` `快速` | 追加 fast 模式 |

**自然语言查询**（无法匹配时）：用户可能在问具体问题，直接读日志做针对性分析。

### 2. 手动复盘前检查（无参数）

调用 `review-readiness-checker` 检测当前日期、已有日志 / 报告和近期方向性信号。只输出优先级最高的一条建议；无建议时不输出内容。不生成报告、不写入文件、不自动执行。

如果当前消息本身已经包含日志内容：

1. 单日日志 → 直接按当天材料走 `/daily-review`
2. 明显是同一周的多日材料 → 优先提议或路由到周复盘
3. 明显是整月汇总 / 多周材料 → 优先提议或路由到月复盘

资格条件与优先级只以 `review-readiness-checker` 为准；本入口不维护第二份检测规则。

### 3. 执行路由

- **daily-review**: 对于 `今天` / `昨天` / `YYYY-MM-DD` 这类单日请求，按 `/daily-review` 的完整闭环执行；若不能直接委托命令，就在当前命令内完成同等步骤：调用 `daily-analyzer`、写入 `output.daily_feedback`、并更新 `context.verified_patterns`
- **weekly-review**: `Workflow({ name: "weekly-review", args: { week: "YYYY-Www" } })`
- **monthly-review**: `Workflow({ name: "monthly-review", args: { month: "YYYY-MM", mode: "standard|fast|full" } })`
- **project-review**: `Workflow({ name: "project-review", args: { project: "项目主题", mode: "standard|full" } })`
- **life-design**: Task 工具，subagent_type: life-design-synthesis
- **yearly-review**: `Workflow({ name: "yearly-review", args: { year: "YYYY" } })`

## Error Handling

| 情况 | 处理 |
|------|------|
| 无日志 | “还没找到日志。直接粘贴日志内容即可开始。” |
| 无法识别 | “试试：今天 / 昨天 / 上周 / 六月 / 项目复盘 / 人生设计 / 2026-06” |
| 报告已存在 | 告知并询问是否覆盖 |

## Notes

- 统一入口，`/daily-review` 等保留为进阶快捷方式
- 当前对话里已经有日志材料时，优先直接分析，不只停留在提议
- 月份默认 standard 模式
- 项目复盘默认 standard，可用 `--full` 提升深度
