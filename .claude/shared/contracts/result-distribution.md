---
type: runtime_contract
purpose: 本地结果写入成功后的独立、幂等、可停用分发契约
last_updated: 2026-08-12
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
- 经**用户明确收录**并完成写入的 `context.collection_topic`
- 经**用户明确收录**、先复制到收藏主题目录并完成复读的 `context.collection_attachment`

禁止来源包括 `input.*`、`context.core_profile`、`context.current`、`context.verified_patterns`、`analysis.*`、`output.result_distribution_config` 和 `output.result_distribution_state`。原始日志、画像、中间分析、配置与状态永不上传。

用户在本次生成请求中明确说“仅本地”时，调用方完成本地写入、复读和必要沉淀后即停止；本轮不调用飞书或 TickTick，也不增加分发摘要。这个选择只对本次请求生效，不写入持久化标记、配置或状态，不改变以后请求的分发行为。收藏附件必须从 `context.collection_attachment` 的受控路径进入；不得扫描仓库或电脑寻找待上传文件，也不得直接接收项目外路径。

“仅本地”是当前请求的非追溯选择：不追溯删除或修改此前已经创建的飞书文档或滴答任务（`local_only_non_retroactive`）。

## 配置与默认行为

仓库中的 `.claude/shared/result-distribution-config.example.json` 是 schema version `1` 的全关闭示例。用户未来只可把它复制到 `output.result_distribution_config`（`复盘/.result-distribution-config.json`）并显式启用；该运行文件受 git ignore 保护。顶层 `enabled`、渠道 `enabled` 或对应 result type 开关缺失/为 false 时，该渠道返回 `skipped_not_configured`。`ticktick.region` 只接受 `dida365` 或 `ticktick`。

App Secret、access token、refresh token、tenant token、device code、MCP token 等凭证不得出现在项目文件、命令参数、报告、配置或状态中。飞书和 TickTick 各自使用官方工具的项目外凭证存储与官方授权页面。

## 固定执行顺序

1. 确认调用方刚完成允许来源的新写入，并重新读取到非空、结构合格的文件；否则停止，不产生任何外部副作用。
2. 读取配置；配置缺失、总开关关闭、渠道关闭或结果类型关闭时，分别返回 `skipped_not_configured`。
3. 以本地报告字节计算 `SHA-256`，以仓库相对 `source_path` 读取或恢复状态。
4. 飞书按 `source_path + SHA-256 + channel` 判断 `skipped_duplicate` 或 `changed_after_delivery`；TickTick 按候选的 `normalized_title + exact_due_date_or_time` 判断逐项重复。
5. 飞书按既有规则调用；TickTick 按来源进入自动创建、候选展示或已确认创建。等待确认不调用 create-task，也不写 TickTick `last_attempt`。任一实际调用分别捕获错误，一个渠道失败不抑制另一渠道的当前阶段。
6. 每个实际调用完成后立即分别持久化其结果；候选展示不落创建状态，状态不含凭证，也不改变本地报告。
7. 摘要按来源和 TickTick 所处阶段返回：先说本地事实，再说实际飞书结果，最后显示候选或实际滴答创建结果；分发状态不写进报告正文。

## 状态模型与幂等

状态文件是 schema version `1` 的 JSON，位于 `output.result_distribution_state`。每个 `source_path` 条目保存本轮复读得到的 `current_sha256`、`written_at`，以及分开的 `feishu` / `ticktick` 状态对象。飞书继续使用 `source_path + SHA-256 + channel`，保存最后成功的 `delivered_sha256` 和本次 `last_attempt`；TickTick 在 `actions` 中按行动键逐项保存最小创建结果。

渠道状态只使用：

- `success`：该渠道最终远端写入成功；飞书把本轮指纹写入 `delivered_sha256`，TickTick 把成功的行动键写入 `actions`；相同渠道幂等键再次运行返回 `skipped_duplicate`。
- `failed`：该渠道尝试失败；保留规范化错误与可补发证据，不影响本地或另一渠道。
- `skipped_not_configured`：缺少配置或相关开关关闭，不视为失败。
- `skipped_duplicate`：飞书的同一路径、同一 SHA-256 已成功，或 TickTick 的相同标题与精确截止时间已有成功行动记录。
- `skipped_no_action`：TickTick 没有可从报告直接提取的合格行动。
- `changed_after_delivery`：仅用于飞书：同一路径已有成功分发但 SHA-256 改变；没有显式重新分发确认时不得覆盖或新建。

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

飞书幂等判断把 `current_sha256` 与飞书的 `delivered_sha256` 比较；TickTick 不使用报告 SHA-256 阻断新候选，只逐项比较行动键。不得拿一个渠道的尝试结果推断另一个渠道是否成功。对飞书，跳过或失败只更新 `last_attempt`，不得覆盖任一渠道既有的 `delivered_sha256`；对 TickTick，跳过或失败不得覆盖既有成功行动。例如飞书已交付 A、文件变为 B 后确认创建了新滴答行动时，飞书仍保留 A；以后处理飞书 B 时必须得到 `changed_after_delivery`，但 TickTick 只按标题与截止时间防重。

飞书同一 SHA-256 的失败只可在显式补发或下一次真实新写入后有限重试；TickTick 失败项按后文的一次显式重试执行。内容改变后不得静默覆盖飞书文档，也不得绕过行动键重复创建任务。若状态 JSON 损坏，把原文件重命名为 `.result-distribution-state.corrupt-YYYYMMDD-HHmmss.json`，创建干净状态后继续；不得据此删除、覆盖或猜测任何远端资源。

旧状态文件允许原样读取。缺少 `normalized_title` 或 `exact_due_date_or_time` 的旧行动记录只保留原有同来源 `action_key` 的成功/失败事实，不得把缺少新字段的旧记录当作跨来源精确重复证据（`legacy_state_no_cross_source_dedupe`）；不迁移、不回读远端任务，也不自动补写猜测字段。首次遇到可能与旧记录重复的新候选时提示一次重复风险，并继续使用当前确认门；日反馈不因无法证明重复而自动创建第二项，而是按同日替代候选处理。

## 独立失败与返回摘要

每个实际尝试的渠道必须分别产生结果对象并单独落盘。一个渠道失败不会把另一个渠道标记为跳过；即使飞书先失败也继续处理 TickTick 的当前阶段，即使 TickTick 创建失败也保留飞书结果。任一外部失败不得回滚、删除、改写或降级已经成功写入的本地结果。周/月处于候选展示或等待确认阶段时，不算 TickTick 创建尝试，不写 `last_attempt`；飞书仍可独立分发并落盘。

日反馈和完成确认后的创建结果仍按实际渠道返回本地优先摘要。周/月尚未确认时，先报告本地与飞书结果，再单独显示滴答候选，不输出虚假的 TickTick 尝试状态。例如：

```text
本地已保存：复盘/每周复盘/2026-W33.md
飞书：未配置，已跳过
滴答候选（确认后创建）：
- 完成 X｜2026-08-16
```

渠道失败只给 `failed` 的错误分类与下一步，不输出完整堆栈；不得宣称本地与外部“整体失败”。没有合格候选时使用 TickTick 章节规定的一句提示，不增加空列表。

如果配置缺失、总开关关闭，或两个渠道都返回 `skipped_not_configured`，仍向调用方返回独立状态对象，但不增加用户可见摘要，保持原有聊天输出不变。这个默认关闭 no-op 不改变原报告路径、正文、成功状态或既有后续步骤。

## 飞书适配器

### 固定目录路由

飞书目标只能使用运行配置中已绑定的“知己”根目录及其后代目录 token，不按名称搜索同名根目录，也不回退到飞书根目录或其他文件夹。目录映射固定为：

| 来源 | 飞书目录 |
|---|---|
| `output.daily_feedback` | `知己/复盘/每日反馈` |
| `output.weekly_report` | `知己/复盘/每周复盘` |
| `output.monthly_report` | `知己/复盘/每月复盘` |
| `output.project_report` | `知己/复盘/项目复盘` |
| `output.yearly_report` | `知己/复盘/年度回顾` |
| `output.life_design_report` | `知己/复盘/人生设计` |
| `context.thinking_topic` | `知己/关于我/思考` |
| `context.collection_topic` / `context.collection_attachment` | `知己/关于我/收藏吃灰库/{topic}` |

目录 token 缺失、不可访问或不属于已绑定根目录时只让飞书渠道失败，不创建替代目录，不改变本地结果。目录创建属于首次配置或新收藏主题的现有 `lark-cli drive +create-folder` 操作；不得由结果分发器扫描或重组飞书其他内容。

### 预检与命令构造

只使用飞书官方 `lark-cli`。执行真实分发时依次检查 `lark-cli --version`、`lark-cli auth status`、已配置的 application identity 和目标 `folder_token` 可访问性；任一项不满足只让飞书渠道失败，不影响 TickTick 或本地结果。

先以仓库 cwd 为基准，把已校验的本地 Markdown 路径规范化为使用 `/` 的仓库相对路径。路径必须非空、不得是绝对路径，并拒绝逃出 cwd 的 `..` 路径段；从仓库 cwd 解析后还必须指向 cwd 内的现有文件。随后构造参数化 argv，不得拼接后交给 shell 重新解析。规范命令形态为：

```powershell
lark-cli drive +import --file "<workspace-relative-md-path>" --type docx --folder-token "<folder-token>" --name "<document-title>" --as bot
```

Markdown、Markdown 方言、TXT、HTML、DOC/DOCX、表格和 PPTX 只按官方 `drive +import` 支持的扩展名与目标类型转换。收藏中的 PDF、图片、音视频及其他官方允许的普通附件保留原格式，使用：

```powershell
lark-cli drive +upload --file "<workspace-relative-attachment-path>" --folder-token "<folder-token>" --name "<filename>" --as bot
```

普通附件路径必须是 `context.collection_attachment` 解析出的仓库相对路径；不得让调用方任意传入源目录或目标 token。

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

正式分发只允许 create-task 写入，禁止绑定或调用任务的 list/get/search/update/complete/delete，以及任何历史、习惯或完成状态查询能力。唯一例外是首次设置或用户明确重新绑定时，可列出清单一次以取得唯一“知己行动”的 `project_id`；该结果只写入忽略的本地配置，不读取清单内任务。系统不根据第三方状态评价用户，也不建立回写、双向同步或自动复盘。完成判断只读取后续日志，不读取滴答状态。

只有四类来源可以产生滴答任务：`output.daily_feedback`、`output.weekly_report`、`output.monthly_report`、`context.thinking_topic`。项目复盘、年度回顾、人生设计、收藏及其他来源对 TickTick 返回 `skipped_not_supported`；它们已有的本地生成和飞书分发不受影响。普通对话中用户直接要求创建滴答任务时，直接调用滴答能力，不经过知己的报告分发和状态。

### 直接纯提醒

普通对话中的一次性或周期性纯提醒默认直接创建为滴答任务，不进入上述四来源白名单、报告分发状态、确认门或候选字段限制。一次性提醒传绝对时间、`Asia/Shanghai` 和到点提醒；周期性提醒额外使用滴答原生重复规则。提醒只通知用户手动开始，不读取项目文件、不生成复盘、不调用飞书或滴答结果分发。只有用户明确指定 Codex 定时任务时才例外；需要到点自动执行工作的请求不属于纯提醒，必须单独评估。

直接纯提醒仍只允许 create-task 写入，不得为判重或验收读取、搜索、更新、完成或删除滴答任务。其送达须由首次真实通知验证，创建接口成功不等于通知已经送达。

### 任务字段

每个候选只传任务标题、截止日期或时间以及目标清单：

| 字段 | 来源 |
|---|---|
| `title` | 用报告已有事实压缩成可独立理解的 SMART 标题，不加来源前缀 |
| `due_date_or_time` | 绝对截止日期；只有原计划明确具体时间时才带时间，默认全天 |
| `project_id` | 忽略的本地配置；首次设置时从唯一现有“知己行动”清单取得并固定保存 |

不传 description、检查条件、来源路径、报告摘要、标签、优先级、附件或自定义提醒。检查条件应能压缩进标题；做不到时跳过或在确认阶段请用户补充，不得发明数量、频率、成果或投入。缺少目标清单、标题、截止时间或可检查结果时跳过候选。不得把配置、状态、原始日志、画像或分析中间产物写入任务。

系统不自动创建、迁移或修复“知己行动”清单。首次设置或明确重新绑定时可查询清单一次：名称完全匹配且恰好一个时保存非敏感 `project_id`；零个或多个匹配都停止并给一条设置指引。正式分发只使用已保存的 `project_id`，不再按名称查询；清单不存在或不可访问时本次创建失败，用户修复后明确重试失败项。

### 行动提取与上限

候选必须是用户已明确选择或报告已明确提出的、原子、可控、可检查的动作；保留原意并只用报告已有内容压缩 SMART 标题，不得发明、补全或把建议改写成新任务。

| 结果类型 | 唯一来源 | 创建门 | 上限与截止时间 |
|---|---|---:|---|
| 日反馈 | `⚡ 明天试试` 下唯一的 `行动：` | 新反馈写入、复读和沉淀成功后自动创建 | 最多 1 项；今天或昨天的反馈截止到本次成功生成后的下一本地日历日 |
| 周报 | `## 六、下周规划` 中合格条目 | 只展示候选，用户确认最终整组后创建 | 与月报同一自然日合计默认最多 3 项；无明确日期时为对应下一 ISO 周的周日 |
| 月报 | `## 六、下月规划` 中下月可检查的阶段结果 | 只展示候选，用户确认最终整组后创建 | 与周报同一自然日合计默认最多 3 项；无明确日期时为对应下一自然月末 |
| 已确认主题思考 | `0. 当前行动卡` 中唯一当前行动 | 最终保存确认同时授权保存并创建；“只保存主题”不创建 | 最多 1 项；无明确日期时为确认后的第 7 个本地日历日 |

周/月同一自然日合计默认最多 3 项，已成功创建的周/月任务占用当日名额；每日和主题不占该上限。用户说“全部创建”不自动突破，只有明确说“本次允许超过 3 项”才一次性覆盖默认上限，不改变以后规则。

日期按 `Asia/Shanghai` 本地日历计算并规范化为 MCP schema 要求的绝对日期格式，不从文件修改时间猜测。报告中的明确日期优先；相对日期锚定报告所规划的下一周期，而不是实际生成日。只有明确时间才创建定时任务。日期已过去时不创建，也不自动顺延；周/月/主题必须由用户确认新的未来日期。更早的历史日反馈不自动创建，行动仍有价值时只展示候选并要求新的未来日期。

以下内容必须拒绝：宽泛方向、价值口号、分析陈述、事实描述、升级提醒（例如建议运行 life-design）、只有目标没有近期可检查结果、依赖他人但没有用户可控动作、等待条件、“当前不行动”、没有检查条件的建议，以及为达到数量上限而补写的任务。没有任何合格候选时渠道返回 `skipped_no_action`，任务数为 0；周/月只输出“本次没有可直接创建的滴答任务。”，不显示空任务块。

多步骤共同服务一个独立可检查结果时只建一个结果任务；只有独立结果或不同截止时间才拆分。重复行动默认建一个周期结果任务；只有原计划明确要求固定频率且每次提醒确有必要时才创建重复任务。

### 候选确认

日反馈不显示预览。周/月只显示 `SMART 标题｜绝对截止日期或时间`；用户可用自然语言删除或修改，修改后重新展示一次最终整组。只有对最终整组的明确确认才创建；生成报告时预先说“同步到滴答”只表示意图，不是对未知最终候选的确认，“看起来可以”“我再想想”等含糊表达不创建。未确认候选不排队、不催办、不写待创建状态。

候选修改只改变本轮待创建数据，不改写报告正文（`candidate_edit_does_not_rewrite_report`）；用户另行明确要求修改报告时，才走报告自身的修改流程。候选默认不解释提取理由，只有存在真实取舍（例如候选超过上限或必须二选一）或用户明确询问时才补充理由（`candidate_reason_on_tradeoff_only`）。

主题最终确认同时涵盖“保存并创建”；用户说“只保存主题”时只保存并按现有规则处理飞书。主题只有等待条件、没有当前行动或写明“当前不行动”时不创建。

用户在当前生成请求中说“仅本地”时不创建；周/月也不展示候选。该选择只作用本轮，不写配置、状态或报告。

### 创建与逐项幂等

每项任务的确定性 `action_key` 由 `normalized_title + exact_due_date_or_time` 计算 SHA-256；`normalized_title` 只做 Unicode、首尾和连续空白规范化，不改变动作含义。创建前扫描状态中全部来源的成功 `actions`，完全相同的标题和截止日期/时间跨来源只创建一次。同标题但截止时间不同不自动判重：周/月提示可能重复并交给用户确认；每日可视为新执行周期。

调用唯一绑定的 create-task 操作时逐项传入最终标题、截止日期或时间以及已绑定的目标 `project_id`。每项任务分别记录来源类型和本地来源标识、`normalized_title`、`exact_due_date_or_time`、`action_key`、`status`、远端 `task_id`、`attempted_at` 与规范化 `error_code`；不得记录 description、完成记录、修改历史、MCP token、完整响应或无关任务信息。一项失败不阻止剩余合格项，也不改变飞书或本地结果。

同一天日反馈重新分析得到同一键时返回“已存在，未重复创建”；得到不同键时不自动创建第二项，只展示新候选并询问是否创建替代任务，旧任务由用户在滴答中处理。报告后来修改也不自动更新或删除既有任务；实质变化形成新候选并重新确认。

创建前只拦截标题与截止时间已经足以证明的直接、明显互斥，例如同一时间必须在两个地点完成的任务（`direct_obvious_conflict_only`）。不做精力预测、复杂排程或一般性的潜在冲突推断；无法仅凭当前候选确认直接互斥时不阻止创建。日反馈与已确认的周/月候选直接互斥时，不自动创建日反馈任务，改为展示替代选择并询问用户；其他日反馈仍保持自动创建。

一组任务失败后，只有用户明确重试时才重试失败项一次，成功项按 `action_key` 跳过；再次失败即停止。修改标题或截止时间后是新候选，不算重试。远端创建成功但本地状态写入失败时明确告知“任务已创建，但防重记录失败”，不自动重建记录或再次创建；以后遇到相同候选时提示重复风险。

创建成功的聊天反馈只列标题和截止时间，例如：

```text
已创建 2 项滴答任务：
- 完成 X｜2026-08-16
- 提交 Y｜2026-08-18
```

部分失败逐项标明“已创建/失败”，不输出任务 ID、完整响应或技术堆栈。
