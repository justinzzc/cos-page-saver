# COS 页面剪存

一个无后端的 Chrome Manifest V3 扩展：从当前网页提取主要正文，生成 Markdown，并直接上传到腾讯云 COS。

当前版本使用 COS 无请求头签名模式，避免浏览器无法控制的 `Host` 请求头导致 `SignatureDoesNotMatch`。

COS 对象路径可以保留中文标题：请求 URL 使用 UTF-8 百分号编码，但 COS 签名规范串使用原始对象路径，避免 Unicode 路径签名不一致。

## 安装

1. 打开 `chrome://extensions/`，开启“开发者模式”。
2. 点击“加载已解压的扩展程序”，选择本项目目录。
3. 点击扩展图标，进入“打开 COS 配置”，填写 Endpoint、Region、SecretId、SecretKey 和 Bucket。
4. 在 COS Bucket 的 CORS 中允许扩展发起 `PUT` 请求，至少放行 `Content-Type` 和 `Host` 请求头。

## 打包

在 PowerShell 中运行：

```powershell
.\scripts\package.ps1
```

产物会生成到 `dist/`，该目录已加入 `.gitignore`，可直接在 Chrome Web Store 开发者后台上传 ZIP，或作为备份文件保存。

图标源文件为 `icons/icon.svg`，PNG 尺寸由 `scripts/generate-icons.ps1` 生成。

## 目录说明

- `options.html`：COS 配置页面。
- `popup.html`：当前页面剪存入口和结果提示。
- `background.js`：页面提取、Markdown 生成和 COS 签名上传流程。
- `storage.js`、`crypto.js`、`markdown.js`：本地配置、签名和文档生成工具。

## 安全边界

密钥只保存在 Chrome 的本地扩展存储中，插件不会把密钥发送到自有后端。由于浏览器端直连 COS，生产使用时建议为密钥设置最小权限，并限制 Bucket 的 CORS 和访问策略。
