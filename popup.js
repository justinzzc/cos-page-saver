import { getDefaultProfile, validateSettings } from "./storage.js";
const configState = document.querySelector("#configState");
const saveButton = document.querySelector("#saveButton");
const result = document.querySelector("#result");
const settingsButton = document.querySelector("#settingsButton");
const settings = await getDefaultProfile();
const error = settings ? validateSettings(settings) : "尚未添加 COS 配置";
configState.textContent = error ? "尚未完成 COS 配置" : `默认：${settings.name} · ${settings.bucket}`;
configState.className = `status ${error ? "warning" : "success"}`;
if (error) saveButton.disabled = true;
settingsButton.addEventListener("click", () => chrome.runtime.openOptionsPage());
saveButton.addEventListener("click", async () => {
  saveButton.disabled = true;
  saveButton.innerHTML = "<span>…</span> 正在提取并上传";
  result.hidden = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.runtime.sendMessage({ type: "SAVE_PAGE", tabId: tab.id, profileId: settings.id });
    if (!response?.ok) throw new Error(response?.error || "保存失败。");
    result.hidden = false;
    result.className = "result success-box";
    result.innerHTML = `已保存<br><code>${response.result.key}</code><br><small>Host: ${response.result.host}<br>签名时间: ${response.result.signedAt}</small><br><a href="${response.result.url}" target="_blank">打开 COS 文件</a>`;
  } catch (e) {
    result.hidden = false;
    result.className = "result error-box";
    result.textContent = e.message || "保存失败，请检查配置和页面权限。";
  } finally { saveButton.disabled = false; saveButton.innerHTML = "<span>↓</span> 保存当前页面"; }
});
