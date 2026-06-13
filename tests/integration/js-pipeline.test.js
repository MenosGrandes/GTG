import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const OUTPUT_FILE = "/tmp/test_pipeline_out.js";
const MANGLED_FILE = "/tmp/test_pipeline_out.mangled.js";
const MAPPING_FILE = resolve(ROOT, "build/function_mapping_42.tex");

describe("JS Pipeline Integration", () => {
  beforeAll(() => {
    execSync(`node main.js 42 3 ${OUTPUT_FILE}`, { cwd: ROOT, stdio: "pipe" });
  });

  afterAll(() => {
    for (const f of [OUTPUT_FILE, MANGLED_FILE]) {
      if (existsSync(f)) unlinkSync(f);
    }
  });

  it("full pipeline produces valid output", () => {
    expect(existsSync(OUTPUT_FILE)).toBe(true);
    const content = readFileSync(OUTPUT_FILE, "utf-8");
    expect(content.length).toBeGreaterThan(0);
  });

  it("mangled output contains only fn_ references", () => {
    expect(existsSync(MANGLED_FILE)).toBe(true);
    const content = readFileSync(MANGLED_FILE, "utf-8");
    const refs = (content.match(/functions\.\w+/g) ?? []).filter((r) => r !== "functions.js");
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(ref).toMatch(/^functions\.fn_[0-9a-f]{8}$/);
    }
  });

  it("mapping file is generated", () => {
    expect(existsSync(MAPPING_FILE)).toBe(true);
    const content = readFileSync(MAPPING_FILE, "utf-8");
    expect(content.length).toBeGreaterThan(0);
  });

  it("obfuscator produces valid JavaScript", () => {
    let hasObfuscator = true;
    try {
      execSync("npx javascript-obfuscator --version", { cwd: ROOT, stdio: "pipe" });
    } catch {
      hasObfuscator = false;
    }

    if (!hasObfuscator) {
      return;
    }

    const obfuscatedFile = "/tmp/test_pipeline_obfuscated.js";
    try {
      execSync(`npx javascript-obfuscator ${MANGLED_FILE} --output ${obfuscatedFile}`, {
        cwd: ROOT,
        stdio: "pipe",
      });
      execSync(`node --check ${obfuscatedFile}`, { stdio: "pipe" });
    } finally {
      if (existsSync(obfuscatedFile)) unlinkSync(obfuscatedFile);
    }
  });
});
