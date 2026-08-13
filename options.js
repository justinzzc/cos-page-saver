import { getProfileState, removeProfile, saveProfile, setDefaultProfile, validateSettings } from "./storage.js";

const form = document.querySelector("#settingsForm");
const list = document.querySelector("#profileList");
const message = document.querySelector("#message");
const testButton = document.querySelector("#testButton");
const newButton = document.querySelector("#newButton");
const defaultButton = document.querySelector("#defaultButton");
const deleteButton = document.querySelector("#deleteButton");
let state = await getProfileState();
let selectedId = state.profiles[0]?.id || "";

function showMessage(text, kind = "success") { message.textContent = text; message.className = `status ${kind}`; }
function fill(profile) {
  for (const [key, value] of Object.entries(profile || {})) { const input = form.elements.namedItem(key); if (!input) continue; if (input.type === "checkbox") input.checked = Boolean(value); else input.value = value; }
}
function current() {
  const data = Object.fromEntries(new FormData(form));
  data.useAccurateModifiedTime = form.elements.useAccurateModifiedTime.checked;
  data.multipartConcurrency = Number(data.multipartConcurrency);
  return { ...data, id: selectedId };
}
function render() {
  list.replaceChildren(...state.profiles.map((profile) => {
    const button = document.createElement("button");
    button.type = "button"; button.className = `profile-item ${profile.id === selectedId ? "selected" : ""}`;
    button.textContent = `${profile.name}${profile.id === state.defaultProfileId ? " · 默认" : ""}`;
    button.addEventListener("click", () => { selectedId = profile.id; fill(profile); render(); showMessage(""); });
    return button;
  }));
  defaultButton.disabled = !selectedId || selectedId === state.defaultProfileId;
  deleteButton.disabled = !selectedId;
}
async function refresh() { state = await getProfileState(); render(); await chrome.runtime.sendMessage({ type: "REFRESH_CONTEXT_MENU" }); }

if (selectedId) fill(state.profiles.find((profile) => profile.id === selectedId)); else fill({ name: "默认 COS", objectPrefix: "clips", multipartConcurrency: 20 });
render();
newButton.addEventListener("click", () => { selectedId = ""; form.reset(); fill({ name: "新建 COS", objectPrefix: "clips", multipartConcurrency: 20 }); render(); showMessage("正在新建配置", "muted"); });
form.addEventListener("submit", async (event) => { event.preventDefault(); const data = current(); const error = validateSettings(data); if (error) return showMessage(error, "warning"); const saved = await saveProfile(data); selectedId = saved.id; await refresh(); fill(saved); showMessage("配置已保存"); });
defaultButton.addEventListener("click", async () => { await setDefaultProfile(selectedId); await refresh(); showMessage("默认配置已更新"); });
deleteButton.addEventListener("click", async () => { if (!selectedId || !confirm("确定删除当前配置吗？")) return; await removeProfile(selectedId); state = await getProfileState(); selectedId = state.profiles[0]?.id || ""; if (selectedId) fill(state.profiles[0]); else form.reset(); await refresh(); showMessage("配置已删除"); });
testButton.addEventListener("click", async () => { const data = current(); const error = validateSettings(data); if (error) return showMessage(error, "warning"); testButton.disabled = true; showMessage("正在测试直连 COS...", "muted"); try { const response = await chrome.runtime.sendMessage({ type: "TEST_COS", settings: data }); if (!response?.ok) throw new Error(response?.error || "测试失败"); const saved = await saveProfile(data); selectedId = saved.id; await refresh(); fill(saved); showMessage(`连接成功：${response.result.host}/${response.result.key}`); } catch (error) { showMessage(error.message || "测试失败", "warning"); } finally { testButton.disabled = false; } });
