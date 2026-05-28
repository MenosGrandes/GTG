import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function saveMapping(mapping, outputPath) {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const content = Object.entries(mapping)
    .map(([orig, obf]) => {
      return `\\newcommand{\\func${orig}}{\\raisebox{-0.2ex}{\\includegraphics[height=1.1em]{build/fn_images/${obf}.png}}}`;
    })
    .join("\n");

  writeFileSync(outputPath, content);
  return outputPath;
}
