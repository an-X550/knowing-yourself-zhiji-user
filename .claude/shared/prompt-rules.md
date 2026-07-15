---
created: 2026-07-07
last_updated: 2026-07-11
purpose: Shared prompt constraints for runtime agents
---

# 共享提示词规则

> 本文件只承载跨 agent 反复出现的硬约束。具体任务步骤、输出模板和职责边界仍由各 agent 自己定义。

## 一、共享文件读取顺序

1. 需要路径时，先读 `.claude/shared/paths.md`，并引用其中的命名 key。
2. 需要跨 agent 全局行为约束时，读本文件；不要把本文件整段复制到 agent。
3. 需要任务型输出契约时，按「任务契约索引」读取 `.claude/shared/contracts/` 下的对应短契约。
4. 需要聊天摘要禁用词时，读 `.claude/shared/banned-phrases.json`；workflow 运行时镜像只允许放在 `.claude/shared/runtime-contracts.js`；人类说明以 `docs/analysis-standards.md` 为准。
5. 具体任务步骤、参数解析、错误处理、输出模板仍由各 agent/command 自己维护。

## 二、路径规则

1. 运行时先读取 `.claude/shared/paths.md`，所有输入、输出、上下文和报告目录都以该文件为准。
2. agent/command 文档中优先引用 `paths.md` 的命名 key（如 `output.daily_feedback`），用户可见提示中才展开具体路径。
3. 不在 agent 中硬编码中文目录或历史路径；如需兼容旧路径，只引用 `paths.md` 的“已废弃路径”说明。
4. 写文件前确认目标目录存在；只创建当前 agent 明确负责的文件。

## 三、Hook 与入口规则

1. `.claude/settings.json` 只做用户运行入口路由：日志关键词调用 `skill log`。
2. 日志识别语义由 `.claude/skills/log.md` 和 `.claude/shared/contracts/daily-feedback.md` 维护；不要在 `settings.json` 里扩展日志分析流程。
3. `UserPromptSubmit.matcher` 的高召回运行时触发词只保留给日志入口：`幸福日志`、`开心的事情`、`充实的事情`、`待改进`、`感谢的人`、`思考...改进`、`todolist`。新增日志模板字段时，同步更新 `log.md` 的日期/字段识别说明。
4. 命令入口（`/daily-review`、`/weekly-review`、`/monthly-review` 等）只负责参数解析和编排，分析格式由对应 agent 与任务契约决定。

## 四、任务契约索引

| 场景 | 必读契约 |
|------|----------|
| 日志粘贴 / 日反馈 | `.claude/shared/contracts/journal-input.md` + `.claude/shared/contracts/daily-feedback.md` + `.claude/shared/contracts/evidence-and-verification.md` |
| 周/月/项目复盘综合 | `.claude/shared/contracts/review-synthesis.md` + `.claude/shared/contracts/evidence-and-verification.md` |
| 证据、验证沉淀、周/月消费 | `.claude/shared/contracts/evidence-and-verification.md` |
| 主动思考探讨 / 确认沉淀 / 相关问题召回 | `.claude/shared/contracts/topic-thinking.md` |
| 显式第一性原理复核 / 压缩 / 质疑既有分析 | `.claude/shared/contracts/first-principles-analysis.md` |

任务契约只承载运行时必需的输出和质量规则；agent 仍保留自己的输入、执行步骤、错误处理和最终输出责任。

## 五、输出契约

1. 明确区分“返回文本”和“写文件”：agent 只做自己 frontmatter/正文中声明的输出动作。
2. 不额外创建中间文件，不把完整报告回读给主代理，除非该 agent 的输出契约明确要求。
3. 用户可见内容使用简体中文；配置字段、文件名、内部 key 保持英文。

## 六、复盘快路径

1. `/daily-review`、`/weekly-review`、`/monthly-review`、`/project-review`、`/yearly-review`、`/life-design` 与 `log` skill 默认走“运行快路径”。
2. 运行快路径只读取完成当前任务所需的最小充分材料：路径约定、对应任务契约、当前任务输入、必要上下文和已生成的沉淀物 / 证据包。
3. 运行快路径默认不读取开发治理上下文：`PROJECT_STATUS.md`、`CHANGELOG.md`、`VERSION`、`README.md`、`AGENTS.md` / `CLAUDE.md`、git 状态与提交流程。
4. 对复盘综合任务，读取顺序默认是：沉淀物 -> 证据包 -> 原始日志抽查；只有引用缺失、证据冲突或关键判断需要补证时，才回查原始日志。
5. 快路径任务开始前必须先做执行前检查：确认当前任务属于“运行分析 / 复盘”；确认本次允许读取的最小材料集合；确认是否存在“已有结果优先展示”的复用分支。
6. 若执行过程中发现自己开始读取开发治理文件、整批原始日志或方法论文档，但又不满足触发条件，必须立即停止扩读，回退到最小材料集合，继续按快路径完成任务。
7. 验收说明只用于检查“本次是否按快路径执行到位”，不是新的默认输入源；执行时仍以前述读取范围、复用分支和条件触发规则为准。

## 七、质量门槛

1. 日志输入先遵守 `.claude/shared/contracts/journal-input.md` 的证据卡与 A-D 降级规则；日反馈再遵守 `.claude/shared/contracts/daily-feedback.md` 的 D0-D6 轻量质量门。
2. 周/月/项目复盘综合遵守 `.claude/shared/contracts/review-synthesis.md` 的六问、方向锚点和主题综合契约。
3. 证据与验证沉淀遵守 `.claude/shared/contracts/evidence-and-verification.md`；没有证据时标注“证据不足”，不要补全故事。
4. 月度、周度、年度摘要仍遵守 `docs/analysis-standards.md` 的聊天摘要质量门和禁用模糊语。

## 八、禁用词同步规则

1. 人类可读权威说明：`docs/analysis-standards.md` 的「聊天摘要质量门」。
2. 机器可读镜像：`.claude/shared/banned-phrases.json`，保留 `common` 与 `yearly_extra` 两个数组供提交前验证和外部工具读取。
3. workflow 运行时统一从 `.claude/shared/runtime-contracts.js` 的 `BANNED_PHRASE_GROUPS` 读取禁用词；修改禁用词时必须同步 JSON 镜像与 runtime mirror。
4. agent 不要在自身提示词里另写一份禁用词列表；只引用质量门或 JSON 镜像。

## 九、减法边界

1. 优化提示词时不得改变命令入口、参数格式、输出路径、输出文件名、报告章节结构或 workflow 编排。
2. 可以删除重复解释、历史背景、旧路径叙述和跨 agent 复制的规则。
3. 保留每个 agent 独有的职责、输入格式、处理步骤、错误处理和最终输出契约。
4. 显式第一性原理复核可以改变分析深度与措辞，但不得改变命令接口、路径、稳定章节或 workflow 编排。

## 十、主题思考入口

1. 用户主动探讨长期问题并形成可沉淀认识时，读取主题思考契约；未经确认不写入。
2. 普通提问涉及用户既有观点、长期困惑或价值判断时，先检查 `context.thinking_index`；没有明显匹配则不读取详细主题。
3. 不从日志自动摘录，不使用关键词 hook 覆盖任意主题，不预读全部主题文件。
