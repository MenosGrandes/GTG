# LuaLaTeX Exercise Generator with JS Obfuscation Tool

## 📚 Overview
This repository combines **Node.js** for JavaScript file generation, **LuaTeX** for dynamic LaTeX document creation, and **JavaScript obfuscation** to create a comprehensive toolchain for educational materials. It allows you to:
- Generate randomized exercise files from a directory
- Concatenate them into a single LaTeX document
- Obfuscate the generated JS code for security

## 📦 Features
✅ **Seeded Randomization**  
- Uses Lua's `seeded_random` function with custom seed values  
- Matches JavaScript implementation for consistent results  

✅ **Dynamic Document Building**  
- Automatically selects and shuffles .tex files, from exe folder
- Automatically selects and shuffles .js files, from tests folder
- Supports customizable input parameters (seed, count)  

✅ **JavaScript Obfuscation**  
- Converts generated JS files to obfuscated versions  
- Uses `javascript-obfuscator` npm package  

✅ **Makefile Integration**  
- Build PDFs with custom seed/count values  
- Separate build directories for intermediate files  

## 📡 Installation

### System Requirements
- Node.js (v14+)  
- LuaTeX (LaTeX compiler)  
- npm (Node Package Manager)
- make


## 🧪 Usage

### Build Process
Run the following command with your desired parameters:
```bash
make SEED=12 COUNT=5
```
Or use defaults:
```bash
make
```

### Available Targets
| Target         | Description                          |
|----------------|--------------------------------------|
| `compile`      | Builds PDF and JS files              |
| `compile_pdf`  | Only builds the LaTeX document       |
| `compile_js`   | Only generates JavaScript output     |
| `clean`        | Removes build directories            |
| `distclean`    | Cleans all generated files           |

### Example Output
```bash
make SEED=42 COUNT=3
```

## 📁 Project Structure
```
config                 - contain .tex configuration files
tex_exercises                    - contain .tex instructions for exercises
tests                  - contain .js tests in Jest
main.js                - implementation for merging ans shuffling .js files from tests
main.tex               - main tex file, from which PDF is generated
obfuscator_config.json - configuration for obfuscator

```

## 🔧 Customization

### Modify Parameters
Update these values in the Makefile:
```makefile
SEED ?= 12      # Seed value for randomization
COUNT ?= 3      # Number of files to include
MAIN_FILE = main  # Base name for output files
```

## 📄 Document Workflow
1. Place your `.tex` files in the `exe/` directory  
1. Place your `js` test files in the `tests/` directory  
2. Run `make` to generate:  
   - `output_pdf/main.pdf` (LaTeX document)  
   - `output_test/main.obs.test.js` (obfuscated JS)  



## 📜 License
MIT License

> ⚠️ Always verify obfuscated code functionality before deployment

This toolchain provides a flexible framework for creating dynamic educational materials while maintaining security through code obfuscation. The separation of concerns between LaTeX generation and JS processing makes it ideal for academic and training environments.