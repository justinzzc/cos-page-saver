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
  const capturedAt = new Date().toISOString();
  const meta = [
    `title: ${title.replace(/\n/g, " ")}`,
    `source: ${page.url}`,
    page.byline ? `author: ${page.byline.replace(/\n/g, " ")}` : "",
    page.excerpt ? `excerpt: ${page.excerpt.replace(/\n/g, " ")}` : "",
    `captured_at: ${capturedAt}`
  ].filter(Boolean).join("\n");
  return `---\n${meta}\n---\n\n# ${title}\n\n${page.markdown || page.textContent || "页面没有可保存的正文内容。"}\n`;
}

export function makeObjectKey(title, date = new Date()) {
  // COS browser-side signing is kept ASCII-only so Unicode path normalization cannot alter the signature.
  const safeTitle = title.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 80) || "page";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `clips/${yyyy}/${mm}/${dd}/${safeTitle}-${date.getTime()}.md`;
}
