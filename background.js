import { readSettings, validateSettings } from "./storage.js";
import { hmacSha1, sha1 } from "./crypto.js";
import { createMarkdown, makeObjectKey } from "./markdown.js";

function normalizeEndpoint(endpoint) {
  const value = endpoint.trim();
  const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error("Endpoint 只能填写域名，例如 cos.ap-guangzhou.myqcloud.com，不要包含路径或参数。");
  return parsed.host;
}

function encodePath(path) {
  return path.split("/").map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)).join("/");
}

function encodeValue(value) {
  return encodeURIComponent(String(value));
}

async function uploadToCos(settings, key, body) {
  const endpoint = normalizeEndpoint(settings.endpoint);
  const host = settings.urlStyle === "pathStyle" ? endpoint : `${settings.bucket}.${endpoint}`;
  const path = settings.urlStyle === "pathStyle" ? `/${settings.bucket}/${key}` : `/${key}`;
  const requestPath = encodePath(path);
  const url = `https://${host}${requestPath}`;
  const start = Math.floor(Date.now() / 1000) - 60;
  const end = start + 900;
  const keyTime = `${start};${end}`;
  const signedHeaders = "";
  const httpString = `put\n${path}\n\n\n`;
  const signKey = await hmacSha1(settings.secretKey, keyTime);
  const stringToSign = `sha1\n${keyTime}\n${await sha1(httpString)}\n`;
  const signature = await hmacSha1(signKey, stringToSign);
  const auth = new URLSearchParams({
    "q-sign-algorithm": "sha1",
    "q-ak": settings.secretId,
    "q-sign-time": keyTime,
    "q-key-time": keyTime,
    "q-header-list": signedHeaders,
    "q-url-param-list": "",
    "q-signature": signature
  });
  const requestUrl = `${url}?${auth.toString()}`;
  const response = await fetch(requestUrl, { method: "PUT", body: new Blob([body], { type: "application/octet-stream" }) });
  if (!response.ok) {
    const detail = await response.text();
    const code = detail.match(/<Code>([^<]+)<\/Code>/i)?.[1];
    const message = detail.match(/<Message>([^<]+)<\/Message>/i)?.[1];
    const reason = [code, message].filter(Boolean).join(": ");
    throw new Error(`COS 上传失败（HTTP ${response.status}${reason ? `，${reason}` : ""}）。请检查密钥权限、Bucket、Endpoint 和 CORS 配置。`);
  }
  return { key, url, host, path, signedAt: keyTime };
}

async function testCosConnection(settings) {
  const prefix = String(settings.objectPrefix || "clips").replace(/^\/+|\/+$/g, "");
  return uploadToCos(settings, `${prefix}/cos-connection-test.md`, `# COS 连接测试\n\n测试时间：${new Date().toISOString()}\n`);
}

function extractPage() {
  function text(node) { return (node?.textContent || "").replace(/\s+/g, " ").trim(); }
  function firstMeta(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const value = node?.getAttribute("content")?.trim();
      if (value) return value;
    }
    return "";
  }
  function metadata() {
    const result = {
      title: firstMeta(["meta[property='og:title']", "meta[name='twitter:title']", "meta[name='title']"]),
      byline: firstMeta(["meta[name='author']", "meta[property='article:author']", "meta[name='byline']"]),
      excerpt: firstMeta(["meta[name='description']", "meta[property='og:description']", "meta[name='twitter:description']"])
    };
    for (const node of document.querySelectorAll("script[type='application/ld+json']")) {
      try {
        const parsed = JSON.parse(node.textContent || "{}");
        const entries = Array.isArray(parsed) ? parsed : parsed["@graph"] || [parsed];
        const article = entries.find((entry) => /article|newsarticle|blogposting/i.test(String(entry?.["@type"] || "")));
        if (!article) continue;
        result.title ||= article.headline || article.name || "";
        result.excerpt ||= article.description || "";
        const author = Array.isArray(article.author) ? article.author[0] : article.author;
        result.byline ||= typeof author === "string" ? author : author?.name || "";
      } catch { /* Ignore malformed page metadata. */ }
    }
    return result;
  }
  function escape(value) { return value.replace(/[\\`*_[\]{}<>]/g, "\\$&").replace(/\s+$/g, ""); }
  function imageUrl(node) {
    const source = node.getAttribute("data-src") || node.getAttribute("data-original") || node.getAttribute("data-lazy-src") || node.getAttribute("src") || node.getAttribute("srcset")?.split(",")[0]?.trim().split(" ")[0];
    if (!source || source.startsWith("data:")) return "";
    try { return new URL(source, location.href).href; } catch { return ""; }
  }
  function inline(node) {
    if (node.nodeType === Node.TEXT_NODE) return escape(node.nodeValue || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const content = [...node.childNodes].map(inline).join("");
    const tag = node.tagName.toLowerCase();
    if (tag === "strong" || tag === "b") return `**${content.trim()}**`;
    if (tag === "em" || tag === "i") return `*${content.trim()}*`;
    if (tag === "code") return `\`${content.trim()}\``;
    if (tag === "a") return `[${content.trim() || node.href}](${node.href})`;
    if (tag === "img") { const source = imageUrl(node); return source ? `![${node.alt || "图片"}](${source})` : ""; }
    if (tag === "br") return "\n";
    return content;
  }
  function toMarkdown(root) {
    const blocks = [];
    function visit(node) {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) blocks.push(`${"#".repeat(Number(tag[1]))} ${inline(node).trim()}`);
      else if (tag === "p" || tag === "blockquote") blocks.push(`${tag === "blockquote" ? "> " : ""}${inline(node).trim()}`);
      else if (tag === "pre") blocks.push("```\\n" + node.textContent.trim() + "\\n```");
      else if (tag === "ul" || tag === "ol") [...node.children].filter((child) => child.tagName.toLowerCase() === "li").forEach((item, index) => blocks.push(`${tag === "ol" ? `${index + 1}.` : "-"} ${inline(item).trim()}`));
      else if (tag === "hr") blocks.push("---");
      [...node.children].forEach(visit);
    }
    visit(root);
    return blocks.filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  function score(node) {
    const value = text(node);
    if (!value || value.length < 200) return -1;
    const links = node.querySelectorAll("a").length;
    const paragraphs = node.querySelectorAll("p").length;
    const className = `${node.id || ""} ${node.className || ""}`;
    const positive = /(article|content|正文|文章|post|entry|main|story|阅读)/i.test(className) ? 400 : 0;
    const negative = /(comment|评论|footer|header|nav|menu|sidebar|related|推荐|广告|分享)/i.test(className) ? 500 : 0;
    const linkDensity = links / Math.max(value.length / 80, 1);
    return value.length + paragraphs * 120 + positive - negative - linkDensity * 100;
  }
  const clone = document.cloneNode(true);
  clone.querySelectorAll("script,style,noscript,link,nav,header,footer,aside,form,iframe,template,button,[aria-hidden='true'],[role='navigation'],[role='complementary']").forEach((node) => node.remove());
  clone.querySelectorAll("[class*='comment' i],[class*='advert' i],[class*='recommend' i],[id*='comment' i],[id*='advert' i]").forEach((node) => node.remove());
  clone.querySelectorAll("img").forEach((node) => {
    const source = node.getAttribute("data-src") || node.getAttribute("data-original") || node.getAttribute("data-lazy-src") || node.getAttribute("src") || node.getAttribute("srcset")?.split(",")[0]?.trim().split(" ")[0];
    if (source) node.setAttribute("src", source);
  });
  const candidates = [...clone.querySelectorAll("article,main,[role='main'],section,div")].sort((a, b) => score(b) - score(a));
  const content = candidates[0] || clone.body;
  if (!content) throw new Error("无法读取当前页面内容。");
  const pageMeta = metadata();
  const title = pageMeta.title || document.title || text(content.querySelector("h1")) || "未命名页面";
  return { title, byline: pageMeta.byline, excerpt: pageMeta.excerpt, url: location.href, textContent: text(content), markdown: toMarkdown(content) };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "SAVE_PAGE" && message.type !== "TEST_COS") return false;
  (async () => {
    const settings = message.settings || await readSettings();
    const validationError = validateSettings(settings);
    if (validationError) throw new Error(validationError);
    if (message.type === "TEST_COS") return testCosConnection(settings);
    const [result] = await chrome.scripting.executeScript({ target: { tabId: message.tabId }, func: extractPage });
    const page = result?.result;
    if (!page) throw new Error("无法提取当前页面内容，请确认页面允许脚本运行。");
    const markdown = createMarkdown(page);
    const key = `${String(settings.objectPrefix || "clips").replace(/^\/+|\/+$/g, "")}/${makeObjectKey(page.title, new Date(), page.url).replace(/^clips\//, "")}`;
    return uploadToCos(settings, key, markdown);
  })().then((result) => sendResponse({ ok: true, result })).catch((error) => sendResponse({ ok: false, error: error.message || "保存失败。" }));
  return true;
});
