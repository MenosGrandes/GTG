import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createPipelineContext, BUILD_DIR } from "../../helpers.js";

const ctx = createPipelineContext("reactnative", { args: "'{1,2},{2,1}'" });

describe("ReactNative Pipeline Integration", () => {
  beforeAll(ctx.setupPipeline);
  afterAll(ctx.teardownPipeline);

  it("produces concatenated output file", () => {
    expect(existsSync(ctx.outputFile)).toBe(true);
    const content = readFileSync(ctx.outputFile, "utf8");
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain("import");
    expect(content).toContain('from "../src/');
  });

  it("produces mangled output with Cmp prefix", () => {
    expect(existsSync(ctx.mangledFile)).toBe(true);
    const content = readFileSync(ctx.mangledFile, "utf8");
    expect(content).toMatch(/Cmp[0-9a-f]{8}/);
    expect(content).toMatch(/import Cmp[0-9a-f]{8} from "\.\.\//);
  });

  it("mangled output has no original component names", () => {
    const original = readFileSync(ctx.outputFile, "utf8");
    const mangled = readFileSync(ctx.mangledFile, "utf8");
    const names = [...original.matchAll(/import\s+([A-Z][A-Za-z]*)\s+from/g)].map((m) => m[1]);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(mangled).not.toContain(name);
    }
  });

  it("generates mapping file", () => {
    expect(existsSync(ctx.mappingFile)).toBe(true);
    const content = readFileSync(ctx.mappingFile, "utf8");
    expect(content).toMatch(/\\newcommand/);
    expect(content).toMatch(/Cmp[0-9a-f]{8}/);
  });

  it("shuffled files list is persisted", () => {
    const shuffledPath = resolve(BUILD_DIR, "js_shuffled_files.txt");
    expect(existsSync(shuffledPath)).toBe(true);
    const lines = readFileSync(shuffledPath, "utf8").trim().split("\n");
    expect(lines.length).toBe(3);
  });

  it("deterministic output for same seed", () => {
    const mangled1 = readFileSync(ctx.mangledFile, "utf8");
    if (existsSync(BUILD_DIR)) rmSync(BUILD_DIR, { recursive: true, force: true });
    mkdirSync(BUILD_DIR, { recursive: true });
    execSync(`node main.js 42 3 '${ctx.outputFile}' '{1,2},{2,1}'`, {
      cwd: ctx.ROOT,
      stdio: "pipe",
    });
    const mangled2 = readFileSync(ctx.mangledFile, "utf8");
    expect(mangled1).toBe(mangled2);
  });
});
