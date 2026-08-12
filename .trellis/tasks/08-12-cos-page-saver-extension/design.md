# 腾讯云 COS 页面剪存 Chrome 插件设计

## 架构

这是一个完全运行在浏览器端的 Chrome Manifest V3 扩展，不包含后端服务、账号系统或临时凭证代理。

- `options.html/js`：录入并保存 COS 配置。
- `popup.html/js`：显示配置状态，触发当前页面保存并显示结果。
- `background.js`：读取配置、注入页面提取函数、生成对象 key、签名并上传 Markdown。
- `storage.js`：Chrome 本地配置读写和校验。
- `crypto.js`：使用 Web Crypto API 计算 SHA-1 和 HMAC-SHA1。
- `markdown.js`：生成 Markdown 元数据和对象路径。

## 数据流

1. 用户在配置页录入 Endpoint、Region、SecretId、SecretKey、Bucket 等信息。
2. 配置保存到 `chrome.storage.local`，不发送到自有服务。
3. Popup 向 service worker 发送保存请求。
4. Service worker 用 `chrome.scripting.executeScript` 在当前标签页执行提取逻辑。
5. 页面提取逻辑参考 FeishuClip 的 Readability 流程：克隆 DOM，移除脚本、样式、导航、评论、广告和推荐区域，结合正文长度、段落数量、链接密度及 class/id 语义评分选择正文，并读取 meta/JSON-LD 中的标题、作者和摘要。
6. Service worker 添加标题、来源 URL、剪存时间等 YAML 元数据。
7. Service worker 按 COS XML API 的签名算法生成 Authorization，并用 HTTPS PUT 直传 Bucket。

## 安全与兼容性

- SecretKey 只保存在扩展本地存储；用户应为密钥设置最小权限。
- Bucket 必须配置允许扩展来源的 CORS，放行 PUT、Content-Type 和 Authorization 等请求头。
- Chrome 内置页、PDF、禁止脚本注入的页面可能无法提取，Popup 必须显示可读错误。
- MVP 保留正文中的原始图片 URL，不下载或重新上传图片资源。
- 图片提取需要兼容 `data-src`、`data-original`、`data-lazy-src`、`srcset` 和 `src` 懒加载字段，并转换为绝对 URL。
- Markdown 的 `captured_at` 使用 `Asia/Shanghai` 的 `+08:00` 偏移；COS 对象 key 保持 ASCII，纯中文标题时回退到来源域名和路径片段。

## 回滚

上传失败时保留配置、页面提取和 Markdown 生成能力，并在 Popup 中显示错误；不产生本地临时文件，也不修改源页面。
