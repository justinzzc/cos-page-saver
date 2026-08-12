import { formatChinaTime, makeObjectKey } from "./markdown.js";

const key = makeObjectKey("基于https国密算法构建安全数据传输链路", new Date("2026-08-12T00:00:00Z"));
if (!key.startsWith("clips/2026/08/12/基于https国密算法构建安全数据传输链路-") || !key.endsWith(".md")) throw new Error(key);
if (formatChinaTime(new Date("2026-08-12T00:00:00Z")) !== "2026-08-12 08:00:00+08:00") throw new Error(formatChinaTime(new Date("2026-08-12T00:00:00Z")));
console.log(key);
