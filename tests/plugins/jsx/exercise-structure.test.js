import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = process.cwd();
const testsDir = path.join(root, "exercises", "tests", "jsx");
const texDir = path.join(root, "exercises", "tex", "jsx", "en");

const jsxFiles = fs
  .readdirSync(testsDir)
  .filter((f) => f.startsWith("file_") && f.endsWith(".jsx"));
const texFiles = fs.readdirSync(texDir).filter((f) => f.startsWith("file_") && f.endsWith(".tex"));

const jsxBasenames = jsxFiles.map((f) => path.basename(f, ".jsx"));
const texBasenames = texFiles.map((f) => path.basename(f, ".tex"));

describe("JSX exercise structure", () => {
  it("All .tex files have matching .jsx files", () => {
    const jsxSet = new Set(jsxBasenames);
    for (const name of texBasenames) {
      expect(jsxSet.has(name), `${name}.tex has no matching .jsx file`).toBe(true);
    }
  });

  it("All .jsx files have matching .tex files", () => {
    const texSet = new Set(texBasenames);
    for (const name of jsxBasenames) {
      expect(texSet.has(name), `${name}.jsx has no matching .tex file`).toBe(true);
    }
  });

  it("All exercises have valid meta.toml", () => {
    for (const file of jsxFiles) {
      const metaPath = path.join(testsDir, file.replace(".jsx", ".meta.toml"));
      expect(fs.existsSync(metaPath), `${file} missing .meta.toml`).toBe(true);
      const content = fs.readFileSync(metaPath, "utf-8");
      expect(content).toMatch(/difficulty\s*=\s*[1-5]/);
    }
  });

  it("No duplicate component names across exercises", () => {
    const nameToFile = new Map();
    for (const file of jsxFiles) {
      const content = fs.readFileSync(path.join(testsDir, file), "utf-8");
      const imports = [...content.matchAll(/import\s+([A-Z]\w*)\s+from/g)];
      for (const [, name] of imports) {
        expect(
          nameToFile.has(name),
          `Component "${name}" appears in both ${nameToFile.get(name)} and ${file}`,
        ).toBe(false);
        nameToFile.set(name, file);
      }
    }
  });
});
