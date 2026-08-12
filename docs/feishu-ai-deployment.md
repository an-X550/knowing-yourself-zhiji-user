# 飞书每日反馈的 AI 部署指南

> 人类只需知道：把本页最后的代码块交给具备本机文件与命令执行能力的 AI，它可以检查环境、配置用户版并完成脱敏验收。平台登录和权限审批仍必须由用户本人完成（human authorization）；“一键”不代表绕过授权。

## 稳定边界

完整链路是：手机飞书消息 → 本地事件监听 → AI 生成每日反馈 → 本地落盘 → `lark-cli` 创建飞书文档 → 滴答 `create_task` 创建行动 → 原消息回复。

只有“日志正文 → 每日反馈 Markdown”需要 AI。飞书目录、本地文件路径、SHA-256、防重和滴答任务字段必须由确定性程序控制。更换 AI 后端不能扩大本地读取范围或远端写权限。

当前可直接运行的适配器是 Codex CLI，固定模型 `gpt-5.4`。Claude、DeepSeek 或其他 API 需要一个最小命令适配器，保持以下接口：UTF-8 日志从 stdin 输入；知己日反馈契约作为 system/prompt 输入；stdout 只返回非空 Markdown 正文；失败返回非零退出码。API key 只放系统环境变量或平台密钥存储。

飞书使用官方 `lark-cli`，只写用户配置绑定的“知己”根目录。滴答中国区使用官方 `dida365` 连接器，国际区使用 `ticktick`；只允许 `create_task`。完整授权和目录边界见[结果分发设置](result-distribution-setup.md)。

## 交给 AI 的部署指令

```text
你是“知己用户版飞书每日反馈入口”的部署执行者。目标是在当前机器完成单用户闭环：
手机飞书日志 -> AI 日反馈 -> 本地写入 -> 飞书文档 -> 滴答行动 -> 飞书原消息回复。

先定位知己用户版根目录，完整读取 AGENTS.md、README.md、
docs/feishu-ai-deployment.md、docs/local-feishu-daily-feedback-entry.md、
docs/result-distribution-setup.md、.claude/agents/daily-analyzer.md、
.claude/shared/contracts/daily-feedback.md、
.claude/shared/contracts/result-distribution.md 和 .claude/shared/paths.md。

硬边界：
1. 不索取、回显或写入 App Secret、access/refresh token、MCP token、API key。
2. 不扫描电脑；只处理知己用户版内契约允许的文件。原始日志、画像、配置、状态和代码不得上传飞书。
3. 只接受一个 allowed_open_id 的 p2p 文本；只处理“日志：”或“日志:”前缀后的自然语言。
4. 本地 Markdown 是权威结果；新写入并复读成功后才能分发。
5. 飞书只写已绑定“知己”目录；滴答只允许 create_task。不得 list/search/get/update/complete/delete 任务。
6. 不新增多用户、队列、Web 后台、监控平台、重试服务或其他产品功能。
7. 平台登录、应用创建、scope 审批和 OAuth 必须让我在官方页面人工授权；一次只告诉我一个必要操作，不要求我把 secret 发给你。

按顺序执行：
A. 列出操作系统、PowerShell、Node/npm、Git、官方 lark-cli 和所选 AI 后端的真实版本；缺失时使用官方安装方式。
B. 检查飞书企业自建应用的 bot identity、im.message.receive_v1、机器人回复权限和用户可访问的“知己”目录。需要控制台操作时暂停等待人工授权。
C. 检查滴答区域：中国区 dida365，国际区 ticktick。只授权 create_task；首次只定位恰好一个“知己行动”清单并把非敏感 project_id 写入 gitignored 配置。
D. 从两个 example JSON 生成复盘/.local-feishu-daily-feedback-config.json 和复盘/.result-distribution-config.json。只写 schema 已支持的 open_id、可执行路径、folder token、project_id 和开关；不新增字段，不复制任何其他用户的值。
E. 配置分析后端，只替换“日志 -> 每日反馈 Markdown”适配器：
   - Codex：复用现有 PowerShell 工作流，使用 codex exec、gpt-5.4、read-only、ephemeral；预检用 codex login status，不调用模型。
   - Claude：使用官方 Claude API 或 CLI 非交互模式；API key 只放环境变量；stdin 接收日志，stdout 只返回 Markdown。
   - DeepSeek：使用官方 OpenAI-compatible API；API key 只放环境变量；把知己契约作为 system 消息、日志作为 user 消息，剥离 JSON 包装后 stdout 只返回 Markdown。
   - 其他 AI：满足同一 stdin/stdout/exit-code 契约即可，不修改日反馈结构。
   如果当前代码尚不支持所选后端，只实现一个最小命令适配器和对应测试；不要改飞书、滴答或报告契约。
F. 飞书文档继续由官方 lark-cli 参数化导入；滴答继续由只暴露 create_task 的受限连接器创建。分析模型不得自由选择本地文件、目录 token 或任务字段。
G. 运行用户版现有测试、结果分发检查和本地入口 Preflight。先保持真实渠道关闭，用脱敏夹具验证本地生成；再经我确认开启渠道，用一条脱敏日志做端到端验收。
H. 验收必须记录：本地日志和反馈路径、反馈 SHA-256、飞书 document_token 或 URL、滴答唯一 task_id；重放同一 message_id 必须产生 0 个新对象。不能手工分别创建远端对象冒充自动链路。
I. 启动单个常驻监听。Windows 可先保持窗口运行；云服务器只增加最小进程守护和持久目录，不扩展业务功能。
J. 最终只报告：环境状态、仍需人工授权点、分析后端与模型、本地/飞书/滴答结果、防重结果、启动停止命令和未验证事项。

连续失败 3 次即停止，保留脱敏错误证据，不删除防重状态，不重复创建远端对象。
```

部署完成不等于长期可用。先真实使用 14 天；只有手机入口确实经常使用、而电脑必须在线仍持续造成阻碍时，再考虑云服务器。
