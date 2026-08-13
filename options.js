import { getProfileState, removeProfile, saveProfile, setDefaultProfile, validateSettings } from "./storage.js";

const form = document.querySelector("#settingsForm");
const list = document.querySelector("#profileList");
const message = document.querySelector("#message");
const testButton = document.querySelector("#testButton");
const newButton = document.querySelector("#newButton");
const defaultButton = document.querySelector("#defaultButton");
const deleteButton = document.querySelector("#deleteButton");
const editorTitle = document.querySelector("#editorTitle");
const secretInput = form.elements.secretKey;
const toggleSecretButton = document.querySelector("#toggleSecretButton");
let state = await getProfileState();
let selectedId = state.profiles[0]?.id || "";

toggleSecretButton.addEventListener("click", () => {
  const visible = secretInput.type === "text";
  secretInput.type = visible ? "password" : "text";
  toggleSecretButton.textContent = visible ? "◉" : "◎";
  toggleSecretButton.setAttribute("aria-label", visible ? "显示密钥" : "隐藏密钥");
  toggleSecretButton.title = visible ? "显示密钥" : "隐藏密钥";
});

function showMessage(text, kind = "success") { message.textContent = text; message.className = `status ${kind}`; }
function fill(profile) {
  for (const [key, value] of Object.entries(profile || {})) { const input = form.elements.namedItem(key); if (!input) continue; if (input.type === "checkbox") input.checked = Boolean(value); else input.value = value; }
  editorTitle.textContent = profile?.id ? `编辑：${profile.name}` : "新建配置";
}
function current() {
  const data = Object.fromEntries(new FormData(form));
  data.useAccurateModifiedTime = form.elements.useAccurateModifiedTime.checked;
  data.multipartConcurrency = Number(data.multipartConcurrency);
  return { ...data, id: selectedId };
}
function selectProfile(profile) { selectedId = profile.id; fill(profile); render(); showMessage(""); }
function uniqueCopyName(profile) {
  const names = new Set(state.profiles.map((item) => item.name));
  const base = `${profile.name} 副本`;
  let name = base;
  let count = 2;
  while (names.has(name)) name = `${base} ${count++}`;
  return name;
}
function actionButton(label, handler, disabled = false) {
  const button = document.createElement("button");
  button.type = "button"; button.className = "profile-action"; button.textContent = label; button.disabled = disabled;
  button.addEventListener("click", handler);
  return button;
}
function render() {
  list.replaceChildren(...state.profiles.map((profile) => {
    const item = document.createElement("article");
    item.className = `profile-item ${profile.id === selectedId ? "selected" : ""}`;
    const details = document.createElement("button");
    details.type = "button"; details.className = "profile-details";
    const heading = document.createElement("strong"); heading.textContent = profile.name;
    const badge = document.createElement("span"); badge.className = "profile-badge"; badge.textContent = profile.id === state.defaultProfileId ? "默认" : "COS";
    const meta = document.createElement("small"); meta.textContent = `${profile.bucket || "未填写 Bucket"} · ${profile.endpoint || "未填写 Endpoint"} · ${profile.objectPrefix || "clips"}`;
    details.append(heading, badge, meta); details.addEventListener("click", () => selectProfile(profile));
    const actions = document.createElement("div"); actions.className = "profile-actions";
    actions.append(
      actionButton("编辑", () => selectProfile(profile)),
      actionButton("复制", async () => { const copy = await saveProfile({ ...profile, id: "", name: uniqueCopyName(profile) }); selectedId = copy.id; await refresh(); fill(copy); showMessage(`已复制为“${copy.name}”`); }),
      actionButton("设默认", async () => { await setDefaultProfile(profile.id); await refresh(); showMessage("默认配置已更新"); }, profile.id === state.defaultProfileId),
      actionButton("删除", async () => { if (!confirm(`确定删除“${profile.name}”吗？`)) return; await removeProfile(profile.id); state = await getProfileState(); selectedId = state.profiles[0]?.id || ""; if (selectedId) fill(state.profiles[0]); else fill({ name: "新建 COS", objectPrefix: "clips", multipartConcurrency: 20 }); await refresh(); showMessage("配置已删除"); })
    );
    item.append(details, actions);
    return item;
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
deleteButton.addEventListener("click", async () => { if (!selectedId || !confirm("确定删除当前配置吗？")) return; await removeProfile(selectedId); state = await getProfileState(); selectedId = state.profiles[0]?.id || ""; if (selectedId) fill(state.profiles[0]); else fill({ name: "新建 COS", objectPrefix: "clips", multipartConcurrency: 20 }); await refresh(); showMessage("配置已删除"); });
testButton.addEventListener("click", async () => { const data = current(); const error = validateSettings(data); if (error) return showMessage(error, "warning"); testButton.disabled = true; showMessage("正在测试直连 COS...", "muted"); try { const response = await chrome.runtime.sendMessage({ type: "TEST_COS", settings: data }); if (!response?.ok) throw new Error(response?.error || "测试失败"); const saved = await saveProfile(data); selectedId = saved.id; await refresh(); fill(saved); showMessage(`连接成功：${response.result.host}/${response.result.key}`); } catch (error) { showMessage(error.message || "测试失败", "warning"); } finally { testButton.disabled = false; } });
