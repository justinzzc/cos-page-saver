const DEFAULT_SETTINGS = {
  endpoint: "", region: "", secretId: "", secretKey: "", bucket: "",
  urlStyle: "virtualHosted", multipartConcurrency: 20,
  useAccurateModifiedTime: false, objectPrefix: "clips"
};

function profileId() {
  return crypto.randomUUID ? crypto.randomUUID() : `profile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeSettings(settings = {}) {
  return { ...DEFAULT_SETTINGS, ...settings };
}

function normalizeProfile(profile = {}) {
  return { id: profile.id || profileId(), name: String(profile.name || "未命名 COS").trim() || "未命名 COS", ...normalizeSettings(profile) };
}

async function readProfileState() {
  const saved = await chrome.storage.local.get(["profiles", "defaultProfileId", "lastUsedProfileId", "settings"]);
  if (Array.isArray(saved.profiles)) {
    const profiles = saved.profiles.map(normalizeProfile);
    const defaultProfileId = profiles.some((profile) => profile.id === saved.defaultProfileId) ? saved.defaultProfileId : profiles[0]?.id || "";
    const lastUsedProfileId = profiles.some((profile) => profile.id === saved.lastUsedProfileId) ? saved.lastUsedProfileId : "";
    return { profiles, defaultProfileId, lastUsedProfileId };
  }
  if (saved.settings && ["endpoint", "region", "secretId", "secretKey", "bucket"].every((key) => String(saved.settings[key] || "").trim())) {
    const migrated = normalizeProfile({ ...saved.settings, name: "默认 COS" });
    const state = { profiles: [migrated], defaultProfileId: migrated.id, lastUsedProfileId: "" };
    await chrome.storage.local.set(state);
    return state;
  }
  return { profiles: [], defaultProfileId: "", lastUsedProfileId: "" };
}

async function writeProfileState(state) {
  await chrome.storage.local.set({
    profiles: state.profiles.map(normalizeProfile),
    defaultProfileId: state.defaultProfileId || "",
    lastUsedProfileId: state.lastUsedProfileId || ""
  });
}

export async function getProfileState() {
  return readProfileState();
}

export async function getProfile(id) {
  const { profiles } = await readProfileState();
  return profiles.find((profile) => profile.id === id) || null;
}

export async function getDefaultProfile() {
  const state = await readProfileState();
  return state.profiles.find((profile) => profile.id === state.defaultProfileId) || null;
}

export async function saveProfile(profile) {
  const state = await readProfileState();
  const existing = state.profiles.find((item) => item.id === profile.id);
  const saved = normalizeProfile({ ...(existing || {}), ...profile, id: profile.id || profileId() });
  const index = state.profiles.findIndex((item) => item.id === saved.id);
  if (index === -1) state.profiles.push(saved); else state.profiles[index] = saved;
  if (!state.defaultProfileId) state.defaultProfileId = saved.id;
  await writeProfileState(state);
  return saved;
}

export async function removeProfile(id) {
  const state = await readProfileState();
  state.profiles = state.profiles.filter((profile) => profile.id !== id);
  if (state.defaultProfileId === id) state.defaultProfileId = state.profiles[0]?.id || "";
  if (state.lastUsedProfileId === id) state.lastUsedProfileId = "";
  await writeProfileState(state);
  return state;
}

export async function setDefaultProfile(id) {
  const state = await readProfileState();
  if (!state.profiles.some((profile) => profile.id === id)) throw new Error("找不到要设为默认的 COS 配置。");
  state.defaultProfileId = id;
  await writeProfileState(state);
}

export async function setLastUsedProfile(id) {
  const state = await readProfileState();
  if (!state.profiles.some((profile) => profile.id === id)) return;
  state.lastUsedProfileId = id;
  await writeProfileState(state);
}

export async function readSettings() {
  return (await getDefaultProfile()) || normalizeSettings();
}

export async function writeSettings(settings) {
  const current = await getDefaultProfile();
  return saveProfile({ ...(current || { name: "默认 COS" }), ...settings, id: current?.id });
}

export function validateSettings(settings) {
  const required = ["endpoint", "region", "secretId", "secretKey", "bucket"];
  const missing = required.filter((key) => !String(settings[key] || "").trim());
  if (missing.length) return `请填写完整的 COS 配置：${missing.join("、")}`;
  if (!/^[a-z0-9-]+-\d+$/.test(settings.bucket.trim())) return "Bucket 格式通常应为 bucket-appid，例如 demo-1250000000。";
  if (!/^https?:\/\//i.test(settings.endpoint.trim())) return "Endpoint 需要包含 http:// 或 https://。";
  return "";
}

export { DEFAULT_SETTINGS };
