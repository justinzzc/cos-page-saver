const DEFAULT_SETTINGS = {
  endpoint: "",
  region: "",
  secretId: "",
  secretKey: "",
  bucket: "",
  urlStyle: "virtualHosted",
  multipartConcurrency: 20,
  useAccurateModifiedTime: false,
  objectPrefix: "clips"
};

export async function readSettings() {
  const saved = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(saved.settings || {}) };
}

export async function writeSettings(settings) {
  await chrome.storage.local.set({ settings: { ...DEFAULT_SETTINGS, ...settings } });
}

export function validateSettings(settings) {
  const required = ["endpoint", "region", "secretId", "secretKey", "bucket"];
  const missing = required.filter((key) => !String(settings[key] || "").trim());
  if (missing.length) return `请填写完整的 COS 配置：${missing.join("、")}`;
  if (!/^[a-z0-9-]+-\d+$/.test(settings.bucket.trim())) {
    return "Bucket 格式通常应为 bucket-appid，例如 demo-1250000000。";
  }
  if (!/^https?:\/\//i.test(settings.endpoint.trim())) {
    return "Endpoint 需要包含 http:// 或 https://。";
  }
  return "";
}

export { DEFAULT_SETTINGS };
