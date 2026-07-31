---
type: shared_runtime_contract
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

## 执行边界

1. Codex 直接执行综合，不调用不存在的 Claude `Workflow` / `Task` 工具。
2. 先消费已有每日反馈、验证沉淀与视角证据包；只有既有定义要求补证、出现冲突或关键引用缺失时，才按需读取原始日志。
3. 没有足够证据时按既有规则标注部分复盘；不得假装已并行运行视角，也不得把推断写成事实。
4. 不新增默认模型调用、默认视角数或第二套产品逻辑；`.claude/` 仍是唯一运行真相。
5. Claude slash command 仅为兼容入口，不是 Codex 运行的前置条件。
