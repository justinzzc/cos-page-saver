# 云剪存

一个无后端的 Chrome Manifest V3 扩展：从当前网页提取主要正文，生成 Markdown，并直接上传到腾讯云 COS。支持扩展 Popup 和网页右键菜单触发。

当前版本使用 COS 无请求头签名模式，避免浏览器无法控制的 `Host` 请求头导致 `SignatureDoesNotMatch`。

COS 对象路径可以保留中文标题：请求 URL 使用 UTF-8 百分号编码，但 COS 签名规范串使用原始对象路径，避免 Unicode 路径签名不一致。

## 安装

1. 打开 `chrome://extensions/`，开启“开发者模式”。
2. 点击“加载已解压的扩展程序”，选择本项目目录。
3. 点击扩展图标，进入“打开 COS 配置”，创建一个或多个具名 COS 配置，并设置默认配置。
4. 在 COS Bucket 的 CORS 中允许扩展发起 `PUT` 请求，至少放行 `Content-Type` 和 `Host` 请求头。

Popup 的“保存当前页面”使用默认配置。在网页空白处点击右键，选择“云剪存”：第一项是默认配置，第二项是上一次成功剪存使用的配置，随后可按名称选择其他 COS 配置。

## 打包

在 PowerShell 中运行：

```powershell
.\scripts\package.ps1
```

产物会生成到 `dist/`，该目录已加入 `.gitignore`。脚本会同时生成 ZIP 和 CRX3；CRX 使用工程目录外的 `%LOCALAPPDATA%\CosPageSaver\cos-page-saver.pem` 签名，该私钥不会进入扩展目录或提交到仓库。旧版本若存在 `.secrets\cos-page-saver.pem`，脚本会自动迁移到新位置。

发布 GitHub Release（需要先安装并登录 GitHub CLI）：

```powershell
gh auth login -h github.com
.\scripts\publish-release.ps1
```

发布脚本会读取 `manifest.json` 中的版本号，自动打包并创建对应的 GitHub Release。

常用命令：

```powershell
# 创建正式 Release，直接公开发布
.\scripts\publish-release.ps1

# 创建草稿 Release，上传文件但暂不公开
.\scripts\publish-release.ps1 -Draft

# 创建预发布 Release，用于测试版本
.\scripts\publish-release.ps1 -Prerelease
```

`-Draft` 适合先检查 Release 标题、说明和 CRX/ZIP 附件，之后在 GitHub 页面手动点击“发布 Release”。`-Prerelease` 会将版本标记为预发布，不建议普通用户直接使用。

图标源文件为 `icons/icon.svg`，PNG 尺寸由 `scripts/generate-icons.ps1` 生成。

## 目录说明

- `options.html`：COS 配置页面。
- `popup.html`：当前页面剪存入口和结果提示。
- `background.js`：页面提取、Markdown 生成和 COS 签名上传流程。
- `storage.js`、`crypto.js`、`markdown.js`：本地配置、签名和文档生成工具。

## 安全边界

密钥只保存在 Chrome 的本地扩展存储中，插件不会把密钥发送到自有后端。由于浏览器端直连 COS，生产使用时建议为密钥设置最小权限，并限制 Bucket 的 CORS 和访问策略。
