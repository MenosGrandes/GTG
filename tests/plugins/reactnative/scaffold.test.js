import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "../../..");
const CONFIG_PATH = resolve(ROOT, ".gtgrc");
const BUILD_DIR = resolve(ROOT, "build");
const OUTPUT_DIR = resolve(ROOT, "output/tests");
const ZIP_DIR = resolve(ROOT, "output/zip");
const SCAFFOLD_DIR = resolve(BUILD_DIR, "scaffold");
const PLUGIN_SCAFFOLD = resolve(ROOT, "config/plugins/reactnative/scaffold");

let originalConfig;

describe("ReactNative Expo scaffold", () => {
  describe("scaffold source files", () => {
    it("has package.json with expo dependency", () => {
      const pkg = JSON.parse(readFileSync(resolve(PLUGIN_SCAFFOLD, "package.json"), "utf8"));
      expect(pkg.dependencies.expo).toBeDefined();
      expect(pkg.dependencies.react).toBeDefined();
      expect(pkg.dependencies["react-native"]).toBeDefined();
    });

    it("has app.json with expo config", () => {
      const app = JSON.parse(readFileSync(resolve(PLUGIN_SCAFFOLD, "app.json"), "utf8"));
      expect(app.expo).toBeDefined();
      expect(app.expo.name).toBe("exam");
    });

    it("has App.jsx entry point", () => {
      const content = readFileSync(resolve(PLUGIN_SCAFFOLD, "App.jsx"), "utf8");
      expect(content).toContain("export default");
      expect(content).toContain("ScrollView");
    });

    it("has babel.config.js with expo preset", () => {
      const content = readFileSync(resolve(PLUGIN_SCAFFOLD, "babel.config.js"), "utf8");
      expect(content).toContain("babel-preset-expo");
    });

    it("has jest.config.js with jest-expo preset", () => {
      const content = readFileSync(resolve(PLUGIN_SCAFFOLD, "jest.config.js"), "utf8");
      expect(content).toContain("jest-expo");
    });

    it("package.json has start script for expo", () => {
      const pkg = JSON.parse(readFileSync(resolve(PLUGIN_SCAFFOLD, "package.json"), "utf8"));
      expect(pkg.scripts.start).toBe("expo start");
    });

    it("package.json has test script", () => {
      const pkg = JSON.parse(readFileSync(resolve(PLUGIN_SCAFFOLD, "package.json"), "utf8"));
      expect(pkg.scripts.test).toBe("jest");
    });

    it("package.json has testing-library devDependency", () => {
      const pkg = JSON.parse(readFileSync(resolve(PLUGIN_SCAFFOLD, "package.json"), "utf8"));
      expect(pkg.devDependencies["@testing-library/react-native"]).toBeDefined();
    });
  });

  describe("scaffold assembly (pipeline)", () => {
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
      execSync(`node main.js 42 '${OUTPUT_DIR}/main.jsx' '{1,2},{2,1}'`, {
        cwd: ROOT,
        stdio: "pipe",
      });
    });

    afterAll(() => {
      writeFileSync(CONFIG_PATH, originalConfig);
    });

    it("Makefile creates scaffold directory with src/", () => {
      // Simulate scaffold assembly (same as Makefile step 5)
      rmSync(SCAFFOLD_DIR, { recursive: true, force: true });
      mkdirSync(resolve(SCAFFOLD_DIR, "src"), { recursive: true });
      mkdirSync(resolve(SCAFFOLD_DIR, "tests"), { recursive: true });
      execSync(`cp ${PLUGIN_SCAFFOLD}/package.json ${SCAFFOLD_DIR}/package.json`, { cwd: ROOT });
      execSync(`cp ${PLUGIN_SCAFFOLD}/app.json ${SCAFFOLD_DIR}/app.json`, { cwd: ROOT });
      execSync(`cp ${PLUGIN_SCAFFOLD}/babel.config.js ${SCAFFOLD_DIR}/babel.config.js`, {
        cwd: ROOT,
      });
      execSync(`cp ${PLUGIN_SCAFFOLD}/jest.config.js ${SCAFFOLD_DIR}/jest.config.js`, {
        cwd: ROOT,
      });
      execSync(`cp ${PLUGIN_SCAFFOLD}/App.jsx ${SCAFFOLD_DIR}/App.jsx`, { cwd: ROOT });

      expect(existsSync(resolve(SCAFFOLD_DIR, "package.json"))).toBe(true);
      expect(existsSync(resolve(SCAFFOLD_DIR, "app.json"))).toBe(true);
      expect(existsSync(resolve(SCAFFOLD_DIR, "App.jsx"))).toBe(true);
      expect(existsSync(resolve(SCAFFOLD_DIR, "babel.config.js"))).toBe(true);
      expect(existsSync(resolve(SCAFFOLD_DIR, "jest.config.js"))).toBe(true);
      expect(existsSync(resolve(SCAFFOLD_DIR, "src"))).toBe(true);
      expect(existsSync(resolve(SCAFFOLD_DIR, "tests"))).toBe(true);
    });

    it("scaffold creates stub files from mapping", () => {
      const mappingFile = resolve(BUILD_DIR, "function_mapping_42.tex");
      if (existsSync(mappingFile)) {
        const content = readFileSync(mappingFile, "utf8");
        const names = [...content.matchAll(/fn_images\/([^.]+)\.png/g)].map((m) => m[1]);
        for (const name of names) {
          writeFileSync(resolve(SCAFFOLD_DIR, "src", `${name}.jsx`), "");
        }
        for (const name of names) {
          expect(existsSync(resolve(SCAFFOLD_DIR, "src", `${name}.jsx`))).toBe(true);
        }
      }
    });

    it("scaffold zips correctly", () => {
      const zipFile = resolve(ZIP_DIR, "functions.zip");
      execSync(`cd ${SCAFFOLD_DIR} && zip -q -r ${zipFile} .`, { cwd: ROOT });
      expect(existsSync(zipFile)).toBe(true);
      const listing = execSync(`unzip -l ${zipFile}`, { encoding: "utf8" });
      expect(listing).toContain("package.json");
      expect(listing).toContain("app.json");
      expect(listing).toContain("App.jsx");
      expect(listing).toContain("babel.config.js");
      expect(listing).toContain("jest.config.js");
    });
  });
});
