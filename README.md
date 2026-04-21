# LaTeX Exercise Generator with JS Test Bundler

A build system that generates randomized exercise PDFs and matching JavaScript test files. Uses the same seed for both LaTeX and JS to ensure they select identical exercises.

## What it does

- Picks random exercises from a pool using a seed value
- Generates a PDF with those exercises
- Creates a matching JS test file with the same exercises
- Validates that both outputs match
- Obfuscates the JS for distribution

## Requirements

- Node.js 14+
- LuaTeX
- make

## Quick start

```bash
make SEED=42 COUNT=10
```

This builds a PDF and JS file with 10 randomly selected exercises using seed 42.

## Project structure

```
config/
  ├── preambule.tex          - Document setup (supports Polish/English)
  ├── copyright.tex          - Copyright notice
  ├── get_random_exercises.tex - Random selection logic
  └── copy_protect.tex       - PDF protection
tex_exercises/               - Exercise files (.tex)
tests/                       - Test files (.js)
main.tex                     - LaTeX entry point
main.js                      - JS bundler
```

## Configuration

### Set language

In `main.tex`:
```latex
\newcommand{\useLanguage}{PL}  % PL or ENG
```

### Set document info

```latex
\newcommand{\pdfTitle}{Your Title}
\newcommand{\CopyrightAuthors}{Author1 \& Author2}
```

### Makefile options

```makefile
SEED ?= 12      # Random seed
COUNT ?= 3      # Number of exercises
```

## How it works

1. LaTeX reads all .tex files from `tex_exercises/`, sorts them, shuffles with the seed, picks COUNT files
2. JS does the same with .js files from `tests/`
3. Both write their file lists to `build/` for comparison
4. Build fails if the lists don't match

## File naming

Exercise and test files must match:
- `tex_exercises/file_1.tex`
- `tests/file_1.js`

Missing files will cause a build error.

## Build targets

```bash
make              # Build everything
make compile_pdf  # PDF only
make compile_js   # JS only
make clean        # Remove build files
```

## Output

- `output_pdf/main.pdf` - The exercise PDF
- `output_test/main.obs.test.js` - Obfuscated test bundle
- `build/tex_shuffled_files.txt` - LaTeX file order
- `build/js_shuffled_files.txt` - JS file order

## License

MIT
