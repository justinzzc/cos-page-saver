function escapeText(text) {
  return text.replace(/[\\`*_[\]{}<>]/g, "\\$&").replace(/\s+$/g, "");
}

function inlineMarkdown(node) {
  if (node.nodeType === Node.TEXT_NODE) return escapeText(node.nodeValue || "");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const content = [...node.childNodes].map(inlineMarkdown).join("");
  const tag = node.tagName.toLowerCase();
  if (tag === "strong" || tag === "b") return `**${content.trim()}**`;
  if (tag === "em" || tag === "i") return `*${content.trim()}*`;
  if (tag === "code") return `\`${content.trim()}\``;
  if (tag === "a") return `[${content.trim() || node.href}](${node.href})`;
  if (tag === "img") return `![${node.alt || "图片"}](${node.src})`;
  if (["br"].includes(tag)) return "\n";
  return content;
}

export function htmlToMarkdown(root) {
  const blocks = [];
  function visit(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) blocks.push(`${"#".repeat(Number(tag[1]))} ${inlineMarkdown(node).trim()}`);
    else if (tag === "p" || tag === "blockquote") blocks.push(`${tag === "blockquote" ? "> " : ""}${inlineMarkdown(node).trim()}`);
    else if (tag === "pre") blocks.push("```\\n" + node.textContent.trim() + "\\n```");
    else if (tag === "ul" || tag === "ol") {
      [...node.children].filter((child) => child.tagName.toLowerCase() === "li").forEach((item, index) => blocks.push(`${tag === "ol" ? `${index + 1}.` : "-"} ${inlineMarkdown(item).trim()}`));
    } else if (tag === "hr") blocks.push("---");
    [...node.children].forEach(visit);
  }
  visit(root);
  return blocks.filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function createMarkdown(page) {
  const title = (page.title || "未命名页面").trim();
  const capturedAt = formatChinaTime();
  const meta = [
    `title: ${title.replace(/\n/g, " ")}`,
    `source: ${page.url}`,
    page.byline ? `author: ${page.byline.replace(/\n/g, " ")}` : "",
    page.excerpt ? `excerpt: ${page.excerpt.replace(/\n/g, " ")}` : "",
    `captured_at: ${capturedAt}`,
    "timezone: Asia/Shanghai"
  ].filter(Boolean).join("\n");
  return `---\n${meta}\n---\n\n# ${title}\n\n${page.markdown || page.textContent || "页面没有可保存的正文内容。"}\n`;
}

export function formatChinaTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}+08:00`;
}

export function makeObjectKey(title, date = new Date(), sourceUrl = "") {
  // COS browser-side signing is kept ASCII-only so Unicode path normalization cannot alter the signature.
  const asciiTitle = title.match(/[a-zA-Z0-9][a-zA-Z0-9._ -]{1,79}/g)?.join("-") || "";
  let fallback = "page";
  if (!asciiTitle && sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      fallback = `${url.hostname}${url.pathname}`.match(/[a-zA-Z0-9][a-zA-Z0-9._ -]{1,79}/g)?.join("-") || fallback;
    } catch { /* Keep generic fallback for malformed source URLs. */ }
  }
  const safeTitle = (asciiTitle || fallback).replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 80) || "page";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `clips/${yyyy}/${mm}/${dd}/${safeTitle}-${date.getTime()}.md`;
}
