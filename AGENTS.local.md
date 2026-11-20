# AGENTS.local

本文件补充 [AGENTS.md](AGENTS.md)，记录会话声音提醒插件的开发约定。

[README.md](README.md) 是英文使用说明，[README.zh.md](README.zh.md) 是中文使用说明。
项目文档入口为 [docs/README.md](docs/README.md)。
插件管理器元数据存放于 `locale/*.json`，同步维护 `en zh ja de es fr pt ru`。

[index.js](index.js) 是 Host 入口。
用 Cordis 的会话事件和请求中间件触发播放，用 `ctx.effect` 管理播放进程和定时器。
[test/host.test.mjs](test/host.test.mjs) 覆盖事件筛选、请求透传、提示音的合并及清理。
插件为纯 JavaScript，无构建步骤。
升级 DSH 后，按项目文档核对事件接入和桌面音频输出。

Markdown 用 `docs/scripts/reflow md <path>` 重排，命令需要 Python 3.11 或更新版本。
每个检出目录运行一次 `prek install`。
保持生成的 [AGENTS.md](AGENTS.md) 与工作区模板一致。
