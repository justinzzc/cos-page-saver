import { readSettings, writeSettings, validateSettings } from "./storage.js";
const form = document.querySelector("#settingsForm");
const message = document.querySelector("#message");
const testButton = document.querySelector("#testButton");
const settings = await readSettings();
for (const [key, value] of Object.entries(settings)) { const input = form.elements.namedItem(key); if (!input) continue; if (input.type === "checkbox") input.checked = Boolean(value); else input.value = value; }
form.addEventListener("submit", async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(form)); data.useAccurateModifiedTime = form.elements.useAccurateModifiedTime.checked; data.multipartConcurrency = Number(data.multipartConcurrency); const error = validateSettings(data); message.textContent = error || "配置已保存"; message.className = `status ${error ? "warning" : "success"}`; if (!error) await writeSettings(data); });
function currentSettings() { const data = Object.fromEntries(new FormData(form)); data.useAccurateModifiedTime = form.elements.useAccurateModifiedTime.checked; data.multipartConcurrency = Number(data.multipartConcurrency); return data; }
testButton.addEventListener("click", async () => {
  const data = currentSettings();
  const error = validateSettings(data);
  if (error) { message.textContent = error; message.className = "status warning"; return; }
  testButton.disabled = true;
  message.textContent = "正在测试直连 COS...";
  try {
    const response = await chrome.runtime.sendMessage({ type: "TEST_COS", settings: data });
    if (!response?.ok) throw new Error(response?.error || "测试失败");
    await writeSettings(data);
    message.textContent = `连接成功：${response.result.host}/${response.result.key}`;
    message.className = "status success";
  } catch (testError) { message.textContent = testError.message || "测试失败"; message.className = "status warning"; }
  finally { testButton.disabled = false; }
});
