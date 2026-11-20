# 项目文档

用户说明见 [README.zh.md](../README.zh.md)。
开发约定见 [AGENTS.md](../AGENTS.md) 与 [AGENTS.local.md](../AGENTS.local.md)。

在插件目录执行 `npm test`、`node --check index.js`、`npm pack --dry-run`。
在工作区根目录执行 `node tools/new-dsh-plugin/cli.mjs --check plugins/dsh-session-sounds`。

桌面验证时，从前台发起一轮对话，再切换到其他应用。
主会话成功结束应响起 Glass。另开会话请求助手用提问工具询问偏好，问题出现时停留片刻，应能听到 Ping。
停用插件后重复相同流程，确认提示音已关闭。
