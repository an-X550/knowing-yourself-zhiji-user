# 用户版发布前验收清单

> 目标：确保 `zhiji-user` 只包含用户需要的项目功能，不暴露开发治理内容，同时主功能可正常使用。

## 一、分发内容检查

- [ ] 根目录不包含开发治理文件：`AGENTS.md`、`CLAUDE.md`、`CHANGELOG.md`、`PROJECT_STATUS.md`、`VERSION`
- [ ] 不包含个人日志、个人复盘、真实用户画像或其他私有数据
- [ ] 保留运行所需目录：`.claude/`、`docs/`、`examples/`、`perspectives/`
- [ ] 保留首次使用目录：`日志/`、`复盘/`、`关于我/`
- [ ] `关于我/` 中仅为模板文件，不包含真实个人内容

## 二、文档入口检查

- [ ] [README.md](../README.md) 与实际命令行为一致
- [ ] `README.md` 已覆盖用户获取项目、首次使用和手动验收入口
- [ ] 示例日志 [examples/demo/sample-journal.md](../examples/demo/sample-journal.md) 可直接用于首测
- [ ] 文档不再引用缺失文件

## 三、命令级验收

### 1. 日分析

- [ ] 粘贴示例日志 + 输入 `/review` 可进入单日分析
- [ ] 输入 `/daily-review today` 可分析当天日志
- [ ] 会生成 `复盘/每日反馈/YYYY-MM-DD.md`
- [ ] 第二次查看同一天时，可复用已有反馈

### 2. 周复盘

- [ ] 至少准备 3 天日志后，`/weekly-review` 可生成周报
- [ ] 会生成 `复盘/每周复盘/YYYY-Www.md`
- [ ] 不再因缺少 `perspectives/` 失败

### 3. 月复盘

- [ ] 准备目标月份日志后，`/monthly-review` 可生成月报
- [ ] 会生成 `复盘/每月复盘/YYYY-MM.md`
- [ ] `fast / standard / full` 模式说明与行为一致

### 4. 项目复盘

- [ ] `/project-review 项目主题` 可生成项目复盘
- [ ] 会生成 `复盘/项目复盘/YYYY-MM-DD-project-{project}.md`

### 5. 人生设计

- [ ] `/life-design --quick` 可生成轻量校准
- [ ] 返回路径与实际写入路径一致

### 6. 日志教练

- [ ] `/journal-coach` 至少在最近 3 天日志存在时可生成报告
- [ ] 会生成 `复盘/每日反馈/coach-report-YYYY-MM-DD.md`

## 四、非核心入口检查

- [ ] `/interview` 打开后不会因缺文件直接报错
- [ ] 不在 README 首屏强调非核心入口
- [ ] 非核心入口即使保留，也不影响主分析路径

## 五、Hook 与自动入口检查

- [ ] [`.claude/settings.json`](../.claude/settings.json) 的 matcher 与首用示例格式一致
- [ ] [`.codex/hooks.json`](../.codex/hooks.json) 的 matcher 与 `.claude/settings.json` 保持一致，且不会无条件误触发

## 六、发布判定

满足以下条件才建议打包分发：

1. 主功能 5 项全部通过：`/review`、`/daily-review`、`/weekly-review`、`/monthly-review`、`/project-review`
2. 用户目录结构完整：`日志/`、`复盘/`、`关于我/`
3. 无开发治理文件暴露
4. 无真实个人数据残留
5. README 与实际行为一致
