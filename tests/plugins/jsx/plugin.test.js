import { describe, it, expect } from "vitest";
import { JSXPlugin } from "../../../config/plugins/jsx/index.js";
import { readFileSync, writeFileSync } from "node:fs";
import { createTmpContext } from "../../helpers.js";

const plugin = new JSXPlugin();

describe("JSXPlugin.extractNames", () => {
  it("extracts component from import statement", () => {
    const code = 'import Counter from "../src/Counter";';
    expect(plugin.extractNames(code)).toContain("Counter");
  });

  it("extracts component from JSX tag", () => {
    const code = "<TodoList items={[]} />";
    expect(plugin.extractNames(code)).toContain("TodoList");
  });

  it("ignores library imports", () => {
    const code = 'import { render, screen } from "@testing-library/react";';
    expect(plugin.extractNames(code)).toEqual([]);
  });

  it("ignores lowercase tags (HTML elements)", () => {
    const code = "<div><button>Click</button></div>";
    expect(plugin.extractNames(code)).toEqual([]);
  });

  it("extracts multiple unique names", () => {
    const code = `
import Counter from "../src/Counter";
import Toggle from "../src/Toggle";
<Counter />
<Toggle />
`;
    const names = plugin.extractNames(code);
    expect(names).toContain("Counter");
    expect(names).toContain("Toggle");
    expect(names.length).toBe(2);
  });

  it("deduplicates names", () => {
    const code = `
import Counter from "../src/Counter";
<Counter />
<Counter initial={0} />
`;
    expect(plugin.extractNames(code).filter((n) => n === "Counter").length).toBe(1);
  });
});

describe("JSXPlugin.obfuscate", () => {
  const { setup, cleanup } = createTmpContext("jsx-plugin", ".jsx");

  it("replaces import path and variable", () => {
    const { input, output, mapping } = setup('import Counter from "../src/Counter";\n<Counter />');
    const map = plugin.obfuscate(42, input, output, mapping);
    const result = readFileSync(output, "utf8");
    expect(result).not.toContain("Counter");
    expect(result).toContain(map["Counter"]);
    expect(result).toMatch(/import Cmp[0-9a-f]{8} from "\.\.\//);
    cleanup();
  });

  it("replaces JSX opening and closing tags", () => {
    const { input, output, mapping } = setup(
      'import Accordion from "../src/Accordion";\n<Accordion>\n</Accordion>',
    );
    const map = plugin.obfuscate(42, input, output, mapping);
    const result = readFileSync(output, "utf8");
    expect(result).toContain(`<${map["Accordion"]}>`);
    expect(result).toContain(`</${map["Accordion"]}>`);
    cleanup();
  });

  it("replaces self-closing tag with props", () => {
    const { input, output, mapping } = setup(
      'import Toggle from "../src/Toggle";\n<Toggle active={true} />',
    );
    const map = plugin.obfuscate(42, input, output, mapping);
    const result = readFileSync(output, "utf8");
    expect(result).toContain(`<${map["Toggle"]} active={true} />`);
    cleanup();
  });

  it("replaces test description strings", () => {
    const { input, output, mapping } = setup(
      'import Timer from "../src/Timer";\ntest("Timer - starts", () => {});',
    );
    const map = plugin.obfuscate(42, input, output, mapping);
    const result = readFileSync(output, "utf8");
    expect(result).toContain(`test("${map["Timer"]} - starts"`);
    cleanup();
  });

  it("is deterministic (same seed = same output)", () => {
    const code = 'import Counter from "../src/Counter";\n<Counter />';
    const { input, output, mapping } = setup(code);
    const map1 = plugin.obfuscate(99, input, output, mapping);
    writeFileSync(input, code);
    const map2 = plugin.obfuscate(99, input, output, mapping);
    expect(map1).toEqual(map2);
    cleanup();
  });

  it("different seeds produce different mappings", () => {
    const code = 'import Counter from "../src/Counter";\n<Counter />';
    const { input, output, mapping } = setup(code);
    const map1 = plugin.obfuscate(1, input, output, mapping);
    writeFileSync(input, code);
    const map2 = plugin.obfuscate(2, input, output, mapping);
    expect(map1["Counter"]).not.toBe(map2["Counter"]);
    cleanup();
  });

  it("generates valid mapping file", () => {
    const { input, output, mapping } = setup('import Counter from "../src/Counter";\n<Counter />');
    plugin.obfuscate(42, input, output, mapping);
    const tex = readFileSync(mapping, "utf8");
    expect(tex).toMatch(/\\newcommand\{\\funcCounter\}/);
    expect(tex).toMatch(/fn_images\/Cmp[0-9a-f]{8}\.png/);
    cleanup();
  });

  it("handles multiple components without collision", () => {
    const { input, output, mapping } = setup(`
import Counter from "../src/Counter";
import Toggle from "../src/Toggle";
import Timer from "../src/Timer";
<Counter /><Toggle /><Timer />
`);
    const map = plugin.obfuscate(42, input, output, mapping);
    const values = Object.values(map);
    expect(new Set(values).size).toBe(values.length);
    cleanup();
  });

  it("longest-first prevents partial replacement", () => {
    const { input, output, mapping } = setup(`
import Todo from "../src/Todo";
import TodoList from "../src/TodoList";
<Todo /><TodoList />
`);
    const map = plugin.obfuscate(42, input, output, mapping);
    const result = readFileSync(output, "utf8");
    expect(result).toContain(`<${map["TodoList"]} />`);
    expect(result).toContain(`<${map["Todo"]} />`);
    expect(result).not.toContain("TodoList");
    expect(result).not.toContain("<Todo");
    cleanup();
  });
});
