# 项目文档

用户说明见 [README.zh.md](../README.zh.md)。
开发约定见 [AGENTS.md](../AGENTS.md) 与 [AGENTS.local.md](../AGENTS.local.md)。

新检出后在插件目录运行 `npm ci`，安装锁定的开发依赖并生成运行文件。
改动源码后用 `npm run build` 更新产物，用 `npm test` 重新构建并测试。
在 DSH shell 运行 `npm run check`，依次核对产物、运行测试、检查类型并核对当前 DSH 的类型包版本。
升级 DSH 后先执行 `node scripts/sync-types.mjs` 查看新的固定版本。

用 `node --check index.js` 验证运行时语法，用 `npm pack --dry-run --json` 核对发布文件。
在工作区根目录运行 `node tools/new-dsh-plugin/cli.mts --check plugins/dsh-session-sounds` 校验骨架。

桌面验证时，从前台发起一轮对话，再切换到其他应用。
主会话成功结束应响起 Glass。另开会话请求助手用提问工具询问偏好，问题出现时停留片刻，应能听到 Ping。
停用插件后重复相同流程，确认提示音已关闭。
