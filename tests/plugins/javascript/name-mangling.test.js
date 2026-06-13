import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function createMapping(seed, names) {
  const mapping = {};
  const existing = new Set();
  for (const name of names) {
    for (let attempt = 0; attempt < 1000; attempt++) {
      const hash = createHash("sha256")
        .update(`${seed}_${name}_${seed}_${attempt}`)
        .digest("hex")
        .substring(0, 8);
      const obf = `fn_${hash}`;
      if (!existing.has(obf)) {
        mapping[name] = obf;
        existing.add(obf);
        break;
      }
    }
  }
  return mapping;
}

function applyMapping(code, mapping) {
  let result = code;
  const sorted = Object.entries(mapping).sort((a, b) => b[0].length - a[0].length);
  for (const [original, obfuscated] of sorted) {
    result = result
      .replace(new RegExp(`functions\\.${original}\\b`, "g"), `functions.${obfuscated}`)
      .replace(new RegExp(`\\b${original}\\b`, "g"), obfuscated);
  }
  return result;
}

describe("Name Mangling", () => {
  it("mapping produces fn_ prefixed 8-char hex names", () => {
    const names = ["Alpha", "Beta", "Gamma", "Delta"];
    const mapping = createMapping(99, names);

    for (const value of Object.values(mapping)) {
      expect(value).toMatch(/^fn_[0-9a-f]{8}$/);
    }
  });

  it("no hash collisions", () => {
    const names = Array.from(
      { length: 210 },
      (_, i) => `Name${String.fromCharCode(65 + (i % 26))}${i}`,
    );
    const mapping = createMapping(42, names);
    const values = Object.values(mapping);

    expect(new Set(values).size).toBe(values.length);
  });

  it("applyMapping replaces all occurrences", () => {
    const code = `functions.Alpha(x);\nlet result = Alpha + Beta;\nfunctions.Beta();\n`;
    const mapping = createMapping(7, ["Alpha", "Beta"]);
    const result = applyMapping(code, mapping);

    expect(result).not.toContain("Alpha");
    expect(result).not.toContain("Beta");
    expect(result).toContain(`functions.${mapping.Alpha}`);
    expect(result).toContain(mapping.Beta);
  });

  it("longest names replaced first", () => {
    const code = `functions.CartItem(x);\nfunctions.Cart(y);\n`;
    const mapping = createMapping(5, ["Cart", "CartItem"]);
    const result = applyMapping(code, mapping);

    expect(result).toContain(`functions.${mapping.CartItem}`);
    expect(result).toContain(`functions.${mapping.Cart}`);
    expect(result).not.toContain("CartItem");
    expect(result).not.toContain(/\bCart\b/);
  });

  describe("obfuscate preserves utils.js content", () => {
    let tmpDir;

    beforeEach(() => {
      tmpDir = mkdtempSync(join(tmpdir(), "mangle-test-"));
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it("utils.js content is not mangled", async () => {
      const utilsContent =
        'const functions = require("./functions.js");\nfunction __mg_callN(func, N) { for (let i = 0; i < N; i++) func(); }\n';
      const testCode = 'test("Alpha", () => { functions.Alpha(); });\n';
      const inputPath = join(tmpDir, "input.js");
      const outputPath = join(tmpDir, "output.js");
      const mappingPath = join(tmpDir, "mapping.tex");

      writeFileSync(inputPath, utilsContent + testCode);

      vi.doMock("../../../config/plugins/javascript/index.js", async (importOriginal) => {
        const mod = await importOriginal();
        class TestPlugin extends mod.JavaScriptPlugin {
          getUtilsPath() {
            return join(tmpDir, "utils.js");
          }
        }
        return { JavaScriptPlugin: TestPlugin };
      });

      writeFileSync(join(tmpDir, "utils.js"), utilsContent);

      const { JavaScriptPlugin } = await import("../../../config/plugins/javascript/index.js");
      const plugin = new JavaScriptPlugin();

      // Override getUtilsPath to point to our temp utils
      plugin.getUtilsPath = () => join(tmpDir, "utils.js");

      plugin.obfuscate(42, inputPath, outputPath, mappingPath);

      const output = readFileSync(outputPath, "utf8");
      expect(output.startsWith(utilsContent)).toBe(true);
    });
  });
});
