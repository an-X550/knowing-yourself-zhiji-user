# 本地飞书每日反馈入口

这是可选的单用户手机入口：电脑在线时，在手机飞书私聊自己的机器人发送 `日志：<当天日志原文>`，本机复用知己的日反馈与结果分发，把完整反馈回复到原消息。它不是云服务，不支持离线队列、多人、群聊、附件或周/月复盘入口。

## 使用条件

- Windows PowerShell 5.1 或经验证的兼容环境、Node.js/npm、官方 `lark-cli`。
- 已登录的 Codex CLI；当前适配器固定使用 `gpt-5.4`、`read-only`、`ephemeral`。
- 电脑联网、不休眠，AI 服务在当前网络中可访问；无需保持 Codex 桌面窗口打开。
- 飞书企业自建应用已启用机器人、`im.message.receive_v1` 私聊消息事件和回复消息权限。
- `复盘/.result-distribution-config.json` 已按[结果分发设置](result-distribution-setup.md)绑定本人的飞书目录和滴答“知己行动”清单。

## 配置

安装并验证官方工具：

```powershell
npm install -g @larksuite/cli
lark-cli --version
lark-cli auth status --json --verify
codex --version
codex login status
```

从 `.claude/shared/local-feishu-daily-feedback-config.example.json` 复制一份到 `复盘/.local-feishu-daily-feedback-config.json`，只填写本人的 `allowed_open_id`、`lark_cli_path` 和 `codex_path`。该文件受 gitignore 保护；不得写入 App Secret、token 或 API key。

运行预检：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/workflows/local-feishu-daily-feedback.ps1 -Mode Preflight
```

看到 `lark=ready codex=ready config=ready` 后启动监听：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/workflows/local-feishu-daily-feedback.ps1 -Mode Run
```

预检只检查版本、飞书身份和 Codex 登录状态，不调用模型。监听窗口需持续运行；关闭、关机、休眠或断网后不可用。

## 使用与验收

手机私聊机器人发送 `日志：` 或 `日志:`，前缀后的内容可以换行、套模板或直接写自然语言。至少提供一项具体事实，最好再写状态、想法或下一步意图。

第一次只使用脱敏日志，核对：

1. 收到“正在生成”回复，随后收到完整每日反馈。
2. 本地新增且只有一个对应日期的日志和每日反馈。
3. 飞书只在配置的“知己/复盘/每日反馈”目录创建一个文档。
4. 滴答只在“知己行动”创建最多一个合格行动。
5. 重放同一 `message_id` 时不重新分析、不新增本地报告或远端对象。

同一日期已经存在反馈时入口会停止，避免把旧报告归给新消息。通常需等待 2–5 分钟，实际速度取决于所选 AI 和网络。

如需改用 Claude、DeepSeek，或让 AI 完成整套部署，读取[飞书 AI 部署指南](feishu-ai-deployment.md)。
