import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createTmpContext } from "../../helpers.js";
import { JavaScriptPlugin } from "../../../config/plugins/javascript/index.js";

const plugin = new JavaScriptPlugin();

describe("JavaScriptPlugin.extractNames", () => {
  it("extracts component from import statement", () => {
    const code = "functions.BankAccount";
    expect(plugin.extractNames(code)).toContain("BankAccount");
  });
});

//describe("ReactNativePlugin.obfuscate", () => {
//  const { setup, cleanup } = createTmpContext("rn-plugin", ".jsx");
//
//  it("replaces import path and variable", () => {
//    const { input, output, mapping } = setup('import Clicker from "../src/Clicker";\n<Clicker />');
//    const map = plugin.obfuscate(42, input, output, mapping);
//    const result = readFileSync(output, "utf8");
//    expect(result).not.toContain("Clicker");
//    expect(result).toContain(map["Clicker"]);
//    expect(result).toMatch(/import Cmp[0-9a-f]{8} from "\.\.\//);
//    cleanup();
//  });
//
//  it("replaces JSX opening and closing tags", () => {
//    const { input, output, mapping } = setup(
//      'import Greeter from "../src/Greeter";\n<Greeter>\n</Greeter>',
//    );
//    const map = plugin.obfuscate(42, input, output, mapping);
//    const result = readFileSync(output, "utf8");
//    expect(result).toContain(`<${map["Greeter"]}>`);
//    expect(result).toContain(`</${map["Greeter"]}>`);
//    cleanup();
//  });
//
//  it("replaces self-closing tag with props", () => {
//    const { input, output, mapping } = setup(
//      'import Toggler from "../src/Toggler";\n<Toggler active={true} />',
//    );
//    const map = plugin.obfuscate(42, input, output, mapping);
//    const result = readFileSync(output, "utf8");
//    expect(result).toContain(`<${map["Toggler"]} active={true} />`);
//    cleanup();
//  });
//
//  it("replaces test description strings", () => {
//    const { input, output, mapping } = setup(
//      'import Clicker from "../src/Clicker";\ntest("Clicker - starts", () => {});',
//    );
//    const map = plugin.obfuscate(42, input, output, mapping);
//    const result = readFileSync(output, "utf8");
//    expect(result).toContain(`test("${map["Clicker"]} - starts"`);
//    cleanup();
//  });
//
//  it("is deterministic (same seed = same output)", () => {
//    const code = 'import Clicker from "../src/Clicker";\n<Clicker />';
//    const { input, output, mapping } = setup(code);
//    const map1 = plugin.obfuscate(99, input, output, mapping);
//    writeFileSync(input, code);
//    const map2 = plugin.obfuscate(99, input, output, mapping);
//    expect(map1).toEqual(map2);
//    cleanup();
//  });
//
//  it("different seeds produce different mappings", () => {
//    const code = 'import Clicker from "../src/Clicker";\n<Clicker />';
//    const { input, output, mapping } = setup(code);
//    const map1 = plugin.obfuscate(1, input, output, mapping);
//    writeFileSync(input, code);
//    const map2 = plugin.obfuscate(2, input, output, mapping);
//    expect(map1["Clicker"]).not.toBe(map2["Clicker"]);
//    cleanup();
//  });
//
//  it("generates valid mapping file", () => {
//    const { input, output, mapping } = setup('import Clicker from "../src/Clicker";\n<Clicker />');
//    plugin.obfuscate(42, input, output, mapping);
//    const tex = readFileSync(mapping, "utf8");
//    expect(tex).toMatch(/\\newcommand\{\\funcClicker\}/);
//    expect(tex).toMatch(/fn_images\/Cmp[0-9a-f]{8}\.png/);
//    cleanup();
//  });
//
//  it("handles multiple components without collision", () => {
//    const { input, output, mapping } = setup(`
//import Clicker from "../src/Clicker";
//import Toggler from "../src/Toggler";
//import Greeter from "../src/Greeter";
//<Clicker /><Toggler /><Greeter />
//`);
//    const map = plugin.obfuscate(42, input, output, mapping);
//    const values = Object.values(map);
//    expect(new Set(values).size).toBe(values.length);
//    cleanup();
//  });
//});
//
//describe("ReactNativePlugin.concatenate", () => {
//  const {
//    tmpDir: concatDir,
//    setup: setupConcat,
//    cleanup: cleanupConcat,
//  } = createTmpContext("rn-concat", ".jsx");
//
//  it("concatenates files in order", () => {
//    setupConcat("");
//    mkdirSync(concatDir, { recursive: true });
//    writeFileSync(join(concatDir, "a.jsx"), "FILE_A");
//    writeFileSync(join(concatDir, "b.jsx"), "FILE_B");
//    const output = join(concatDir, "out.jsx");
//    plugin.concatenate(["a.jsx", "b.jsx"], concatDir, null, output);
//    const result = readFileSync(output, "utf8");
//    expect(result).toBe("FILE_A\nFILE_B");
//    unlinkSync(join(concatDir, "a.jsx"));
//    unlinkSync(join(concatDir, "b.jsx"));
//    unlinkSync(output);
//    cleanupConcat();
//  });
//});
//
//describe("ReactNativePlugin properties", () => {
//  it("has .jsx extension", () => {
//    expect(plugin.extension).toBe(".jsx");
//  });
//
//  it("returns reactnative tests dir", () => {
//    expect(plugin.getTestsDir()).toBe("exercises/tests/reactnative");
//  });
//
//  it("supports obfuscation", () => {
//    expect(plugin.supportsObfuscation).toBe(true);
//  });
//
//  it("has no utils path", () => {
//    expect(plugin.getUtilsPath()).toBeNull();
//  });
//});
