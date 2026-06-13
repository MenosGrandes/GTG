import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseMeta } from "../config/core/js/meta_parser.js";

const dir = "exercises/tests";
const files = readdirSync(dir).filter((f) => f.endsWith(".meta.toml"));
const dist = {};

for (const f of files) {
  const meta = parseMeta(readFileSync(join(dir, f), "utf8"));
  const d = meta.exercise?.difficulty ?? "?";
  dist[d] = dist[d] || [];
  dist[d].push(f.replace(".meta.toml", ""));
}

for (const level of Object.keys(dist).sort()) {
  console.log(`\nDifficulty ${level}: ${dist[level].length} exercises`);
  console.log(`  ${dist[level].sort().join(", ")}`);
}

console.log(`\nTotal: ${files.length}`);
