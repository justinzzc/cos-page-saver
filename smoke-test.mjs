import { makeObjectKey } from "./markdown.js";

const key = makeObjectKey("测试 / 页面", new Date("2026-08-12T00:00:00Z"));
if (!key.startsWith("clips/2026/08/12/page-") || !key.endsWith(".md")) throw new Error(key);
console.log(key);
