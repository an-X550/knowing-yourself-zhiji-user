---
type: runtime_contract
purpose: 在成功日反馈后以可丢弃状态投递并抑制闭环缺口提醒
last_updated: 2026-08-01
---

# 闭环缺口提醒投递契约

只有 `review-readiness-checker` 收到显式 `delivery` 输入时使用本契约。普通自然语言和无参数 `/review` 检查保持只读。

## 状态文件

按 `paths.md` 的 `output.readiness_delivery_state` 读写。文件缺失、表格损坏或字段不可解析时，以空状态重建；不得中断已完成的日反馈。

```markdown
---
type: readiness-delivery-state
---

| candidate | signature | notified_on |
|---|---|---|
```

状态最多保留每个 candidate 一条记录。candidate 和 signature 不展示给用户，也不是报告或个人内容。

## 稳定签名

| candidate | signature |
|---|---|
| `daily-feedback` | 最早缺失日反馈的日志日期 |
| `monthly-review` | 目标 `YYYY-MM` |
| `weekly-review` | 目标 `YYYY-Www` |
| `yearly-review` | 目标年份 |
| `current-context` | `current-last-updated:{current.md 的 last_updated}` |
| `journal-coach` | `coach-report:{最近教练报告日期或 none}` |
| `life-design` | `life-design-report:{最近人生设计报告日期或 none}` |

## 投递与清理

1. 没有该 candidate 的状态记录，显示一条 `🔔 提醒：` 并写入当天 `notified_on`。
2. 有同类签名记录且距 notified_on 少于 7 天，输出空字符串，不更新该记录。
3. 签名改变，或同类签名记录距 notified_on 已满 7 天，显示一条提醒并更新记录。
4. 当前检查没有该 candidate 时，删除该候选旧记录；动作完成后自然解除提醒。
5. 每次最多投递一个最高优先级候选；不得生成报告、写入个人内容或建立后台任务。
