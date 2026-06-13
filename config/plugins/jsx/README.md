# JSX/React Plugin

Generates obfuscated React component tests for student exams.

## Pipeline

1. **Select** exercises by difficulty from `exercises/tests/jsx/`
2. **Concatenate** selected `.jsx` test files
3. **Obfuscate names** — renames components and import paths (`Counter` → `Cmp<hash>`)
4. **SWC transpile** — converts JSX to CommonJS (`import` → `require`, JSX → `jsx()` calls)
5. **Obfuscate code** — javascript-obfuscator with control flow flattening + base64 strings
6. **Scaffold** — assembles student project (package.json, jest config, .swcrc, empty src stubs)
7. **ZIP** — packages scaffold into `functions.zip`

## Student Experience

1. Extract ZIP
2. `npm install`
3. Implement components in `src/<CmpHash>.jsx`
4. `npm test` — jest runs obfuscated tests against their components

## Dependencies

- `@swc/cli` + `@swc/core` — JSX→CJS transpilation
- `javascript-obfuscator` — code obfuscation

All installed locally in this plugin's `node_modules/`.

## Key Files

- `index.js` — JSXPlugin class (concatenate, obfuscate, extractNames)
- `Makefile.mk` — full pipeline (select → transpile → obfuscate → scaffold → zip)
- `.swcrc` — SWC config for build-time transpilation
- `obfuscator_config.json` — obfuscation settings
- `scaffold/` — template files included in student ZIP:
  - `package.json` — student deps (react, jest, @swc/jest, @testing-library)
  - `jest.config.cjs` — jest configuration
  - `.swcrc` — SWC config for student's test-time JSX transpilation

## Exercise Format

Each exercise is a `.jsx` file importing a component from `../src/<Name>`:

```jsx
import { render, screen, fireEvent } from "@testing-library/react";
import Counter from "../src/Counter";

test("Counter - increments", () => {
  render(<Counter initial={0} />);
  fireEvent.click(screen.getByRole("button", { name: /increment/i }));
  expect(screen.getByText("Count: 1")).toBeInTheDocument();
});
```

## Difficulty Levels

| Level | Requires                             |
| ----- | ------------------------------------ |
| 1     | useState, basic props                |
| 2     | Controlled inputs, derived state     |
| 3     | Multiple states, lists, conditionals |
| 4     | useReducer with multiple actions     |
| 5     | useReducer + custom hooks            |
