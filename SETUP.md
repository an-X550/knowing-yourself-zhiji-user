# 使用说明

## 1. 准备项目

将 `zhiji-user` 放到 Claude Code 可以打开的目录中，然后在 Claude Code 中进入该目录。

如果你是通过 GitHub 获取：

```bash
git clone <用户版仓库地址>
cd zhiji-user
```

如果你拿到的是压缩包，解压后进入解压目录即可。

## 2. 第一次试用

最推荐的第一次使用方式是：

1. 打开 Claude Code。
2. 粘贴今天的日志。
3. 输入 `/review`。

如果你只想明确做当天反馈，输入：

```bash
/daily-review
```

## 3. 不知道用哪个入口

优先用 `/review`。它会根据你贴入的内容判断更适合日分析、周复盘、月复盘、项目复盘还是方向校准。

## 4. 没有日志怎么办

可以先打开 [`examples/demo/sample-journal.md`](examples/demo/sample-journal.md)，把示例内容粘贴给 Claude Code，再运行 `/review`。

## 5. 内测反馈

使用后直接告诉维护者：

- 分析是否准确。
- 哪些内容有用。
- 哪些地方不准、太长、太绕或不知道怎么执行。
- 后续日志里是否自然提到了前一次建议。

不用专门整理成报告，真实反馈最重要。
