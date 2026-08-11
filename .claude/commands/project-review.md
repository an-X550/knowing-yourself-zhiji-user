---
description: 生成中文项目复盘报告。适合项目优化验收、里程碑总结、版本回顾、阶段性交付复盘，输出遵守统一的复盘六问一级标题。
allowed-tools:
  - Workflow
  - Read
  - Glob
---

# Project Review Command

生成中文项目复盘报告。项目复盘与周复盘、月复盘统一遵守“六问一级标题 + 内层综合分析”协议，但内部更强调目标、里程碑、决策、协作、流程与可复用经验。

## Input

项目名称或本次复盘主题来自：`$ARGUMENTS`

推荐输入示例：

- `项目优化验收`
- `6月月志与7月周志优化复盘`
- `v1.3 版本交付复盘`
- `项目优化验收 --full`

**默认行为**：

- 如果只给主题，直接以该主题生成项目复盘
- 如果不写主题，则使用 `project-review`
- 如果参数中包含 `--full`，则按更完整的项目复盘深度执行

## Execution Steps

### 1. 解析项目主题

从 `$ARGUMENTS` 中提取本次项目名或复盘主题。

如果包含 `--full`，则传递 `mode: "full"`；
否则默认 `mode: "standard"`。

### 2. 调用 Workflow

执行：

```text
Workflow({ name: "project-review", args: { project: "项目主题", mode: "standard|full" } })
```

### 3. Workflow 负责

- 计算项目复盘输出路径
- 调用 `project-synthesis` 生成最终报告
- 将最终报告写入 `paths.md` 中的 `output.project_report`
- 聊天中只展示摘要，不重复粘贴整份报告

### 3.1 成功写入后的结果分发

只消费 workflow 返回的 distribution handoff：从 `reportPath` 重新读取本次新写入的 `output.project_report`，确认文件存在、非空且结构合格，再读取 `.claude/shared/contracts/result-distribution.md` 并执行 `distribute output.project_report <resolved-local-path>`。handoff 只消费一次，不得二次分发。分发摘要只追加到聊天，不写入报告正文；若两渠道均为 `skipped_not_configured`，不追加摘要，保持原有聊天输出不变。workflow/综合失败、缺少报告或复读失败时不分发。

这里的“本次新写入”必须由当前写入步骤明确返回成功并与 resolved-local-path 一致；不能只凭文件存在或非空证明本轮新写入，随后还必须重新读取并通过结构校验。

## 报告结构

项目复盘固定使用以下六个一级标题：

1. `## 一、回顾目标`
2. `## 二、评估结果`
3. `## 三、分析原因（正向）`
4. `## 四、分析原因（负向）`
5. `## 五、重来演练`
6. `## 六、后续规划`

项目复盘的内层重点包括：

- 目标与里程碑是否定义清楚
- 实际交付与预期偏差
- 成功机制与失败机制
- 决策、协作、流程、节奏、验收方式
- 哪些经验可复用到下次项目

## Error Handling

- 如果项目材料不足：允许生成“部分复盘”，但必须显式标注证据边界
- 如果主题缺失：使用 `project-review`
- 如果 workflow 失败：报告错误并说明未生成最终复盘文件

## Notes

- `/project-review` 是项目复盘专用入口
- `/review` 也会在识别到“项目复盘 / 版本复盘 / 里程碑复盘 / 验收复盘”等意图时路由到这里
- 本轮项目复盘为“单综合引擎”模式，后续如新增项目视角，也只在六问内层扩展
