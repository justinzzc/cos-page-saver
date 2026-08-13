# 腾讯 COS 页面剪存 Chrome 插件

## 目标

实现一个 Chrome 插件，让用户可以一键把当前网页的主干内容保存为 Markdown 文档，并上传到自己的腾讯云 COS Bucket。

用户价值是快速沉淀网页知识：像飞书剪存插件一样，把文章、文档或页面主体内容提取出来，直接保存到用户自己的对象存储中，方便后续进入 Obsidian、知识库或其他工作流。

## 背景与已确认事实

- 当前仓库还没有应用源码、`package.json`、README 或已有 Chrome 插件实现，本任务是从零实现。
- 项目由 Trellis 管理，当前任务目录是 `.trellis/tasks/08-12-cos-page-saver-extension`。
- 用户明确要求没有后端服务；插件直接在浏览器中运行。
- 用户相关认证信息由插件配置页面录入，并保存在浏览器扩展本地存储中。
- 插件需要一个 COS 配置界面。用户截图中包含这些配置项：
  - 服务地址 Endpoint
  - 区域 Region
  - Access Key ID
  - Secret Access Key
  - 存储桶 Bucket 名称
  - S3 URL style
  - 分块并发度
  - 是否使用准确的文件修改时间
- 用户已确认 MVP 不需要把页面图片下载并重新上传到 COS；Markdown 中的图片链接保留原网页 URL。

## 需求

- 提供一个可作为 Chrome 未打包扩展加载的 Manifest V3 项目。
- 提供 options/settings 页面，用于配置 COS 连接信息。
- 使用浏览器扩展本地存储保存 COS 设置。
- 提供 popup 或 action UI，用户可以从当前标签页触发一键剪存。
- 从当前网页提取主要可读内容，而不是保存完整 DOM。
- 将提取到的网页内容转换为 Markdown 文档。
- Markdown 至少包含页面标题、原始 URL、剪存时间和正文内容。
- MVP 中，Markdown 图片链接保留原始网页图片 URL，不复制图片资源到 COS。
- 将生成的 Markdown 上传到用户配置的腾讯 COS Bucket。
- 对缺少配置、提取失败、上传失败等情况给出用户可见的错误状态。
- 不添加后端服务；认证信息录入、保存、读取、上传都由插件端完成。

## 验收标准

- [ ] 用户可以把构建产物作为未打包 Chrome 扩展加载。
- [ ] 用户可以打开设置页，填写 Endpoint、Region、Access Key ID、Secret Access Key、Bucket、URL style、分块并发度、精确修改时间偏好，并保存。
- [ ] 在配置完整时，用户可以点击插件按钮，对普通文章页面触发保存。
- [ ] 插件可以提取页面主干内容，并生成包含标题、原始 URL、剪存时间和正文的 Markdown。
- [ ] Markdown 中如有图片，图片链接指向原网页图片 URL，而不是复制后的 COS 资源。
- [ ] Markdown 文件会用确定、可读的对象名上传到 COS Bucket。
- [ ] Popup 会显示上传成功状态，并展示上传对象 key 或 URL。
- [ ] 配置缺失或无效时，插件展示清晰错误，不使用不完整凭据尝试上传。
- [ ] 提取或上传错误会显示在 popup/options UI 中，不需要用户打开浏览器控制台排查。

## 初版不做

- 同步到飞书、Obsidian 或其他笔记系统。
- Chrome Web Store 打包和发布。
- 账号系统、临时凭证代理或托管后端。
- 批量剪存多个标签页。
- 任意网页的完整离线镜像。
- 页面图片、CSS、脚本等资源搬运到 COS。

## 备注

- 本 PRD 只记录需求、约束和验收标准。
- 本任务属于复杂任务，实现前需要 `design.md` 和 `implement.md`。
