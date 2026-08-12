# 知己运行入口

## 最小上下文

按任务读取 `.claude/shared/paths.md` 和 `.claude/shared/prompt-rules.md`，不要默认读取全部日志、报告或主题文件。

## 主题思考

普通提问涉及用户既有观点、长期困惑或价值判断时，先读取 `.claude/shared/contracts/topic-thinking.md`，按契约检查 `context.thinking_index`；没有明显匹配则不读取详细主题。用户主动探讨形成可沉淀认识时，必须先展示归纳并获得确认，不能从日志自动摘录。

## 输出边界

用户可见输出使用简体中文。区分事实、推断和建议；证据不足时明确说明，不补全故事。

## 第一性原理复核

用户明确要求“依据第一性原理分析”、复核或压缩既有结论时，读取 `.claude/shared/contracts/first-principles-analysis.md`。复核不扩读全部历史材料，仍遵守隐私、证据和确认写入边界。

## Codex 自然语言复盘入口

当用户以自然语言请求周报、月报或项目复盘时，读取并执行 `.claude/shared/contracts/codex-natural-language-routing.md`。当用户以自然语言询问下一步、遗漏、该更新什么或是否该复盘时，也读取该契约并执行闭环缺口检查。前者的明确范围请求直达既有分析；后者只返回一条手动建议。`.claude/` 仍是唯一运行真相；Codex 不以 Claude slash command、`Workflow` 或 `Task` 为运行前置条件。

## 定时提醒路由

用户要求一次性或周期性的纯提醒时，默认使用滴答清单原生时间、提醒和重复能力；只有用户明确指定 Codex 定时任务时才例外。纯提醒只通知用户手动开始，不读取项目文件、不生成复盘、不调用分发；需要到点自动执行工作的请求不属于纯提醒，须单独评估。
