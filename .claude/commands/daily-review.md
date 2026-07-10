---
description: Analyze today's or yesterday's journal for pattern reflection, blind spot detection, and one actionable next step
allowed-tools:
  - Task
  - Glob
  - Read
  - Bash
  - Write
---

# Daily Review Command (日志反馈)

对单篇日志进行轻量反馈：昨日闭环、一个核心盲点、可选的一句模式连接、一个明天能试的动作。不打分，不展开长报告。

## 输入

日期来自：`$ARGUMENTS`

**默认**：未提供参数时，分析昨天的日志。

**支持格式**：
- `YYYY-MM-DD`（如 `2026-07-05`）
- `today` / `今天` — 分析今天
- `yesterday` / `昨天` — 分析昨天

若参数中包含“重新分析”或“刷新”，视为强制重跑，不走已有反馈复用。

## 执行步骤

### 1. 确定目标日期

解析参数为 `YYYY-MM-DD`。无参数时使用昨天日期。

### 2. 快路径检查

先做执行前检查：
1. 这是运行型日反馈，不是开发治理任务；不要读取 `PROJECT_STATUS.md`、`CHANGELOG.md`、`VERSION`、`README.md`、`AGENTS.md` / `CLAUDE.md` 或 git 状态。
2. 先判断本次属于哪一条分支：`已有反馈直接展示`、`用户要求重跑`、`首次生成反馈`。
3. 只有未命中“已有反馈直接展示”时，才继续读取目标日志、上一条反馈与 `verified-patterns.md`。

读取 `.claude/shared/paths.md`，定位 `output.daily_feedback` 对应日期的反馈文件。

如果该文件已存在，且用户没有明确要求“重新分析 / 刷新”：

1. 直接读取并展示已有反馈
2. 不重跑 `daily-analyzer`
3. 不重复写回 `verified-patterns.md`

这样单日重复查看反馈时，只走“读取已有结果”的最短闭环。

### 3. 确认日志存在

若未命中快路径，再按 `paths.md` 的日志路径约定查找目标日志：
- 独立日记文件
- 包含目标日期标题的合并月日志

找不到日志时，输出错误并停止，不生成反馈。

### 4. 启动反馈

调用前读取 `.claude/shared/contracts/journal-input.md`；D 级输入只返回一个补证问题，不保存正式反馈，也不写回 `verified-patterns.md`。

使用 Task 工具调用 `subagent_type: daily-analyzer`：
```
"Analyze YYYY-MM-DD"
```


返回内容必须符合 `.claude/shared/contracts/daily-feedback.md`：可选昨日闭环 + 一个核心盲点 + 可选的一句模式连接 + 一个原子行动和预测 + `💊` 追踪行。不得包含 D0-D6 自检文本。

### 5. 保存、沉淀并展示反馈

1. **写入文件**：保存到 `paths.md` 的 `output.daily_feedback`
   - 先确保 `output.daily_feedback` 的父目录存在
   - 用 Write 写入文件（内容原样保存，不添加额外说明或自检行）
2. **更新验证沉淀**：读取 `paths.md` 的 `context.verified_patterns`，按 `.claude/shared/contracts/evidence-and-verification.md` 写回
   - 若文件不存在，按 `关于我/verified-patterns.md` 的标准三段表格模板创建。
   - 若本次反馈包含 `⏮️` 昨日闭环判断，把上一条反馈的 `💊 新认知` / `⚡ 明天试试` 与本次判断写入模式库。
   - `✅ 做到了`：第一次记“部分支持”；重复成立记“多次支持”；达到契约阈值后才移入“已确认的模式”。
   - `❌ 没做`：具体干预记“本次未奏效”；同类行动连续 3 次没做时降低门槛或停止重复建议。
   - `⚠️ 证据不足`：保留为“证据不足”，不升级、不证伪。
   - 明确反例先记“出现反例”，只有满足证伪条件时才移入“已证伪的假说”。
3. **展示给用户**：将同一份反馈文本展示在对话中，并在末尾用一句话说明是否更新了 `verified-patterns.md`

这样下一次日反馈可以读取上一条 `⚡ 明天试试` 的行动和预测，形成昨日闭环。

整个流程默认只走日反馈快路径：`paths.md`、日反馈契约、验证契约、目标日志、上一条反馈与 `verified-patterns.md`。不额外读取版本、CHANGELOG、PROJECT_STATUS、README 或 git 状态。


## 错误处理

- 无日志：`没有找到 [date] 的日志。先写/导入这天的日志，再运行 /daily-review。`
- 分析失败：用中文说明失败原因，不生成空反馈文件。
