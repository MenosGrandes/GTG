import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function saveMapping(mapping, outputPath) {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const content = Object.entries(mapping)
    .map(([orig, obf]) => {
      const escaped = obf.replace(/_/g, "\\_");
      return `\\newcommand{\\func${orig}}{\\texttt{${escaped}}}`;
    })
    .join("\n");

  writeFileSync(outputPath, content);
  return outputPath;
}
