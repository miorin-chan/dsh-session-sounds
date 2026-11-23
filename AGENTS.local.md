# AGENTS.local

本文件补充 [AGENTS.md](AGENTS.md)，记录会话声音提醒插件的开发约定。

[README.md](README.md) 是英文使用说明，[README.zh.md](README.zh.md) 是中文使用说明。
项目文档入口为 [docs/README.md](docs/README.md)。
插件管理器元数据存放于 `locale/*.json`，同步维护 `en zh ja de es fr pt ru`。
插件详情页要整体短、每项一眼能懂。
只展示用户当下需要知道或操作的内容，细节按需展开。

[Host 源码](src/host/index.ts) 用 Cordis 的会话事件和请求中间件触发播放，用 `ctx.effect` 管理播放进程和定时器。
[构建脚本](scripts/build.mts) 生成 `index.js`。
Git 忽略该文件，npm 打包时包含它。DSH 类型依赖用 `import type` 引入。
[test/host.test.mts](test/host.test.mts) 覆盖事件筛选、请求透传、提示音的合并及清理。
修改源码与升级 DSH 后，按项目文档运行构建和检查。
升级时同时核对事件接入和桌面音频输出。

## 复用 DSH 原生界面

- 优先复用 DSH 原生组件、行为、主题 token 和同类界面布局，以减少自写代码和维护成本。
- 当前版本有受支持的运行时入口且性能可接受时，优先通过公开插槽、
  组件工厂或宿主提供的可加载模块动态复用，让宿主提供组件实现。
  只有现有组件和扩展点无法满足需求时，才补足必要的插件实现。
- 静态引入或打包官方代码或资源时，在引用处标注上游包名、版本或提交、源码路径及符号名，便于升级时回看和同步，
  并保留适用的许可证与署名。

## 开发约束

- 常见操作按钮优先使用易识别的图标，仅在图标无法明确表达操作含义时使用可见文字。
- 编写插件时，除非有特殊说明，否则使用 TypeScript。
  复用与目标 DSH 版本匹配的官方类型，在接口、配置和事件中保留类型信息，并同步维护类型依赖。
- 只用 DSH 支持的插件 API 和扩展点实现新行为。
  禁止修改 DSH 源码或安装产物，也禁止用全局猴子补丁或覆写内部实现绕过边界。
  扩展点不足时说明缺口，并将实现限制在插件能力内。

## Markdown

Markdown 用 `docs/scripts/reflow md <path>` 重排，命令需要 Python 3.11 或更新版本。
每个检出目录运行一次 `prek install`。
在 DSH 沙箱内提交时，用 `PREK_HOME="${TMPDIR:?}/prek-dsh" git commit -m "<commit message>"`，
让 reflow 钩子照常运行，并把 `prek` 的缓存和日志写到可写的临时目录。
保持生成的 [AGENTS.md](AGENTS.md) 与工作区模板一致。

`npm run build:tools` 从 `scripts/` 下的 `.mts` 生成同路径 `.mjs`，Git 跟踪 TypeScript 源码。
Node.js 22.18 或更新版本直接运行 `.test.mts`。
