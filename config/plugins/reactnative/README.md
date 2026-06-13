# ReactNative Plugin (Expo)

Generates obfuscated React Native component tests for student exams. Students run the app using Expo Go (no Android SDK/NDK/Xcode needed).

## Pipeline

1. **Select** exercises by difficulty from `exercises/tests/reactnative/`
2. **Concatenate** selected `.jsx` test files
3. **Obfuscate names** — renames components and import paths (`Counter` → `Cmp<hash>`)
4. **SWC transpile** — converts JSX to CommonJS
5. **Obfuscate code** — javascript-obfuscator with control flow flattening + base64 strings
6. **Scaffold** — assembles Expo project (package.json, app.json, App.jsx, empty src stubs)
7. **ZIP** — packages scaffold into `functions.zip`

## Student Experience

1. Extract ZIP
2. `npm install`
3. Implement components in `src/<CmpHash>.jsx`
4. `npx expo start` → scan QR code with Expo Go app → see components running
5. `npm test` — jest validates implementation against obfuscated tests

## Student Requirements

- Node.js 18+
- Phone with Expo Go app (iOS App Store / Google Play) — free
- Same WiFi network as laptop
- **No Android SDK, NDK, Xcode, or emulator needed**

## Dependencies (build-time, plugin-local)

- `@swc/cli` + `@swc/core` — JSX→CJS transpilation
- `javascript-obfuscator` — code obfuscation

## Key Files

- `index.js` — ReactNativePlugin class (concatenate, obfuscate, extractNames)
- `Makefile.mk` — full pipeline (select → transpile → obfuscate → scaffold → zip)
- `.swcrc` — SWC config for build-time transpilation
- `obfuscator_config.json` — obfuscation settings
- `scaffold/` — template files included in student ZIP:
  - `package.json` — expo, react, react-native, jest-expo
  - `app.json` — Expo project config
  - `App.jsx` — entry point (students import their components here)
  - `babel.config.js` — babel-preset-expo
  - `jest.config.js` — jest-expo preset

## Exercise Format

Each exercise is a `.jsx` file importing a component from `../src/<Name>`:

```jsx
import { render, screen, fireEvent } from "@testing-library/react-native";
import Counter from "../src/Counter";

test("Counter - increments on press", () => {
  render(<Counter initial={0} />);
  fireEvent.press(screen.getByText("Increment"));
  expect(screen.getByText("Count: 1")).toBeTruthy();
});
```

## Difficulty Levels

| Level | Requires                                          |
| ----- | ------------------------------------------------- |
| 1     | useState, basic props, View/Text/TouchableOpacity |
| 2     | Controlled TextInput, derived state               |
| 3     | Multiple states, FlatList, conditional rendering  |
| 4     | useReducer with multiple actions                  |
| 5     | useReducer + custom hooks                         |
