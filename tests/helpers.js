import { mkdirSync, writeFileSync, unlinkSync, existsSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

export const ROOT = resolve(import.meta.dirname, "..");
export const CONFIG_PATH = resolve(ROOT, ".gtgrc");
export const BUILD_DIR = resolve(ROOT, "build");
export const OUTPUT_DIR = resolve(ROOT, "output/tests");

/**
 * Creates a temporary context for plugin unit tests (obfuscate, concatenate).
 * @param {string} prefix - Temp dir prefix (e.g. 'jsx-test')
 * @param {string} extension - File extension (e.g. '.jsx')
 */
export function createTmpContext(prefix, extension) {
  const tmpDir = join(tmpdir(), `${prefix}-${Date.now()}`);

  function setup(code) {
    mkdirSync(tmpDir, { recursive: true });
    const input = join(tmpDir, `input${extension}`);
    const output = join(tmpDir, `output${extension}`);
    const mapping = join(tmpDir, "mapping.tex");
    writeFileSync(input, code);
    return { input, output, mapping };
  }

  function cleanup() {
    for (const f of [`input${extension}`, `output${extension}`, "mapping.tex"]) {
      const p = join(tmpDir, f);
      if (existsSync(p)) unlinkSync(p);
    }
  }

  return { tmpDir, setup, cleanup };
}

/**
 * Creates a pipeline integration test context.
 * Handles config backup/restore and directory setup.
 * @param {string} language - Plugin language name
 * @param {object} options
 * @param {boolean} options.mangled - Enable mangling
 * @param {string} options.args - Args to pass to main.js after seed/count (e.g. "'{1,2},{2,1}'")
 * @param {number} options.seed - Seed value (default 42)
 * @param {number} options.count - Exercise count (default 3)
 */
export function createPipelineContext(
  language,
  { mangled = true, args, seed = 42, count = 3, extension = ".jsx" } = {},
) {
  let originalConfig;
  const outputFile = resolve(OUTPUT_DIR, `main${extension}`);
  const mangledFile = resolve(OUTPUT_DIR, `main.mangled${extension}`);
  const mappingFile = resolve(BUILD_DIR, `function_mapping_${seed}.tex`);

  function setupPipeline() {
    originalConfig = readFileSync(CONFIG_PATH, "utf8");
    const config = JSON.parse(originalConfig);
    config.language = language;
    config.mangled = mangled;
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    if (existsSync(BUILD_DIR)) rmSync(BUILD_DIR, { recursive: true, force: true });
    if (existsSync(OUTPUT_DIR)) rmSync(OUTPUT_DIR, { recursive: true, force: true });
    mkdirSync(BUILD_DIR, { recursive: true });
    mkdirSync(OUTPUT_DIR, { recursive: true });
    execSync(`node main.js ${seed} ${count} '${outputFile}' ${args}`, { cwd: ROOT, stdio: "pipe" });
  }

  function teardownPipeline() {
    writeFileSync(CONFIG_PATH, originalConfig);
  }

  return {
    ROOT,
    CONFIG_PATH,
    BUILD_DIR,
    OUTPUT_DIR,
    outputFile,
    mangledFile,
    mappingFile,
    seed,
    setupPipeline,
    teardownPipeline,
  };
}
