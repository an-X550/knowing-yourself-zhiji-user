---
type: shared_runtime_contract
manual_readiness_route: ".claude/commands/review.md -> .claude/agents/review-readiness-checker.md"
manual_readiness_max_recommendations: 1
manual_readiness_writes: false
manual_readiness_reports: false
purpose: 让 Codex 通过自然语言复用既有周报、月报和项目复盘综合规则。
last_updated: 2026-07-31
---

# Codex 自然语言复盘路由

当 Codex 收到下列意图时，先读取 `.claude/shared/paths.md`，再按对应顺序读取既有定义；所有报告写入 `paths.md` 中相应 output key 的权威路径。

## 周报

| 用户意图 | 读取顺序 | 输出 key 与路径 |
|---|---|---|
| `生成 2026-W28 周报` / `本周复盘` | `.claude/commands/weekly-review.md` → `.claude/agents/weekly-synthesis.md` → `.claude/shared/contracts/review-synthesis.md` → `.claude/shared/contracts/evidence-and-verification.md` | `output.weekly_report`：`复盘/每周复盘/YYYY-Www.md` |

解析用户指定的 ISO 周；未指定时只追问一个会改变报告对象的问题。保留周报的用户回应区、复盘六问、硬质量门与质量自检异常披露。

## 月报

| 用户意图 | 读取顺序 | 输出 key 与路径 |
|---|---|---|
| `生成 2026 年 6 月月报` / `六月复盘` | `.claude/commands/monthly-review.md` → `.claude/agents/monthly-synthesis.md` → `.claude/shared/contracts/review-synthesis.md` → `.claude/shared/contracts/evidence-and-verification.md` | `output.monthly_report`：`复盘/每月复盘/YYYY-MM.md` |

解析用户指定的月份；未指定时只追问一个会改变报告对象的问题。保留主题归并、验证沉淀、复盘六问、硬质量门与质量自检异常披露。

## 项目复盘

| 用户意图 | 读取顺序 | 输出 key 与路径 |
|---|---|---|
| `对 X 做项目复盘` / `X 优化验收` | `.claude/commands/project-review.md` → `.claude/agents/project-synthesis.md` → `.claude/shared/contracts/review-synthesis.md` → `.claude/shared/contracts/evidence-and-verification.md` | `output.project_report`：`复盘/项目复盘/YYYY-MM-DD-project-{project}.md` |

解析用户明确的项目主题、材料范围与验收口径；缺少其中会改变报告对象的信息时只追问一个问题。其余材料不足时按既有规则生成部分复盘，并显式标注证据边界。

## 手动复盘前检查

当用户不是要求生成某一份明确报告，而是在询问当前记录、验证沉淀或复盘是否有该补齐的下一步时，读取 `.claude/commands/review.md`，再调用 `.claude/agents/review-readiness-checker.md`。

这不是固定口令。`最近有什么该补？`、`我有遗漏吗？`、`是不是该复盘了？`、`我的记录需要整理吗？`只是非穷尽示例；同类意图都进入同一检查。无参数 `/review` 也是该检查的备用入口。

明确指定日期、周期、项目或人生设计的请求，直接按本契约已有对应路由执行，不先做时机检查。普通闲聊、泛泛建议或单次情绪表达不触发该检查。

检查器只输出优先级最高的一条建议；若没有建议则输出空字符串。不生成报告、不写入文件、不代替用户执行建议，也不创建后台定时或提醒任务。

## 新报告写入后的结果分发

Codex 直接路由不依赖 Claude `Task` / `Workflow`。本次请求明确包含“仅本地”时，报告完成本地写入和复读后不调用结果分发；否则，周报、月报或项目复盘综合完成后，只有本轮已向权威 output key **新写入**报告，并从解析出的实际路径**重新读取**到非空、结构合格的内容，才读取 `.claude/shared/contracts/result-distribution.md` 并执行对应 handoff：

- `distribute output.weekly_report <resolved-local-path>`
- `distribute output.monthly_report <resolved-local-path>`
- `distribute output.project_report <resolved-local-path>`

缓存命中、只读展示、源文件缺失、分析失败或写入/复读校验失败都不调用结果分发。外部失败不改变本地报告成功；分发摘要只追加到聊天，不写入报告正文。若两个渠道均返回 `skipped_not_configured`，不追加摘要，保持原有聊天输出不变。第三方结果不得放回综合提示词或触发报告改写。

周报和月报的 Codex 直接路由与命令入口使用同一 TickTick 确认门：报告写入后只展示 `SMART 标题｜绝对截止日期或时间`，允许自然语言修改，修改后重显最终整组，只有用户明确确认后创建。生成请求中预先说“同步到滴答”只表示意图，不算确认最终整组；未确认不创建、不排队、不催办。本次请求含“仅本地”时不展示候选。项目复盘不产生滴答候选，但其本地结果和飞书分发保持不变。

## 执行边界

1. Codex 直接执行综合，不调用不存在的 Claude `Workflow` / `Task` 工具。
2. 先消费已有每日反馈、验证沉淀与视角证据包；只有既有定义要求补证、出现冲突或关键引用缺失时，才按需读取原始日志。
3. 没有足够证据时按既有规则标注部分复盘；不得假装已并行运行视角，也不得把推断写成事实。
4. 不新增默认模型调用、默认视角数或第二套产品逻辑；`.claude/` 仍是唯一运行真相。
5. Claude slash command 仅为兼容入口，不是 Codex 运行的前置条件。
