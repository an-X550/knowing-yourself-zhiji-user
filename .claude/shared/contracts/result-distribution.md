---
type: runtime_contract
purpose: 本地结果写入成功后的独立、幂等、可停用分发契约
last_updated: 2026-08-11
---

# 结果分发契约

## 职责与调用边界

本地报告是权威结果，外部分发只是后置副作用。调用接口为 `distribute <path-key> <resolved-local-path>`；只有调用方已完成一次**新写入**，并从磁盘**重新读取**到**非空**且符合最低结构的结果，才可进入本契约。缓存命中、只读展示、写入或分析失败均不调用。外部结果不得进入分析提示词、改写报告正文或降低本地成功状态。

允许的来源只有：

- `output.daily_feedback`
- `output.weekly_report`
- `output.monthly_report`
- `output.project_report`
- `output.yearly_report`
- `output.life_design_report`
- 经**用户明确确认**并完成写入的 `context.thinking_topic`

禁止来源包括 `input.*`、`context.core_profile`、`context.current`、`context.verified_patterns`、`analysis.*`、`output.result_distribution_config` 和 `output.result_distribution_state`。原始日志、画像、中间分析、配置与状态永不上传。

## 配置与默认行为

仓库中的 `.claude/shared/result-distribution-config.example.json` 是 schema version `1` 的全关闭示例。用户未来只可把它复制到 `output.result_distribution_config`（`复盘/.result-distribution-config.json`）并显式启用；该运行文件受 git ignore 保护。顶层 `enabled`、渠道 `enabled` 或对应 result type 开关缺失/为 false 时，该渠道返回 `skipped_not_configured`。`ticktick.region` 只接受 `dida365` 或 `ticktick`。

App Secret、access token、refresh token、tenant token、device code、MCP token 等凭证不得出现在项目文件、命令参数、报告、配置或状态中。飞书和 TickTick 各自使用官方工具的项目外凭证存储与官方授权页面。

## 固定执行顺序

1. 确认调用方刚完成允许来源的新写入，并重新读取到非空、结构合格的文件；否则停止，不产生任何外部副作用。
2. 读取配置；配置缺失、总开关关闭、渠道关闭或结果类型关闭时，分别返回 `skipped_not_configured`。
3. 以本地报告字节计算 `SHA-256`，以仓库相对 `source_path` 读取或恢复状态。
4. 对 `source_path + SHA-256 + channel` 分别判断 `skipped_duplicate` 或 `changed_after_delivery`。
5. 飞书与 TickTick 分别调用、分别捕获错误；一个渠道失败后仍继续另一个渠道，不允许前者的结果抑制后者。
6. 每个渠道完成后立即分别持久化其结果；状态不含凭证，也不改变本地报告。
7. 返回以 `本地已保存：<source_path>` 开头的本地优先三行聊天摘要；分发状态不写进报告正文。

## 状态模型与幂等

状态文件是 schema version `1` 的 JSON，位于 `output.result_distribution_state`。每个 `source_path` 条目保存本轮复读得到的 `current_sha256`、`written_at`，以及分开的 `feishu` / `ticktick` 状态对象。每个渠道分别保存最后成功的 `delivered_sha256` 和本次 `last_attempt`；逻辑幂等键严格是“本地相对路径 + SHA-256 + 渠道”，不能只按文件名、日期或内容判断。

渠道状态只使用：

- `success`：该渠道最终远端写入成功；把本轮指纹写入该渠道的 `delivered_sha256`，相同幂等键再次运行返回 `skipped_duplicate`。
- `failed`：该渠道尝试失败；保留规范化错误与可补发证据，不影响本地或另一渠道。
- `skipped_not_configured`：缺少配置或相关开关关闭，不视为失败。
- `skipped_duplicate`：同一路径、同一 SHA-256、该渠道已有成功记录。
- `skipped_no_action`：TickTick 没有可从报告直接提取的合格行动。
- `changed_after_delivery`：同一路径已有成功分发但 SHA-256 改变；没有显式重新分发确认时不得覆盖或新建。

一次状态条目的最小语义如下；渠道对象独立更新，不能用一个总状态覆盖：

```json
{
  "schema_version": 1,
  "sources": {
    "复盘/每周复盘/2026-W33.md": {
      "source_path": "复盘/每周复盘/2026-W33.md",
      "current_sha256": "<CURRENT-SHA-256>",
      "written_at": "<ISO-8601>",
      "feishu": {
        "delivered_sha256": "<CURRENT-SHA-256>",
        "last_attempt": {
          "sha256": "<CURRENT-SHA-256>",
          "status": "success",
          "attempted_at": "<ISO-8601>"
        }
      },
      "ticktick": {
        "delivered_sha256": null,
        "last_attempt": {
          "sha256": "<CURRENT-SHA-256>",
          "status": "skipped_no_action",
          "attempted_at": "<ISO-8601>"
        },
        "actions": []
      }
    }
  }
}
```

幂等判断必须把 `current_sha256` 分别与当前渠道的 `delivered_sha256` 比较；不得拿一个渠道的尝试结果推断另一个渠道是否成功。`skipped_not_configured`、`failed`、`skipped_no_action`、`skipped_duplicate` 或 `changed_after_delivery` 等跳过或失败只更新 `last_attempt`，不得覆盖任一渠道既有的 `delivered_sha256`。例如飞书已交付 A、文件变为 B 后仅滴答成功时，飞书仍保留 A；以后启用飞书处理 B 时必须得到 `changed_after_delivery`，不能误判重复或静默新建。

同一 SHA-256 的失败渠道只可在显式补发或下一次真实新写入后有限重试。内容改变后不得静默覆盖飞书文档或重复创建任务。若状态 JSON 损坏，把原文件重命名为 `.result-distribution-state.corrupt-YYYYMMDD-HHmmss.json`，创建干净状态后继续；不得据此删除、覆盖或猜测任何远端资源。

## 独立失败与返回摘要

每个渠道必须分别产生结果对象并单独落盘。一个渠道失败不会把另一个渠道标记为跳过；即使飞书先失败也继续 TickTick，即使 TickTick 失败也保留飞书结果。任一外部失败不得回滚、删除、改写或降级已经成功写入的本地结果。

只要至少一个渠道已启用，聊天摘要固定三行，始终先说本地事实，例如：

```text
本地已保存：复盘/每周复盘/2026-W33.md
飞书：未配置，已跳过
滴答：无合格行动，已跳过
```

渠道失败只给 `failed` 的错误分类与下一步，不输出完整堆栈；不得宣称本地与外部“整体失败”。

如果配置缺失、总开关关闭，或两个渠道都返回 `skipped_not_configured`，仍向调用方返回独立状态对象，但不增加用户可见摘要，保持原有聊天输出不变。这个默认关闭 no-op 不改变原报告路径、正文、成功状态或既有后续步骤。

## 飞书适配器

### 预检与命令构造

只使用飞书官方 `lark-cli`。执行真实分发时依次检查 `lark-cli --version`、`lark-cli auth status`、已配置的 application identity 和目标 `folder_token` 可访问性；任一项不满足只让飞书渠道失败，不影响 TickTick 或本地结果。

先以仓库 cwd 为基准，把已校验的本地 Markdown 路径规范化为使用 `/` 的仓库相对路径。路径必须非空、不得是绝对路径，并拒绝逃出 cwd 的 `..` 路径段；从仓库 cwd 解析后还必须指向 cwd 内的现有文件。随后构造参数化 argv，不得拼接后交给 shell 重新解析。规范命令形态为：

```powershell
lark-cli drive +import --file "<workspace-relative-md-path>" --type docx --folder-token "<folder-token>" --name "<document-title>" --as bot
```

argv 顺序固定为 `drive`, `+import`, `--file`, workspace-relative path, `--type`, `docx`, `--folder-token`, folder token, `--name`, title, `--as`, `bot`。命令必须从仓库 cwd 执行；路径、folder token 和标题各作为单独参数传入，因此中文路径、空格或标点不会被二次解释。argv 不得包含 App Secret、access token、tenant token 或其他凭证；`folder_token` 是非敏感目标标识，只从忽略的本地配置读取。

### 标题

标题只使用 path key、文件名日期、YAML frontmatter 或报告一级标题，不为取标题而读取正文分析内容：

| 类型 | 标题 |
|---|---|
| daily | `知己·每日反馈·YYYY-MM-DD` |
| weekly | `知己·周度复盘·YYYY-Www` |
| monthly | `知己·月度复盘·YYYY-MM` |
| project / yearly / life-design / thinking | `知己·{type}·{local title}` |

`{local title}` 去除文件系统非法字符和控制字符、折叠首尾空白；清洗后为空则该渠道失败并提示修正标题，不从正文发明标题。

### 串行、重试与异步结果

同一 folder_token 串行执行导入，不能并发。只有官方 CLI 文档列出的同位置并发冲突码 `232140101`、`232140100`、`233523001` 才在等待数秒后有限重试，单个失败项总共最多重试 3 次。`permission`、`not_found`、`missing_scope` 以及其他校验/授权错误一律不重试，只记录规范化分类和下一步。

当返回 `ready=false` 且含 `ticket` 时记为 pending；只执行 CLI 返回的 next_command，不自行拼接、扩展或猜测查询命令。只有后续最终结果返回 `document_token` 或 `url` 才记为 `success`；超时、终态错误或没有最终目标均记为 `failed`。不得自动转移 owner。

飞书渠道状态对象只记录 `status`、`document_token`、`url`、`ticket`、`attempted_at` 和规范化 `error_code`；不记录 stdout 全文、完整堆栈、命令行或凭证。`permission_grant` 只用于向用户说明访问状态，不改变导入成功语义。

## TickTick 单向边界

### 区域与能力绑定

`ticktick.region = dida365` 只绑定滴答清单中国区官方 MCP；`ticktick.region = ticktick` 只绑定 TickTick 国际区官方 MCP，不能跨区回退或猜测。进入渠道前必须确认官方 MCP 已授权，并按输入/输出 schema 做语义发现：候选操作必须且只能创建一项任务。只有找到**恰好一个**已授权的 create-task 候选才可绑定；零个或多个候选都返回配置错误，不猜工具名。

只允许 create-task 写入。禁止绑定或调用 list/get/search/update/complete，以及任何历史、习惯、项目或完成状态查询能力；不根据第三方状态评价用户，也不建立回写、双向同步或自动复盘。本轮只定义语义，不调用或模拟 MCP。

### 任务字段

每个候选只映射下列字段：

| 字段 | 来源 |
|---|---|
| `action_title` | 报告中已经写出的动作本身，去除列表标记并规范化空白 |
| description | `source_path`、报告周期与 `check_condition`；不复制整篇报告 |
| `list_name` | 忽略的本地配置 |
| `due_date` | 仅按下述确定性日期规则可推导时填写 |

缺少目标清单、动作标题或检查条件时跳过该候选。不得把配置、状态、原始日志、画像或分析中间产物写入任务。

### 行动提取与上限

候选必须同时是原子、可控、可检查的动作；保留原文动作，不得发明、补全或把建议改写成新任务。

| 结果类型 | 唯一来源 | 上限 | due_date |
|---|---|---:|---|
| 日反馈 | `⚡ 明天试试` 下唯一的 `行动：` | 最多 1 项 | 写入日的下一本地日历日 |
| 周报 | `## 六、下周规划` 中动作和检查条件都明确的条目 | 最多 3 项 | 报告中的明确日期优先，否则下一 ISO 周的周日 |
| 月报 | `## 六、下月规划` 中动作和检查条件都明确的条目 | 最多 3 项 | 报告中的明确日期优先，否则下一自然月末 |
| 项目复盘 | 后续规划中动作和检查条件都明确的项目项 | 最多 3 项 | 只采用条目或报告明确日期，否则没有 due_date |
| 年度 / 人生设计 | 明确、近期且有检查条件的近期实验 | 最多 3 项 | 只采用正文明确日期，否则没有 due_date |
| 已确认主题思考 | 用户确认写入后 `0. 当前行动卡` 中的当前最小行动 | 最多 3 项 | 只采用正文明确日期，否则没有 due_date |

日期按本地日历计算并规范化为 MCP schema 要求的日期格式，不从文件修改时间猜测。明确日期必须与候选动作直接关联；模糊的“尽快、以后、有空”不生成 due_date。

以下内容必须拒绝：宽泛方向、价值口号、分析陈述、事实描述、升级提醒（例如建议运行 life-design）、只有目标没有第一步、依赖他人但没有用户可控动作、没有检查条件的建议，以及为达到数量上限而补写的任务。没有任何合格候选时渠道返回 `skipped_no_action`，任务数为 0。

### 创建与逐项幂等

每项任务的确定性 `action_key` 由 `source_path + normalized_title` 计算 SHA-256；`normalized_title` 只做 Unicode/空白规范化，不改变动作含义。同一报告重试时，已有成功 `action_key` 直接跳过，失败项可按共享契约有限重试，不能重复创建成功项。

调用唯一绑定的 create-task 操作时逐项传入 `action_title`、description、`list_name` 和可选 `due_date`。每项任务分别记录 `action_key`、`status`、远端 `task_id`、`attempted_at` 与规范化 `error_code`；不得记录 MCP token、完整响应或无关任务信息。一项失败不阻止剩余合格项，也不改变飞书或本地结果。
