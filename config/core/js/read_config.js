import { readFileSync } from "node:fs";
const c = JSON.parse(readFileSync("./.gtgrc", "utf8"));
process.stdout.write(`${c.directories.build} ${c.directories.output} ${c.directories.config.base}`);
