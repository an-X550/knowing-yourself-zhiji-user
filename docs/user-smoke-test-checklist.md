# 用户人工烟测清单

> 这份清单给真实用户或内测同学使用。目标不是深度评估分析质量，而是快速确认：项目能不能用、主流程会不会报错、结果会不会落到正确目录。

## 开始前

确认你已经：

1. 在 Claude Code / Codex 中打开了本项目目录
2. 能看到 [README.md](</C:/Users/panda/.claude/skills/知己/zhiji-user/README.md>)
3. 准备好了测试材料

可选测试材料：

- 单日测试：[`examples/demo/sample-journal.md`](</C:/Users/panda/.claude/skills/知己/zhiji-user/examples/demo/sample-journal.md>)
- 周 / 月 / 项目 / 人生设计联测：[`examples/beta/README.md`](</C:/Users/panda/.claude/skills/知己/zhiji-user/examples/beta/README.md>)

## 一、最短可用路径

### 1. `/review`

操作：

1. 打开 [`examples/demo/sample-journal.md`](</C:/Users/panda/.claude/skills/知己/zhiji-user/examples/demo/sample-journal.md>)
2. 复制任意一天内容到对话
3. 输入 `/review`

通过标准：

- 能正常触发分析
- 不直接报缺文件 / 缺路径 / 无权限
- 返回的是日分析，不是跑偏到周报或别的命令

### 2. `/daily-review today`

操作：

1. 准备一篇当天日志，或先通过日志入口存入当天内容
2. 输入 `/daily-review today`

通过标准：

- 能正常生成日反馈
- 会写出 `复盘/每日反馈/YYYY-MM-DD.md`
- 再次查看同一天时，不会明显跑成另一份不一致结果

## 二、周 / 月复盘路径

### 3. `/weekly-review`

建议材料：

- 使用 [`examples/beta/logs/2026-07月日志.md`](</C:/Users/panda/.claude/skills/知己/zhiji-user/examples/beta/logs/2026-07月日志.md>) 放入 `日志/`

操作：

1. 确保至少有 3 天日志
2. 输入 `/weekly-review 2026-W27`

通过标准：

- 不报缺少 `perspectives/`、agent 或 workflow
- 会写出 `复盘/每周复盘/YYYY-Www.md`
- 返回内容像周复盘，不是原始视角材料

### 4. `/monthly-review`

操作：

1. 确保目标月份有日志
2. 输入 `/monthly-review 2026-07`

通过标准：

- 能正常跑完整月复盘
- 会写出 `复盘/每月复盘/YYYY-MM.md`
- 不会只停留在某个视角的中间结果

## 三、项目 / 人生设计路径

### 5. `/project-review`

建议材料：

- [`examples/beta/project-review-brief.md`](</C:/Users/panda/.claude/skills/知己/zhiji-user/examples/beta/project-review-brief.md>)

操作：

1. 把样例项目材料粘贴到对话
2. 输入 `/project-review 用户版内测验收`

通过标准：

- 能正常生成项目复盘
- 会写出 `复盘/项目复盘/YYYY-MM-DD-project-{project}.md`
- 输出结构像项目复盘，不是周报 / 月报改名版

### 6. `/life-design --quick`

建议材料：

- 先至少跑过一次周报或月报
- 再使用 [`examples/beta/life-design-topic.md`](</C:/Users/panda/.claude/skills/知己/zhiji-user/examples/beta/life-design-topic.md>)

操作：

1. 粘贴话题材料
2. 输入 `/life-design --quick 职业方向`

通过标准：

- 能正常返回人生设计结果
- 会写出 `复盘/人生设计/YYYY-MM-DD-life-design*.md`
- 返回路径和实际文件位置一致

## 四、增强功能

### 7. `/journal-coach`

操作：

1. 确保最近至少有 3 天日志
2. 输入 `/journal-coach`

通过标准：

- 能正常生成日志教练报告
- 会写出 `复盘/每日反馈/coach-report-YYYY-MM-DD.md`
- 报告关注的是“日志写作质量”，不是把它误做成普通日分析

## 五、你在过程中重点留意什么

只要碰到下面任意一种情况，都值得记录给维护者：

- 命令无法触发
- 提示缺文件、缺目录、缺权限
- 返回路径和真实写入路径不一致
- 写出的文件位置不对
- 明明是周报 / 项目复盘，却输出成了别的类型
- 需要用户自己猜下一步，而 README 没说明

## 六、最简反馈模板

跑完后，只要把下面几类信息告诉维护者就够了：

- 哪个命令通过了
- 哪个命令失败了
- 报错原文是什么
- 实际生成了哪些文件
- 哪一步最让你犹豫或不知道怎么继续
