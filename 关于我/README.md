# 关于我目录说明

这个目录分成两部分：

- 运行时私有数据：如 `current.md`、`core-profile.md`、`verified-patterns.md` 等，会在你真实使用时逐步生成或被更新。
- 分发模板：放在 `templates/` 目录下，作为仓库内保留的空白模板。

`关于我/` 根目录下的运行文件最初以空白种子文件纳入版本控制，方便首次运行。由于 `.gitignore` 不会保护已跟踪文件，在填写真实内容前请从仓库根目录运行 `scripts/protect-private-data.ps1`；换电脑或重新克隆后需要重新执行。

如果你需要恢复空白模板，可以参考 `templates/` 中对应的 `*.template.md` 文件手动复制。
