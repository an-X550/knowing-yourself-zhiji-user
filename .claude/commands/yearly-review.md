---
description: 从12份月度报告生成年度成长综合
allowed-tools:
  - Task
  - Glob
  - Read
  - Workflow
---

# 年度复盘命令

通过 yearly-synthesis 处理12份月度报告，生成年度成长综合。

## 输入

年份来自：`$ARGUMENTS`

**默认值**：如果未提供参数，使用上一个完整年份。

**支持的格式**：
- `YYYY`（如 "2026"）
- `去年`

## 执行步骤

### 1. 确定目标年份

解析参数获取 `YYYY` 格式。
如无参数：使用上一个完整年份（当前年份 - 1）。

### 2. 验证月度报告存在

检查月度综合报告。按顺序检查：
1. `.claude/shared/paths.md` 的 `output.monthly_report`
2. `paths.md` 中标记的兼容来源（如存在）

至少需要12份中的6份月度报告才能做有意义的年度回顾。

如果找到少于6份，警告但用已有数据继续。

### 3. 启动工作流

调用 Workflow 工具，`name: "yearly-review"`，传入 `args: { year: "YYYY" }`。

```
Workflow({ name: "yearly-review", args: { year: "YYYY" } })
```

此单一调用替代之前的 Task 代理调用。Workflow 脚本（`.claude/workflows/yearly-review.js`）负责收集月度报告并运行年度综合。

已有的代理文件（`yearly-synthesis`）保持不变——由 Workflow 脚本调用。

### 4. 报告完成

工作流完成后，报告：
```
YYYY年度回顾完成！

完整报告：[实际文件路径]
```

## 错误处理

- 无月度报告："未找到 [年份] 的月度报告，无法生成年度回顾。请先至少完成6个月的 /monthly-review。"
- 综合失败：报告错误
