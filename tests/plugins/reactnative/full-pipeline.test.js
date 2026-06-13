import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, CONFIG_PATH, BUILD_DIR, OUTPUT_DIR } from "../../helpers.js";

const ZIP_DIR = resolve(ROOT, "output/zip");
const SCAFFOLD_DIR = resolve(BUILD_DIR, "scaffold");
let originalConfig;

describe("ReactNative Full Pipeline (justfile)", () => {
  beforeAll(() => {
    originalConfig = readFileSync(CONFIG_PATH, "utf8");
    const config = JSON.parse(originalConfig);
    config.language = "reactnative";
    config.mangled = true;
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    if (existsSync(BUILD_DIR)) rmSync(BUILD_DIR, { recursive: true, force: true });
    if (existsSync(resolve(ROOT, "output")))
      rmSync(resolve(ROOT, "output"), { recursive: true, force: true });
    mkdirSync(BUILD_DIR, { recursive: true });
    mkdirSync(OUTPUT_DIR, { recursive: true });
    mkdirSync(ZIP_DIR, { recursive: true });
    execSync("just compile-tests", {
      cwd: ROOT,
      stdio: "pipe",
      env: { ...process.env, SEED: "42", COUNT: "1", DIFFICULTY: "{1,1}" },
    });
  }, 120000);

  afterAll(() => {
    writeFileSync(CONFIG_PATH, originalConfig);
  });

  it("produces transpiled CJS file (no JSX syntax)", () => {
    const cjs = resolve(OUTPUT_DIR, "main.mangled.js");
    expect(existsSync(cjs)).toBe(true);
    const content = readFileSync(cjs, "utf8");
    expect(content).toContain('"use strict"');
    expect(content).not.toMatch(/<[A-Z]/);
  });

  it("produces obfuscated output file", () => {
    const obf = resolve(OUTPUT_DIR, "functions.test.js");
    expect(existsSync(obf)).toBe(true);
    const content = readFileSync(obf, "utf8");
    expect(content.length).toBeGreaterThan(1000);
  });

  it("obfuscated file is valid JavaScript", () => {
    const obf = resolve(OUTPUT_DIR, "functions.test.js");
    execSync(`node --check ${obf}`, { stdio: "pipe" });
  });

  it("scaffold has Expo project files", () => {
    expect(existsSync(resolve(SCAFFOLD_DIR, "package.json"))).toBe(true);
    expect(existsSync(resolve(SCAFFOLD_DIR, "app.json"))).toBe(true);
    expect(existsSync(resolve(SCAFFOLD_DIR, "App.jsx"))).toBe(true);
    expect(existsSync(resolve(SCAFFOLD_DIR, "babel.config.js"))).toBe(true);
    expect(existsSync(resolve(SCAFFOLD_DIR, "jest.config.js"))).toBe(true);
    expect(existsSync(resolve(SCAFFOLD_DIR, "tests/functions.test.js"))).toBe(true);
  });

  it("scaffold has src stubs from mapping", () => {
    const mappingFile = resolve(BUILD_DIR, "function_mapping_42.tex");
    expect(existsSync(mappingFile)).toBe(true);
    const content = readFileSync(mappingFile, "utf8");
    const names = [...content.matchAll(/fn_images\/([^.]+)\.png/g)].map((m) => m[1]);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(existsSync(resolve(SCAFFOLD_DIR, "src", `${name}.jsx`))).toBe(true);
    }
  });

  it("ZIP archive is created with Expo structure", () => {
    const zip = resolve(ZIP_DIR, "functions.zip");
    expect(existsSync(zip)).toBe(true);
    const listing = execSync(`unzip -l ${zip}`, { encoding: "utf8" });
    expect(listing).toContain("package.json");
    expect(listing).toContain("app.json");
    expect(listing).toContain("App.jsx");
    expect(listing).toContain("tests/functions.test.js");
  });
});
