# 支持多 COS 配置与右键菜单选择

## Goal

允许用户在扩展中保存多个具名的腾讯云 COS 配置，并在网页右键菜单的“云剪存”二级菜单中按配置名称选择目标后剪存页面。

## Confirmed Facts

- 现有扩展仅在 `chrome.storage.local.settings` 中保存单个 COS 配置。
- 配置页只支持编辑一个配置；Popup 和右键菜单均读取该配置。
- 右键菜单目前为单一项“保存到云剪存”，后台上传入口为 `savePage(tabId)`。

## Requirements

- 配置应可创建、编辑、删除，并具有用户可见的名称。
- 已保存的多个配置应持久化在 Chrome 本地扩展存储中，密钥不得进入仓库或网络日志。
- 网页右键菜单应展示“云剪存”父级菜单及以配置名称命名的二级菜单项；点击任一项时，使用对应 COS 配置保存当前页面。
- 右键“云剪存”的二级菜单固定将默认配置放在第一项并以“默认：配置名称”标识；上一次用于剪存的配置放在第二项并以“上一次：配置名称”标识；其余配置按名称列出。若上一次配置就是默认配置，则不重复显示。
- Popup 的“保存当前页面”始终使用默认配置。
- 菜单应在扩展安装、启动及配置变更后同步更新。
- 现有单配置用户升级后应保留其可用配置，避免丢失已有 COS 凭据。

- [ ] 用户可在配置页创建至少两个具名 COS 配置，并分别测试连接、编辑及删除。
- [ ] 右键“云剪存”第一项为带“默认”标识的默认配置，第二项为带“上一次”标识的最近剪存配置（与默认相同时不重复），并显示每个已保存配置的具名二级菜单；选择配置 A/B 后，上传请求分别使用 A/B 的 Bucket、Endpoint、密钥与对象前缀。
- [ ] 菜单在创建、编辑、删除配置后立即反映最新名称和列表。
- [ ] 原有 `settings` 单配置在升级后可作为一个具名配置继续使用。
- [ ] 无有效配置时，右键菜单给出明确的配置引导且不尝试上传。

## Out of Scope

- 配置导入、导出、云端同步及凭据加密。
- 在一次剪存中向多个 COS 目标同时上传。


## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
