import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const root = join(import.meta.dirname, "..", "..");
const exercisesDir = join(root, "exercises", "tests");
const mangledPath = join(root, "output", "tests", "main.mangled.js");
const functionsTestPath = join(root, "output", "tests", "functions.test.js");
const pdfPath = join(root, "output", "pdf", "main.pdf");

function collectFunctionNames() {
  const names = new Set();
  const files = readdirSync(exercisesDir).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const content = readFileSync(join(exercisesDir, file), "utf8");
    const matches = content.matchAll(/functions\.(\w+)/g);
    for (const m of matches) names.add(m[1]);
  }
  return names;
}

describe("Anti-cheat mechanisms", () => {
  beforeAll(() => {
    if (!existsSync(mangledPath) || !existsSync(functionsTestPath)) {
      execSync("make compile_tests SEED=1 COUNT=3 UV=true", { cwd: root, stdio: "pipe" });
    }
  });

  it("no original function names in mangled output", () => {
    const names = collectFunctionNames();
    const mangled = readFileSync(mangledPath, "utf8");
    for (const name of names) {
      const regex = new RegExp(`\\b${name}\\b`);
      expect(mangled).not.toMatch(regex);
    }
  });

  it("integrity check catches tampering", () => {
    const content = readFileSync(functionsTestPath, "utf8");
    const firstNewline = content.indexOf("\n");
    const afterHeader = content.slice(firstNewline + 1);
    // Find a position inside a string literal to tamper safely (won't cause syntax error)
    const strMatch = afterHeader.match(/'\\x[0-9A-Fa-f]{2}/);
    const tamperOffset = firstNewline + 1 + strMatch.index + 4; // modify hex digit inside string
    const tampered =
      content.slice(0, tamperOffset) +
      (content[tamperOffset] === "0" ? "1" : "0") +
      content.slice(tamperOffset + 1);
    const tmpFile = join(tmpdir(), `tampered-${Date.now()}.js`);
    try {
      writeFileSync(tmpFile, tampered);
      execSync(`node ${tmpFile}`, { encoding: "utf8", stdio: "pipe" });
      expect.fail("Should have thrown");
    } catch (e) {
      if (e.message === "Should have thrown") throw e;
      expect(e.stderr ?? e.message).toContain("Integrity check failed");
    } finally {
      if (existsSync(tmpFile)) unlinkSync(tmpFile);
    }
  });

  it("all strings encrypted in obfuscated output", () => {
    const content = readFileSync(functionsTestPath, "utf8");
    const descriptionPattern = /['"][A-Z][a-zA-Z]+ - [a-z]/;
    expect(content).not.toMatch(descriptionPattern);
  });

  it("PDF text extraction yields garbage", () => {
    if (!existsSync(pdfPath)) return; // PDF not available in this environment
    try {
      const text = execSync(`pdftotext ${pdfPath} -`, { encoding: "utf8", stdio: "pipe" });
      expect(text).not.toMatch(/fn_/);
      expect(text).not.toMatch(/Description/);
      expect(text).not.toMatch(/class/);
    } catch (e) {
      if (e.stderr?.includes("not found") || e.stderr?.includes("No such file")) {
        return; // pdftotext not installed, skip gracefully
      }
      throw e;
    }
  });
});
