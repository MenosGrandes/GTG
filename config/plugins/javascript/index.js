import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { LanguagePlugin } from "../../core/js/plugin.js";
import { createMapping, applyMapping } from "../../core/js/obfuscation.js";
import { saveMapping } from "../../core/js/latex_exporter.js";

const JS_REPLACERS = [
  (code, orig, obf) => code.replace(new RegExp(`functions\\.${orig}\\b`, "g"), `functions.${obf}`),
  (code, orig, obf) => code.replace(new RegExp(`\\b${orig}\\b`, "g"), obf),
];

export class JavaScriptPlugin extends LanguagePlugin {
  get extension() {
    return ".js";
  }
  //MenosGrandes  this will not catch if a function have a intiger in it's name right?
  // Latex itself forbids a definition of 'command' with a integer in names. So I have to also block it.
  get namePattern() {
    return /functions\.([A-Za-z]+)/g;
  }
  get supportsObfuscation() {
    return true;
  }

  getUtilsPath() {
    return join("config", "plugins", "javascript", "utils.js");
  }
  getTestsDir() {
    return "exercises/tests/js";
  }

  extractNames(content) {
    const names = new Set();
    for (const m of content.matchAll(this.namePattern)) names.add(m[1]);
    return [...names];
  }

  concatenate(files, testsDir, utilsPath, outputPath) {
    if (!existsSync(utilsPath)) throw new Error(`Utils file not found: ${utilsPath}`);
    const parts = [readFileSync(utilsPath, "utf8")];
    for (const file of files) parts.push(readFileSync(join(testsDir, file), "utf8"));
    writeFileSync(outputPath, parts.join("\n"));
  }

  obfuscate(seed, inputPath, outputPath, mappingPath, { texDir, selectedFiles } = {}) {
    const code = readFileSync(inputPath, "utf8");
    const utilsContent = readFileSync(this.getUtilsPath(), "utf8");
    const testCode = code.slice(utilsContent.length);
    const names = this.#extractAllNames(testCode, texDir, selectedFiles);
    const mapping = createMapping(seed, names, "fn_");
    const mangledCode = utilsContent + applyMapping(testCode, mapping, JS_REPLACERS);
    writeFileSync(outputPath, mangledCode);
    saveMapping(mapping, mappingPath);
    return mapping;
  }

  #extractAllNames(code, texDir, selectedFiles) {
    const names = new Set();

    for (const m of code.matchAll(/test\s*\(\s*['"]([\w]+)['"]/g)) {
      if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
    }
    for (const m of code.matchAll(/functions\.(\w+)/g)) {
      if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
    }
    const exportsBlock = code.match(/module\.exports\s*=\s*\{([^}]+)\}/s);
    if (exportsBlock) {
      for (const m of exportsBlock[1].matchAll(/(\w+)(?:\s*[:,])/g)) {
        if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
      }
    }
    for (const m of code.matchAll(/module\.exports\.(\w+)\s*=/g)) {
      if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
    }

    if (texDir && selectedFiles) {
      for (const file of selectedFiles) {
        const texFile = join(texDir, file.replace(this.extension, ".tex"));
        if (existsSync(texFile)) {
          const texContent = readFileSync(texFile, "utf8");
          for (const m of texContent.matchAll(/\\func\{([^}]+)\}/g)) {
            if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
          }
        }
      }
    }

    for (const name of names) {
      if (!/^[A-Za-z]+$/.test(name)) {
        throw new Error(`Function name '${name}' is forbidden. Use letters only.`);
      }
    }
    return [...names].sort();
  }
}
