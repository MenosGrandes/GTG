import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createPipelineContext, BUILD_DIR, OUTPUT_DIR } from "../../helpers.js";

const ctx = createPipelineContext("jsx", { args: "'{1,1},{2,1},{3,1}'" });

describe("JSX Pipeline Integration", () => {
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
    const names = [...original.matchAll(/import\s+([A-Z]\w*)\s+from/g)].map((m) => m[1]);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(mangled).not.toContain(name);
    }
  });

  it("generates mapping file with all components", () => {
    expect(existsSync(ctx.mappingFile)).toBe(true);
    const content = readFileSync(ctx.mappingFile, "utf8");
    expect(content).toMatch(/\\newcommand/);
    expect(content).toMatch(/Cmp[0-9a-f]{8}/);
    const commands = content.match(/\\newcommand/g);
    expect(commands.length).toBeGreaterThanOrEqual(1);
  });

  it("mangled output is valid JSX (has imports and tags)", () => {
    const content = readFileSync(ctx.mangledFile, "utf8");
    expect(content).toContain('from "@testing-library/react"');
    expect(content).toMatch(/<Cmp[0-9a-f]{8}[\s/>]/);
    expect(content).toContain("test(");
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
    execSync(`node main.js 42 '${ctx.outputFile}' '{1,1},{2,1},{3,1}'`, {
      cwd: ctx.ROOT,
      stdio: "pipe",
    });
    const mangled2 = readFileSync(ctx.mangledFile, "utf8");
    expect(mangled1).toBe(mangled2);
  });

  it("SWC transpiles mangled JSX to valid CJS", () => {
    const swc = resolve(ctx.ROOT, "config/plugins/shared/node_modules/.bin/swc");
    const outFile = resolve(OUTPUT_DIR, "main.mangled.js");
    execSync(
      `${swc} ${ctx.mangledFile} --out-file ${outFile} --config-file config/plugins/jsx/.swcrc --no-swcrc`,
      {
        cwd: ctx.ROOT,
        stdio: "pipe",
      },
    );
    expect(existsSync(outFile)).toBe(true);
    const cjs = readFileSync(outFile, "utf8");
    expect(cjs).toContain('"use strict"');
    expect(cjs).toContain('require("react/jsx-runtime")');
    expect(cjs).not.toMatch(/<[A-Z]/);
  });

  it("obfuscator produces valid output from transpiled CJS", () => {
    const cjsFile = resolve(OUTPUT_DIR, "main.mangled.js");
    const obfFile = resolve(OUTPUT_DIR, "functions.test.js");
    const obfuscator = resolve(
      ctx.ROOT,
      "config/plugins/shared/node_modules/.bin/javascript-obfuscator",
    );
    execSync(
      `${obfuscator} --config config/plugins/jsx/obfuscator_config.json ${cjsFile} --output ${obfFile}`,
      {
        cwd: ctx.ROOT,
        stdio: "pipe",
      },
    );
    expect(existsSync(obfFile)).toBe(true);
    const content = readFileSync(obfFile, "utf8");
    expect(content.length).toBeGreaterThan(1000);
    execSync(`node --check ${obfFile}`, { stdio: "pipe" });
  });
});
