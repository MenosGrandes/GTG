import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const root = join(import.meta.dirname, "..", "..");
const mangledPath = join(root, "output", "tests", "main.mangled.js");
const functionsTestPath = join(root, "output", "tests", "functions.test.js");
const pdfPath = join(root, "output", "pdf", "main.pdf");

function collectOriginalNames() {
  const originalPath = join(root, "output", "tests", "main.js");
  if (!existsSync(originalPath)) return new Set();
  const content = readFileSync(originalPath, "utf8");
  const names = new Set();
  for (const m of content.matchAll(/(?<!["'./])functions\.(\w+)/g)) {
    if (m[1].length >= 2 && /^[A-Z]/.test(m[1]) && !m[1].startsWith("fn_")) names.add(m[1]);
  }
  return names;
}

//MenosGrandes TODO tthis is stupid
describe("Anti-cheat mechanisms", () => {
  beforeAll(() => {
    const env = { ...process.env, SEED: "1", COUNT: "1", DIFFICULTY: "{3,1}" };
    if (!existsSync(mangledPath) || !existsSync(functionsTestPath)) {
      execSync("just compile-tests", { cwd: root, stdio: "pipe", timeout: 60000, env });
    }
    if (!existsSync(pdfPath)) {
      try {
        execSync(
          'bash -c "source /app/lmod/lmod/init/bash && module load texlive/2024 && just compile-pdf"',
          { cwd: root, stdio: "pipe", timeout: 120000, env },
        );
      } catch {
        // PDF build not available in this environment
      }
    }
  });

  it("no original function names in mangled output", () => {
    const names = collectOriginalNames();
    const obfuscated = readFileSync(functionsTestPath, "utf8");
    for (const name of names) {
      const regex = new RegExp(`\\b${name}\\b`);
      expect(obfuscated).not.toMatch(regex);
    }
  });

  it("integrity check catches tampering", () => {
    const content = readFileSync(functionsTestPath, "utf8");
    const firstNewline = content.indexOf("\n");
    if (firstNewline === -1) return;
    // Tamper somewhere after the integrity header
    const tamperOffset = Math.min(firstNewline + 100, content.length - 1);
    const orig = content[tamperOffset];
    const replacement = orig === "a" ? "b" : "a";
    const tampered = content.slice(0, tamperOffset) + replacement + content.slice(tamperOffset + 1);
    const tmpFile = join(tmpdir(), `tampered-${Date.now()}.js`);
    try {
      writeFileSync(tmpFile, tampered);
      const result = execSync(`node ${tmpFile}`, {
        encoding: "utf8",
        stdio: "pipe",
        timeout: 5000,
      });
      // If node didn't crash/exit, integrity check didn't trigger — fail
      expect.fail("Tampered file should have caused non-zero exit");
    } catch (e) {
      if (e.message === "Tampered file should have caused non-zero exit") throw e;
      // Non-zero exit = integrity check worked
      expect(e.status).not.toBe(0);
    } finally {
      if (existsSync(tmpFile)) unlinkSync(tmpFile);
    }
  });

  it("all strings encrypted in obfuscated output", () => {
    const content = readFileSync(functionsTestPath, "utf8");
    // Skip the hash comment on line 1
    const code = content.slice(content.indexOf("\n") + 1);
    const descriptionPattern = /['"][A-Z][a-zA-Z]+ - [a-z]/;
    expect(code).not.toMatch(descriptionPattern);
  });

  it("PDF text extraction yields garbage", () => {
    if (!existsSync(pdfPath)) return;
    try {
      const text = execSync(`pdftotext ${pdfPath} -`, { encoding: "utf8", stdio: "pipe" });
      expect(text).not.toMatch(/fn_/);
      expect(text).not.toMatch(/Description/);
      expect(text).not.toMatch(/class/);
    } catch (e) {
      if (e.stderr?.includes("not found") || e.stderr?.includes("No such file")) return;
      if (e.stderr?.includes("Incorrect password") || e.stderr?.includes("password")) return;
      throw e;
    }
  });
});
