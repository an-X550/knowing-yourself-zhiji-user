---
description: Generate a simplified monthly-style weekly review in Chinese using 3 core life perspectives.
allowed-tools:
  - Task
  - Glob
  - Read
  - Workflow
---

# Weekly Review Command

生成中文周度认知复盘报告。复用月度的复盘六问框架，用3个核心生活视角综合分析一周日志，输出一份简化的周度复盘报告。

周志是小的月志——四周的周志分析天然累积为月志的素材基础。

## Input

Week identifier from: `$ARGUMENTS`

**默认**：不提供参数时使用上周（最后一个完整 ISO 周），直接执行不询问。

**支持的格式**：
- `YYYY-Www`（e.g., "2026-W27" → 自动计算日期范围 6/29-7/5）
- `last week` / `this week`
- `--ask` — 弹出交互确认（不指定时直接执行）

## Execution Steps

### 1. 确定目标周

解析参数得到 `YYYY-Www` 格式和对应的7天日期范围（M月D日-M月D日）。
无参数时计算上一个完整 ISO 周。

### 2. 验证日志存在

先做执行前检查：
1. 本命令属于运行型周复盘，不进入开发治理流程；不要读取 `PROJECT_STATUS.md`、`CHANGELOG.md`、`VERSION`、`README.md`、`AGENTS.md` / `CLAUDE.md` 或 git 状态。
2. 默认读取顺序是：每日反馈 / `context.verified_patterns` / `context.current` / 视角分析 -> 原始日志抽查。
3. 如果已有沉淀物和视角分析足够支撑六问，就不要为了“更稳”而默认扩读原始日志。

扫描7天的日志文件。至少需要3天日志。
按 `.claude/shared/paths.md` 检查：
1. `input.daily_journal`
2. `input.monthly_journal_glob_cn` / `input.monthly_journal_glob_iso`（按日期头定位）

少于3天日志时警告但仍继续。

### 3. 启动 Workflow

调用 Workflow，传递目标周：

```
Workflow({ name: "weekly-review", args: { week: "YYYY-Www" } })
```

Workflow 负责：
- 并行运行3个核心生活视角代理（实际发生的事 + 目标与时间 + 情绪与心理）
- 代理复用 `monthly-processor` 的周度模式，传入周标识（含日期范围），只提取该周证据，不扩展到整月
- 运行 `weekly-synthesis` 综合引擎
- 输出 `paths.md` 的 `output.weekly_report`（标题含日期范围）

### 4. 报告完成

```
周度复盘 [YYYY-Www]（M月D日-M月D日）完成！

视角：实际发生的事、目标与时间、情绪与心理（共3个）
报告：output.weekly_report（复盘六问 + 质量自检）
```

## 报告结构

周度报告使用复盘六问轻量版：

1. `## 一、回顾目标`
2. `## 二、评估结果`
3. `## 三、分析原因（正向）`
4. `## 四、分析原因（负向）`
5. `## 五、重来演练`
6. `## 六、下周规划`

仍需包含 `## 聊天摘要` 与 `## 质量自检`。周报只聚焦 `1-3` 个重点，深度比月报轻，但结构与周/月/项目复盘保持一致。

## Error Handling

- 少于3天日志：警告但继续
- 无日志：`"No journal entries found for [week]. Cannot generate review."`
- 视角失败：标注失败视角，用剩余视角继续
- 综合失败：报告错误
- 少于2个视角成功：终止，报告错误

## Notes

- 周度固定使用3个核心生活视角，无需用户选择模式
- 报告是月志的简化版——同框架、同质量标准、更轻更快；综合阶段默认先消费日反馈、方向锚点和视角证据包，原始日志只在证据冲突时抽查
- 4份周志报告自然累积为月志综合的素材
- 唯一输出：`paths.md` 的 `output.weekly_report`
