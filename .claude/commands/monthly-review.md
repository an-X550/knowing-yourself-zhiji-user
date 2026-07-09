---
description: 从选定视角并行处理日志，先生成视角证据包，再综合为主题化月度复盘报告。支持 fast(3)/standard(6)/full(9) 三种模式及自定义视角
allowed-tools:
  - Task
  - Glob
  - Read
---

# 月度复盘命令

通过选定视角并行处理日志，先生成视角证据包/综合材料，再由综合引擎收敛为主题化最终报告。支持 fast(3核心视角)/standard(6生活视角,默认)/full(9全视角) 三种模式，也可自定义视角组合。

## 输入

月份标识来自：`$ARGUMENTS`

**默认值**：如果未提供参数，使用上一个完整月份（如当前为2月，则处理1月）。

**支持的格式**：
- `YYYY-MM`（如 "2026-01"）
- 月份名+年份（如 "2026年1月"、"Jan 2026"）
- 仅月份名表示当年（如 "1月"）

## 执行步骤

### 1. 确定目标月份

解析参数获取 `YYYY-MM` 格式。

如无参数：根据当前日期计算上一个完整月份。

### 2. 验证日志存在

先做执行前检查：
1. 本命令属于运行型月复盘，不进入开发治理流程；不要读取 `PROJECT_STATUS.md`、`CHANGELOG.md`、`VERSION`、`README.md`、`AGENTS.md` / `CLAUDE.md` 或 git 状态。
2. 默认把 workflow 传入的视角分析当作主输入，`context.current`、`context.verified_patterns` 与上月月报作为补充材料。
3. 只有视角证据冲突、上月假说需要补证或关键引用缺失时，才回查原始日志。

使用 `.claude/shared/paths.md` 的 `input.monthly_journal_glob_cn` / `input.monthly_journal_glob_iso` 检查目标月份日志文件。

如果未找到日志：报告错误并停止。

### 3. 创建输出根目录

确保 `output.perspective_analysis` 的根目录存在。具体视角子目录由 `monthly-processor` 按本次选中的视角创建，不在命令层硬编码。

### 4. 启动 Workflow

调用 Workflow 工具，`name: "monthly-review"`，传入月份和模式：

```
Workflow({ name: "monthly-review", args: { month: "YYYY-MM", mode: "standard|fast|full" } })
```

Workflow 负责：
- 按模式解析视角列表（fast: 3核心 / standard: 6生活 / full: 9全视角）
- 并行运行视角代理（复用 `monthly-processor`），生成各视角证据包
- 运行 `monthly-synthesis` 综合引擎，优先消费这些证据包与验证沉淀，再按主题归并；原始日志只在关键证据冲突时抽查
- 输出 `paths.md` 的 `output.monthly_report`

**也支持自定义视角**：`args: { month: "YYYY-MM", perspectives: ["therapist", "coach"] }`

### 5. 等待 Workflow 完成

Workflow 会自动报告进度和最终结果。

### 6. 报告完成

综合完成后，报告：

```
[月份 年份]月度复盘完成！

视角证据包已创建：
- output.perspective_analysis（按本次选中的视角生成）

主题化最终报告：output.monthly_report
```

## 错误处理

- 如果目标月份无日志："未找到 [月份] 的日志条目，无法生成复盘。"
- 如果某视角失败：记录失败的视角，继续处理其余视角，在最终输出中警告
- 如果综合失败：报告错误，说明视角证据包仍已创建

## 备注

- 此命令编排已有代理——不直接处理日志
- monthly-processor 代理负责为每个视角生成月度证据包
- monthly-synthesis 代理负责将这些证据包压缩为最终主题报告，并默认避免重复回读整月日志
- 所有视角分析文件均保留供将来参考，不会在命令层被当作最终月报读回
