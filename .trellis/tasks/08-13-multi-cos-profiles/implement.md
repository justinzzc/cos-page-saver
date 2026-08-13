# 实施计划

1. 扩展 `storage.js`，实现 profile 数据模型、旧设置迁移及默认配置操作。
2. 改造后台菜单生成和点击路由，使其按 profile ID 上传并支持无配置引导。
3. 改造配置页的配置列表、创建/编辑/删除/默认选择和菜单刷新。
4. 改造 Popup，展示并使用默认配置。
5. 校验 JavaScript、Manifest，检查旧设置迁移和菜单构建路径，并进行手动 Chrome 扩展验证。

## 验证

- `node --check storage.js background.js options.js popup.js`
- `manifest.json` JSON 解析
- 在 Chrome 中创建两个配置，确认默认项置顶、按菜单项上传到对应 Bucket。
