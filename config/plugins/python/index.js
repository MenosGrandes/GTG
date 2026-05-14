import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { LanguagePlugin } from "../../core/plugin.js";
import { saveMapping } from "../../core/latex_exporter.js";

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
    for (const m of content.matchAll(this.namePattern)) {
      names.add(m[1]);
    }
    return [...names];
  }

  concatenate(files, testsDir, utilsPath, outputPath) {
    const parts = [];
    if (existsSync(utilsPath)) {
      parts.push(readFileSync(utilsPath, "utf8"));
    }
    for (const file of files) {
      parts.push(readFileSync(join(testsDir, file), "utf8"));
    }
    writeFileSync(outputPath, parts.join("\n\n"));
  }

  obfuscate(seed, inputPath, outputPath, mappingPath) {
    const code = readFileSync(inputPath, "utf8");
    const names = [...new Set([...code.matchAll(this.namePattern)].map((m) => m[1]))].sort();
    const mapping = {};
    const existing = new Set();

    for (const name of names) {
      for (let attempt = 0; attempt < 1000; attempt++) {
        const hash = createHash("sha256")
          .update(`${seed}_${name}_${seed}_${attempt}`)
          .digest("hex")
          .substring(0, 8);
        const obf = `cls_${hash}`;
        if (!existing.has(obf)) {
          mapping[name] = obf;
          existing.add(obf);
          break;
        }
      }
    }

    let result = code;
    const sorted = Object.entries(mapping).sort((a, b) => b[0].length - a[0].length);
    for (const [original, obfuscated] of sorted) {
      result = result.replace(new RegExp(`\\b${original}\\b`, "g"), obfuscated);
    }

    writeFileSync(outputPath, result);
    saveMapping(mapping, mappingPath);
    return mapping;
  }
}
