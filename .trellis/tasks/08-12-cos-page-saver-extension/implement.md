# 腾讯云 COS 页面剪存 Chrome 插件实现计划

## 已完成

- 创建 Manifest V3 扩展清单和 Popup、Options 页面。
- 创建本地配置存储、配置校验、SHA-1/HMAC-SHA1 工具。
- 创建正文提取、HTML 到 Markdown 转换和对象 key 生成逻辑。
- 创建无后端 COS 签名 PUT 上传流程。
- 使用真实 COS 配置完成最小 PUT 验证，HTTP 200。
- 添加中文 UI、成功状态、失败状态和安装说明。
- 参考 `参考/FeishuClip` 的 Readability 策略增强正文候选识别和页面元数据提取。
- 修复懒加载图片、纯中文标题对象名和中国时区剪存时间。

## 验证

- 使用 `node --check` 检查所有 JavaScript 文件语法，并运行 `node smoke-test.mjs` 验证对象路径。
- 使用 PowerShell JSON 解析检查 `manifest.json`。
- 使用 Chrome `chrome://extensions/` 加载本项目目录进行手工冒烟测试。

## 已知限制

- 不上传图片、CSS 或其他页面资源。
- COS CORS 需要用户在 Bucket 侧完成配置。
- 正文提取采用轻量启发式算法，复杂站点可能需要后续增加站点适配。
