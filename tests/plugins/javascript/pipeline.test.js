import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { createPipelineContext } from "../../helpers.js";

const ctx = createPipelineContext("javascript", { args: "'{3,3}'", extension: ".js" });

describe("JS Pipeline Integration", () => {
  beforeAll(ctx.setupPipeline);
  afterAll(ctx.teardownPipeline);

  it("full pipeline produces valid output", () => {
    expect(existsSync(ctx.outputFile)).toBe(true);
    const content = readFileSync(ctx.outputFile, "utf-8");
    expect(content.length).toBeGreaterThan(0);
  });

  it("mangled output contains only fn_ references", () => {
    expect(existsSync(ctx.mangledFile)).toBe(true);
    const content = readFileSync(ctx.mangledFile, "utf-8");
    const refs = (content.match(/functions\.\w+/g) ?? []).filter((r) => r !== "functions.js");
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(ref).toMatch(/^functions\.fn_[0-9a-f]{8}$/);
    }
  });

  it("mapping file is generated", () => {
    expect(existsSync(ctx.mappingFile)).toBe(true);
    const content = readFileSync(ctx.mappingFile, "utf-8");
    expect(content.length).toBeGreaterThan(0);
  });

  it("obfuscator produces valid JavaScript", () => {
    let hasObfuscator = true;
    try {
      execSync("./config/plugins/javascript/node_modules/.bin/javascript-obfuscator --version", {
        cwd: ctx.ROOT,
        stdio: "pipe",
      });
    } catch {
      hasObfuscator = false;
    }
    if (!hasObfuscator) return;

    const obfuscatedFile = "/tmp/test_pipeline_obfuscated.js";
    try {
      execSync(
        `./config/plugins/javascript/node_modules/.bin/javascript-obfuscator ${ctx.mangledFile} --output ${obfuscatedFile}`,
        {
          cwd: ctx.ROOT,
          stdio: "pipe",
        },
      );
      execSync(`node --check ${obfuscatedFile}`, { stdio: "pipe" });
    } finally {
      if (existsSync(obfuscatedFile)) unlinkSync(obfuscatedFile);
    }
  });
});
