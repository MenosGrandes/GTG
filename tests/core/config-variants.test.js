import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync, existsSync, unlinkSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const CONFIG_PATH = resolve(ROOT, ".gtgrc");
const BUILD_DIR = resolve(ROOT, "build");
const SEED = "42";

let originalConfig;

beforeEach(() => {
  originalConfig = readFileSync(CONFIG_PATH, "utf8");
  const config = JSON.parse(originalConfig);
  config.language = "javascript";
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  if (existsSync(BUILD_DIR)) {
    rmSync(BUILD_DIR, { recursive: true, force: true });
  }
});

afterEach(() => {
  writeFileSync(CONFIG_PATH, originalConfig);
  if (existsSync(BUILD_DIR)) {
    rmSync(BUILD_DIR, { recursive: true, force: true });
  }
});

function setConfig(overrides) {
  const config = JSON.parse(originalConfig);
  config.language = "javascript";
  Object.assign(config, overrides);
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function runMain(n = 3) {
  const output = resolve(BUILD_DIR, "output.js");
  execSync(`node main.js ${SEED} ${output} '{3,${n}}'`, { cwd: ROOT, stdio: "pipe" });
  return output;
}

describe("config-variants", () => {
  test("mangled=true produces fn_ mapping", () => {
    setConfig({ mangled: true });
    runMain(3);
    const mappingPath = resolve(BUILD_DIR, `function_mapping_${SEED}.tex`);
    expect(existsSync(mappingPath)).toBe(true);
    const content = readFileSync(mappingPath, "utf8");
    expect(content).toMatch(/fn_[0-9a-f]{8}/);
  });

  test("mangled=false produces no mapping", () => {
    setConfig({ mangled: false });
    runMain(3);
    const mappingPath = resolve(BUILD_DIR, `function_mapping_${SEED}.tex`);
    expect(existsSync(mappingPath)).toBe(false);
  });

  test("mangled=false output has original names", () => {
    setConfig({ mangled: false });
    const output = runMain(3);
    const mangledPath = output.replace(".js", ".mangled.js");
    const content = readFileSync(mangledPath, "utf8");
    expect(content).not.toMatch(/fn_[0-9a-f]{8}/);
    expect(content).toMatch(/functions\.\w+/);
  });

  test("different count values in difficulty select correct number of files", () => {
    setConfig({ mangled: false });
    for (const count of [1, 3, 5]) {
      if (existsSync(BUILD_DIR)) {
        rmSync(BUILD_DIR, { recursive: true, force: true });
      }
      runMain(count);
      const shuffledPath = resolve(BUILD_DIR, "js_shuffled_files.txt");
      const lines = readFileSync(shuffledPath, "utf8").trim().split("\n");
      expect(lines.length).toBe(count);
    }
  });
});
