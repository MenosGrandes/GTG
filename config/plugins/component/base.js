import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LanguagePlugin } from "../../core/js/plugin.js";
import { createMapping, applyMapping } from "../../core/js/obfuscation.js";
import { saveMapping } from "../../core/js/latex_exporter.js";

const COMPONENT_REPLACERS = [
  (code, orig, obf) =>
    code.replace(
      new RegExp(`(import\\s+)${orig}(\\s+from\\s+['"])(\\.\\.?\\/src\\/)${orig}(['"])`, "g"),
      `$1${obf}$2$3${obf}$4`,
    ),
  (code, orig, obf) => code.replace(new RegExp(`<${orig}([ />])`, "g"), `<${obf}$1`),
  (code, orig, obf) => code.replace(new RegExp(`</${orig}>`, "g"), `</${obf}>`),
  (code, orig, obf) =>
    code.replace(new RegExp(`(test\\s*\\(\\s*)(['"])${orig}`, "g"), `$1$2${obf}`),
  (code, orig, obf) =>
    code.replace(new RegExp(`(describe\\s*\\(\\s*)(['"])${orig}`, "g"), `$1$2${obf}`),
];

export class ComponentPlugin extends LanguagePlugin {
  get extension() {
    return ".jsx";
  }
  get namePattern() {
    return /(?:import\s+(\w+)\s+from|<([A-Z][A-Za-z]*))/g;
  }
  get supportsObfuscation() {
    return true;
  }
  getUtilsPath() {
    return null;
  }

  getTestsDir() {
    throw new Error("ComponentPlugin subclass must override getTestsDir()");
  }

  extractNames(content) {
    const names = new Set();
    for (const m of content.matchAll(/import\s+([A-Z][A-Za-z]*)\s+from\s+['"]\.\.?\/src\//g))
      names.add(m[1]);
    for (const m of content.matchAll(/<([A-Z][A-Za-z]*)/g)) names.add(m[1]);
    return [...names];
  }

  concatenate(files, testsDir, utilsPath, outputPath) {
    const parts = [];
    for (const file of files) parts.push(readFileSync(join(testsDir, file), "utf8"));
    writeFileSync(outputPath, parts.join("\n"));
  }

  obfuscate(seed, inputPath, outputPath, mappingPath) {
    const code = readFileSync(inputPath, "utf8");
    const names = [
      ...new Set([
        ...[...code.matchAll(/import\s+([A-Z][A-Za-z]*)\s+from\s+['"]\.\.?\/src\//g)].map(
          (m) => m[1],
        ),
        ...[...code.matchAll(/<([A-Z][A-Za-z]*)/g)].map((m) => m[1]),
      ]),
    ]
      .filter((n) => /^[A-Za-z]+$/.test(n))
      .sort();

    const mapping = createMapping(seed, names, "Cmp");
    const result = applyMapping(code, mapping, COMPONENT_REPLACERS);
    writeFileSync(outputPath, result);
    saveMapping(mapping, mappingPath);
    return mapping;
  }
}
