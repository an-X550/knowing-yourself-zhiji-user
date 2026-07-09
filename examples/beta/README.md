# 内测样例包

这组样例是给 3-5 人内测时快速覆盖主要入口用的，内容全部为虚构材料。

## 适合覆盖哪些入口

- `/weekly-review`
- `/monthly-review`
- `/project-review`
- `/life-design --quick`

## 1. 周复盘 / 月复盘

样例日志文件：

- [`logs/2026-07月日志.md`](logs/2026-07月日志.md)

使用方式：

1. 将这份文件放到项目的 `日志/` 目录下，文件名保持为 `2026-07月日志.md`
2. 运行 `/weekly-review 2026-W27`
3. 运行 `/monthly-review 2026-07`

这份日志里包含连续 7 天材料，足够覆盖周复盘，也能作为月复盘的最小可跑样本。

## 2. 项目复盘

样例项目材料：

- [`project-review-brief.md`](project-review-brief.md)

使用方式：

1. 把材料粘贴到当前对话
2. 运行 `/project-review 用户版内测验收`

## 3. 人生设计

辅助话题材料：

- [`life-design-topic.md`](life-design-topic.md)

推荐方式：

1. 先让周复盘 / 月复盘至少成功一次
2. 再把这份话题说明粘贴到对话里
3. 运行 `/life-design --quick 职业方向`

## 说明

- 如果你只想试最短路径，仍然优先用 [`../demo/sample-journal.md`](../demo/sample-journal.md) 跑 `/review`
- 这组样例是“为了验收能不能跑通”，不是为了评估分析质量上限
