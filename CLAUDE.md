# 知己运行入口

## 最小上下文

按任务读取 `.claude/shared/paths.md` 和 `.claude/shared/prompt-rules.md`，不要默认读取全部日志、报告或主题文件。

## 主题思考

普通提问涉及用户既有观点、长期困惑或价值判断时，先读取 `.claude/shared/contracts/topic-thinking.md`，按契约检查 `context.thinking_index`；没有明显匹配则不读取详细主题。用户主动探讨形成可沉淀认识时，必须先展示归纳并获得确认，不能从日志自动摘录。

## 输出边界

用户可见输出使用简体中文。区分事实、推断和建议；证据不足时明确说明，不补全故事。

## 第一性原理复核

用户明确要求“依据第一性原理分析”、复核或压缩既有结论时，读取 `.claude/shared/contracts/first-principles-analysis.md`。复核不扩读全部历史材料，仍遵守隐私、证据和确认写入边界。
