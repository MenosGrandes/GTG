import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = process.cwd();
const testsDir = path.join(root, "exercises", "tests", "js");
const texDir = path.join(root, "exercises", "tex", "js", "en");

const jsFiles = fs.readdirSync(testsDir).filter((f) => f.startsWith("file_") && f.endsWith(".js"));
const texFiles = fs.readdirSync(texDir).filter((f) => f.startsWith("file_") && f.endsWith(".tex"));

const jsBasenames = jsFiles.map((f) => path.basename(f, ".js"));
const texBasenames = texFiles.map((f) => path.basename(f, ".tex"));

describe("JS exercise structure", () => {
  it("All exercises have exactly 5 tests", () => {
    for (const file of jsFiles) {
      const content = fs.readFileSync(path.join(testsDir, file), "utf-8");
      const count = (content.match(/test\(/g) || []).length;
      expect(count, `${file} should have exactly 5 tests but has ${count}`).toBe(5);
    }
  });

  it("All .tex files have matching .js files", () => {
    const jsSet = new Set(jsBasenames);
    for (const name of texBasenames) {
      expect(jsSet.has(name), `${name}.tex has no matching .js file`).toBe(true);
    }
  });

  it("All .js files have matching .tex files", () => {
    const texSet = new Set(texBasenames);
    for (const name of jsBasenames) {
      expect(texSet.has(name), `${name}.js has no matching .tex file`).toBe(true);
    }
  });

  it("No duplicate function names across exercises", () => {
    const functionToFile = new Map();
    for (const file of jsFiles) {
      const content = fs.readFileSync(path.join(testsDir, file), "utf-8");
      const matches = content.match(/functions\.(\w+)/g) || [];
      const names = [...new Set(matches.map((m) => m.replace("functions.", "")))];
      for (const name of names) {
        expect(
          functionToFile.has(name),
          `Function "${name}" appears in both ${functionToFile.get(name)} and ${file}`,
        ).toBe(false);
        functionToFile.set(name, file);
      }
    }
  });
});
