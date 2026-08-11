# 结果分发设置（离线验收后使用）

> 当前实现默认关闭。本页描述未来离线测试全部通过后，如何通过官方工具完成一次性设置；本轮不要运行安装、登录、建文件夹、导入或创建任务命令。

结果分发只在新报告成功写入并重新读取校验后运行：飞书保存完整报告副本，滴答/TickTick 只创建报告中已有的合格行动。本地文件始终是权威结果，任一外部失败都不回滚本地报告。

## 用户检查清单

- [ ] 已确认本地报告流程在未配置分发时正常运行。
- [ ] 已决定使用滴答清单中国区（`dida365`）还是 TickTick 国际区（`ticktick`）。
- [ ] 有权在飞书租户中配置企业自建应用，并能查看目标文件夹。
- [ ] 只准备脱敏、一次性的 Markdown 与测试任务，不使用真实日志或复盘正文。
- [ ] 接受飞书与滴答分别成功或失败，不要求双向同步、任务回读或自动复盘。
- [ ] 在两个 disposable 测试都通过前，保持所有 result type 开关为 false。

## 隐私与凭证边界

不要把 App Secret、access token 或 MCP token 粘贴到聊天、命令参数或项目文件。也不要把 refresh token、tenant token、device code 或授权响应写进报告、配置或状态。

飞书凭证只交给官方 CLI 的凭证存储；滴答/TickTick 只在账号区域对应的官方 MCP 的官方授权页面完成授权。项目配置只保存非敏感的目标文件夹标识、账号区域、清单名和启用开关。原始日志、画像、验证库、中间分析、配置和状态都不分发。

## 飞书：官方 CLI 设置门

### 状态

| 状态 | 含义 | 下一步 |
|---|---|---|
| `cli_missing` | 找不到 `lark-cli` | 未来按官方方式安装；本轮保持关闭 |
| `app_not_configured` | CLI 可用，但没有可用的企业自建应用 application identity | 在官方 CLI 交互配置中完成应用设置 |
| `bot_ready` | application identity 可用，`--as bot` 预检通过 | 验证专用文件夹与当前用户权限 |
| `folder_inaccessible` | 应用或当前用户不能访问目标文件夹 | 只修正文件夹权限，不启用真实报告 |
| `ready` | CLI、应用身份、目标文件夹与授权结果均通过 | 仍先做脱敏 disposable 测试 |

### 未来安装与配置顺序

在独立终端中按官方 CLI 指引运行：

```powershell
npx @larksuite/cli@latest install
lark-cli config init --new
lark-cli auth status
```

`config init --new` 是官方交互入口。应用凭证只在该交互中交给 CLI，不要改写成带 secret 的命令，也不要把交互内容复制进聊天。日常导入使用企业自建应用的 application identity 和 `--as bot`；这里的 bot 是开放平台身份，不是飞书聊天机器人。

如果只为识别当前用户并把专用文件夹授予该用户，可在设置阶段将用户授权限定为 Docs 与 Drive：

```powershell
lark-cli auth login --domain docs --domain drive
lark-cli drive +create-folder --name "知己" --as bot
```

只有返回 `permission_grant.status = granted`，才进入目标文件夹测试。不要擅自转移 owner。若 bot 缺少应用 scope，不要用 `auth login` 掩盖；打开 CLI 返回的 `console_url`，只在飞书官方控制台启用明确缺失的应用 scope，然后重新做预检。

### 目标文件夹与 disposable 导入

先对一份一次性脱敏 Markdown 做 dry-run，检查命令形态、目标文件夹和标题；随后只导入这份 disposable 文件一次：

```powershell
lark-cli drive +import --file "<ABSOLUTE_DISPOSABLE_MD>" --type docx --folder-token "<FOLDER_TOKEN>" --name "知己·一次性测试" --as bot --dry-run
lark-cli drive +import --file "<ABSOLUTE_DISPOSABLE_MD>" --type docx --folder-token "<FOLDER_TOKEN>" --name "知己·一次性测试" --as bot
```

`FOLDER_TOKEN` 是目标位置标识，不是应用密钥；把它写入被忽略的运行配置，不要粘贴进聊天。必须确认返回最终文档 token/URL、文件位于专用文件夹，且用户可访问。未确认前不启用真实 result type。

## 滴答 / TickTick：官方 MCP 设置门

### 状态

| 状态 | 含义 | 下一步 |
|---|---|---|
| `mcp_missing` | 当前环境没有账号区域对应的官方 MCP | 在客户端的官方连接器页面选择正确提供方 |
| `wrong_region` | 中国区账号选择了国际区，或反之 | `dida365` 绑定中国区；`ticktick` 绑定国际区 |
| `auth_required` | 提供方存在但尚未在官方授权页面完成授权 | 只在官方 UI 完成授权 |
| `create_capability_ambiguous` | 未发现或发现多个可能的创建操作 | 停止该渠道，不猜工具名 |
| `ready` | 区域、授权、目标清单与唯一创建能力都明确 | 仍先创建一次性测试任务 |

选择账号区域对应的官方 MCP，在其官方授权页面完成授权；不要把授权 token 带回聊天或仓库。运行时按 schema 做语义发现，必须只有恰好一个 create-task 操作，并只授予/使用创建任务所需能力。

在配置的测试清单中创建一项一次性测试任务，核对返回的标题、描述、清单和可推导日期。通过创建响应或用户客户端目视确认；不读取任务，不调用 list/get/search/update/complete，也不检查其他任务、完成状态、习惯或历史。测试完成后可由用户在官方客户端手动清理该一次性任务。

## 启用顺序

仓库示例 `.claude/shared/result-distribution-config.example.json` 中顶层、渠道和全部 result type 都是 `"enabled": false` 或 false 开关。未来把它复制到 `output.result_distribution_config` 对应的忽略路径后，也只启用用户明确同意且 disposable 测试已通过的渠道/结果类型；不要一次性全开。

启用前依次确认：本地报告写入与复读成功、飞书为 `ready`、对应区域 MCP 为 `ready`、相同 fixture 重跑不会重复创建。任一条件缺失就保持该渠道关闭，另一个渠道可独立设置。

## 回滚与停用

1. 在被忽略的运行配置中把顶层 `"enabled": false`；需要单独停用时同时把对应渠道 `enabled` 和 result type 开关设为 false。
2. 保留状态文件用于重复保护和诊断；不要通过回滚删除状态，也不删除远端资源。
3. 再运行一次原有本地报告流程：应不追加分发摘要、不调用外部工具，原有本地报告流程不变。
4. 如需清理 disposable 文档或任务，由用户在飞书/滴答官方客户端手动处理；知己不执行远端删除。
