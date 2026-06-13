import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { LanguagePlugin } from "../../core/js/plugin.js";
import { createMapping, applyMapping } from "../../core/js/obfuscation.js";
import { saveMapping } from "../../core/js/latex_exporter.js";

const PY_REPLACERS = [(code, orig, obf) => code.replace(new RegExp(`\\b${orig}\\b`, "g"), obf)];

export class PythonPlugin extends LanguagePlugin {
  get extension() {
    return ".py";
  }
  get namePattern() {
    return /class\s+([A-Za-z]+)/g;
  }
  get supportsObfuscation() {
    return true;
  }

  getUtilsPath() {
    return join("config", "plugins", "python", "utils.py");
  }
  getTestsDir() {
    return "exercises/tests/python";
  }

  extractNames(content) {
    const names = new Set();
    for (const m of content.matchAll(this.namePattern)) names.add(m[1]);
    return [...names];
  }

  concatenate(files, testsDir, utilsPath, outputPath) {
    const parts = [];
    if (existsSync(utilsPath)) parts.push(readFileSync(utilsPath, "utf8"));
    for (const file of files) parts.push(readFileSync(join(testsDir, file), "utf8"));
    writeFileSync(outputPath, parts.join("\n\n"));
  }

  obfuscate(seed, inputPath, outputPath, mappingPath) {
    const code = readFileSync(inputPath, "utf8");
    const names = [...new Set([...code.matchAll(this.namePattern)].map((m) => m[1]))].sort();
    const mapping = createMapping(seed, names, "cls_");
    const result = applyMapping(code, mapping, PY_REPLACERS);
    writeFileSync(outputPath, result);
    saveMapping(mapping, mappingPath);
    return mapping;
  }
}
