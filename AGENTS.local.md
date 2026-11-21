# AGENTS.local

本文件补充 [AGENTS.md](AGENTS.md)，记录会话声音提醒插件的开发约定。

[README.md](README.md) 是英文使用说明，[README.zh.md](README.zh.md) 是中文使用说明。
项目文档入口为 [docs/README.md](docs/README.md)。
插件管理器元数据存放于 `locale/*.json`，同步维护 `en zh ja de es fr pt ru`。

[index.js](index.js) 是 Host 入口。
用 Cordis 的会话事件和请求中间件触发播放，用 `ctx.effect` 管理播放进程和定时器。
[test/host.test.mjs](test/host.test.mjs) 覆盖事件筛选、请求透传、提示音的合并及清理。
当前实现为纯 JavaScript，无构建步骤。
升级 DSH 后，按项目文档核对事件接入和桌面音频输出。

## 开发约束

- 常见操作按钮优先使用易识别的图标，仅在图标无法明确表达操作含义时使用可见文字。
- 新增实现用 TypeScript，复用与目标 DSH 版本匹配的官方类型，在接口、配置和事件中保留类型信息，并同步维护类型依赖。
- 只用 DSH 支持的插件 API 和扩展点实现新行为。
  禁止修改 DSH 源码或安装产物，也禁止用全局猴子补丁或覆写内部实现绕过边界。
  扩展点不足时说明缺口，并将实现限制在插件能力内。

## Markdown

Markdown 用 `docs/scripts/reflow md <path>` 重排，命令需要 Python 3.11 或更新版本。
每个检出目录运行一次 `prek install`。
在 DSH 沙箱内提交时，用 `PREK_HOME="${TMPDIR:?}/prek-dsh" git commit -m "<commit message>"`，
让 reflow 钩子照常运行，并把 `prek` 的缓存和日志写到可写的临时目录。
保持生成的 [AGENTS.md](AGENTS.md) 与工作区模板一致。
