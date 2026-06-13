# JavaScript Plugin

Generates obfuscated JavaScript test files for student exams.

## Pipeline

1. **Select** exercises by difficulty from `exercises/tests/js/`
2. **Concatenate** selected files with `utils.js` (test helpers)
3. **Obfuscate names** — renames `functions.X` to `functions.fn_<hash>`
4. **Obfuscate code** — javascript-obfuscator with control flow flattening
5. **Integrity check** — SHA-256 header prepended to detect tampering

## Output

Single file: `functions.test.js` — student runs with `node functions.test.js`

## Dependencies

- `javascript-obfuscator` (installed locally in this plugin)

## Key Files

- `index.js` — JavaScriptPlugin class (concatenate, obfuscate, extractNames)
- `Makefile.mk` — build target included by root Makefile
- `obfuscator_config.json` — obfuscation settings
- `utils.js` — test helpers prepended to student file (callN, randomInt, etc.)
