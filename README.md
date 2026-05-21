# GTG — LaTeX Exercise Generator with JS Test Bundler

Generates randomized exam PDFs and matching obfuscated JavaScript test files for academic assessments. A shared seed ensures both outputs select identical exercises.

## Requirements

- Node.js 14+
- LuaLaTeX
- make
- zip

## Quick Start

```bash
npm install
make SEED=42 COUNT=10
```

Builds a PDF and obfuscated JS test file with 10 randomly selected exercises using seed 42.

## Build Targets

```bash
make                          # Full pipeline (PDF + JS + ZIP)
make compile_js SEED=42 COUNT=10   # JS only (obfuscated test bundle)
make compile_pdf SEED=42 COUNT=10  # PDF only (requires compile_js first)
make create_zip SEED=42 COUNT=10   # Full pipeline + ZIP archive
make random_seeds N=5 COUNT=10     # Generate 5 solutions with random seeds
make clean_build              # Remove build directory
make clean_output             # Remove output directory
make distclean                # Remove all generated files + node_modules
```

## Configuration

All paths and flags are in `project.config.json`:

| Field             | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `directories.*`   | Input/output/build paths                  |
| `mangled`         | Enable/disable function name obfuscation  |
| `debug`           | Verbose output                            |
| `checkDuplicates` | Enable duplicate function name validation |

### Makefile Variables

| Variable | Default | Description                                      |
| -------- | ------- | ------------------------------------------------ |
| `SEED`   | 12      | Random seed for exercise selection               |
| `COUNT`  | 3       | Number of exercises to select                    |
| `N`      | 1       | Number of random seeds for `random_seeds` target |

## How It Works

1. `main.js` selects exercises from the pool using a seeded LCG shuffle
2. Selected test files are concatenated and function names are obfuscated (SHA-256 based)
3. `javascript-obfuscator` applies control flow flattening and dead code injection
4. LuaLaTeX reads the same file list and generates a matching PDF
5. Both outputs are packaged into a ZIP for distribution

## Project Structure

```
main.js                        # JS pipeline entry point
main.tex                       # LaTeX document entry point
project.config.json            # Central configuration
Makefile                       # Build orchestration
exercises/
├── tests/                     # JS test files (file_72.js – file_127.js)
└── tex/                       # LaTeX exercise files
config/
├── js/
│   ├── config_loader.js       # Path resolution (ESM, frozen config)
│   ├── utils.js               # Test utility functions
│   ├── obfuscator_config.json
│   └── src/
│       ├── file_selector.js   # Seeded selection + validation
│       ├── test_concatenator.js
│       ├── function_obfuscator.js
│       └── latex_exporter.js
├── lua/                       # LuaTeX scripts
└── tex/                       # LaTeX includes
output/                        # Final outputs (gitignored)
build/                         # Intermediate artifacts (gitignored)
```

## Adding Exercises

1. Create `exercises/tests/file_<N>.js` — exactly 5 tests using `callN` pattern
2. Create `exercises/tex/file_<N>.tex` — matching LaTeX description
3. File basenames must match (`file_N.js` ↔ `file_N.tex`)
4. Function/class names must be letters-only and unique across the entire pool

Validation runs automatically on build (controlled by `checkDuplicates` flag).

## Validation

The build pipeline validates:

- Matching `.js` ↔ `.tex` file pairs
- No duplicate function/class names across test files
- Function names are letters-only

After a successful duplicate check, a `build/.duplicates_checked` flag is created to skip re-validation on subsequent builds. Run `make clean_build` to force re-validation.

## License

MIT
