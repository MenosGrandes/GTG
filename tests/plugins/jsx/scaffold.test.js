import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../..");
const SCAFFOLD = resolve(ROOT, "config/plugins/jsx/scaffold");

describe("JSX/React scaffold", () => {
  describe("test infrastructure", () => {
    it("has package.json with react and react-dom", () => {
      const pkg = JSON.parse(readFileSync(resolve(SCAFFOLD, "package.json"), "utf8"));
      expect(pkg.dependencies.react).toBeDefined();
      expect(pkg.dependencies["react-dom"]).toBeDefined();
    });

    it("has jest config", () => {
      expect(existsSync(resolve(SCAFFOLD, "jest.config.cjs"))).toBe(true);
      const content = readFileSync(resolve(SCAFFOLD, "jest.config.cjs"), "utf8");
      expect(content).toContain("jsdom");
    });

    it("has .swcrc for jest transform", () => {
      expect(existsSync(resolve(SCAFFOLD, ".swcrc"))).toBe(true);
    });

    it("package.json has test script", () => {
      const pkg = JSON.parse(readFileSync(resolve(SCAFFOLD, "package.json"), "utf8"));
      expect(pkg.scripts.test).toBe("jest");
    });

    it("package.json has testing-library devDependencies", () => {
      const pkg = JSON.parse(readFileSync(resolve(SCAFFOLD, "package.json"), "utf8"));
      expect(pkg.devDependencies["@testing-library/react"]).toBeDefined();
      expect(pkg.devDependencies["@testing-library/jest-dom"]).toBeDefined();
    });
  });

  describe("dev server (Vite)", () => {
    it("has index.html with root div", () => {
      const html = readFileSync(resolve(SCAFFOLD, "index.html"), "utf8");
      expect(html).toContain('<div id="root"></div>');
      expect(html).toContain("src/main.jsx");
    });

    it("has src/main.jsx mounting React", () => {
      const content = readFileSync(resolve(SCAFFOLD, "src/main.jsx"), "utf8");
      expect(content).toContain("createRoot");
      expect(content).toContain("App");
    });

    it("has src/App.jsx component", () => {
      const content = readFileSync(resolve(SCAFFOLD, "src/App.jsx"), "utf8");
      expect(content).toContain("export default");
    });

    it("has vite.config.js with react plugin", () => {
      const content = readFileSync(resolve(SCAFFOLD, "vite.config.js"), "utf8");
      expect(content).toContain("@vitejs/plugin-react");
    });

    it("package.json has start script for vite", () => {
      const pkg = JSON.parse(readFileSync(resolve(SCAFFOLD, "package.json"), "utf8"));
      expect(pkg.scripts.start).toBe("vite");
    });

    it("package.json has vite devDependency", () => {
      const pkg = JSON.parse(readFileSync(resolve(SCAFFOLD, "package.json"), "utf8"));
      expect(pkg.devDependencies.vite).toBeDefined();
      expect(pkg.devDependencies["@vitejs/plugin-react"]).toBeDefined();
    });
  });
});
