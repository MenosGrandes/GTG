import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, CONFIG_PATH, BUILD_DIR, OUTPUT_DIR } from "../../helpers.js";

let originalConfig;

describe("JavaScript Full Pipeline (justfile)", () => {
  beforeAll(() => {
    originalConfig = readFileSync(CONFIG_PATH, "utf8");
    const config = JSON.parse(originalConfig);
    config.language = "javascript";
    config.mangled = true;
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    if (existsSync(BUILD_DIR)) rmSync(BUILD_DIR, { recursive: true, force: true });
    if (existsSync(resolve(ROOT, "output")))
      rmSync(resolve(ROOT, "output"), { recursive: true, force: true });
    mkdirSync(BUILD_DIR, { recursive: true });
    mkdirSync(OUTPUT_DIR, { recursive: true });
    execSync("just compile-tests", {
      cwd: ROOT,
      stdio: "pipe",
      env: { ...process.env, SEED: "42", DIFFICULTY: "{1,1}" },
    });
  }, 120000);

  afterAll(() => {
    writeFileSync(CONFIG_PATH, originalConfig);
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

  it("obfuscated file has integrity check header", () => {
    const obf = resolve(OUTPUT_DIR, "functions.test.js");
    const content = readFileSync(obf, "utf8");
    const firstLine = content.split("\n")[0];
    expect(firstLine).toMatch(/^\/\/[a-f0-9]{64}$/);
  });

  it("integrity check passes (file not tampered)", async () => {
    const obf = resolve(OUTPUT_DIR, "functions.test.js");
    const content = readFileSync(obf, "utf8");
    const firstLine = content.split("\n")[0];
    const hash = firstLine.slice(2);
    const { createHash } = await import("node:crypto");
    const rest = content.slice(content.indexOf("\n") + 1);
    const actual = createHash("sha256").update(rest).digest("hex");
    expect(actual).toBe(hash);
  });

  it("removing hash line causes non-zero exit", () => {
    const obf = resolve(OUTPUT_DIR, "functions.test.js");
    const content = readFileSync(obf, "utf8");
    const withoutHash = content.slice(content.indexOf("\n") + 1);
    const tmpFile = resolve(OUTPUT_DIR, "no-hash.js");
    writeFileSync(tmpFile, withoutHash);
    try {
      execSync(`node ${tmpFile}`, { stdio: "pipe", timeout: 5000 });
      expect.fail("Should have exited non-zero");
    } catch (e) {
      if (e.message === "Should have exited non-zero") throw e;
      expect(e.status).not.toBe(0);
    } finally {
      if (existsSync(tmpFile)) unlinkSync(tmpFile);
    }
  });

  it("wrong hash causes non-zero exit", () => {
    const obf = resolve(OUTPUT_DIR, "functions.test.js");
    const content = readFileSync(obf, "utf8");
    const tampered =
      "//0000000000000000000000000000000000000000000000000000000000000000\n" +
      content.slice(content.indexOf("\n") + 1);
    const tmpFile = resolve(OUTPUT_DIR, "wrong-hash.js");
    writeFileSync(tmpFile, tampered);
    try {
      execSync(`node ${tmpFile}`, { stdio: "pipe", timeout: 5000 });
      expect.fail("Should have exited non-zero");
    } catch (e) {
      if (e.message === "Should have exited non-zero") throw e;
      expect(e.status).not.toBe(0);
    } finally {
      if (existsSync(tmpFile)) unlinkSync(tmpFile);
    }
  });

  it("integrity logic is not visible as plaintext in obfuscated output", () => {
    const obf = resolve(OUTPUT_DIR, "functions.test.js");
    const content = readFileSync(obf, "utf8");
    // The integrity code should be buried in obfuscation, not readable
    expect(content).not.toContain("Integrity check");
    expect(content).not.toContain("process.exit(1)");
    expect(content).not.toContain('createHash("sha256")');
    expect(content).not.toContain("readFileSync(__filename");
    expect(content).not.toContain('indexOf("\\n")');
  });

  it("no original function names in obfuscated output", () => {
    const mangled = resolve(OUTPUT_DIR, "main.mangled.js");
    const obf = resolve(OUTPUT_DIR, "functions.test.js");
    const mangledContent = readFileSync(mangled, "utf8");
    const obfContent = readFileSync(obf, "utf8");
    // Extract fn_ names from mangled file to verify they exist
    const fnNames = [...mangledContent.matchAll(/functions\.(fn_[a-f0-9]{8})/g)].map((m) => m[1]);
    expect(fnNames.length).toBeGreaterThan(0);
    // Original test("name" patterns should not be readable in obfuscated output
    // (string array encoding converts them to base64)
    const originalNames = [...mangledContent.matchAll(/test\s*\(\s*['"]([^'"]+)['"]/g)].map(
      (m) => m[1],
    );
    for (const name of originalNames.slice(0, 3)) {
      expect(obfContent).not.toContain(name);
    }
  });
});
