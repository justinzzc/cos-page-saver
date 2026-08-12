import { formatChinaTime, makeObjectKey } from "./markdown.js";

const key = makeObjectKey("测试 / 页面", new Date("2026-08-12T00:00:00Z"), "https://example.com/articles/123");
if (!key.startsWith("clips/2026/08/12/example.com-articles-123-") || !key.endsWith(".md")) throw new Error(key);
if (formatChinaTime(new Date("2026-08-12T00:00:00Z")) !== "2026-08-12 08:00:00+08:00") throw new Error(formatChinaTime(new Date("2026-08-12T00:00:00Z")));
console.log(key);
