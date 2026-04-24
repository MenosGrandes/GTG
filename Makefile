# Makefile for LuaLaTeX Exercise Generator

# Default values (can be overridden via command line)
SEED ?= 12
COUNT ?= 3
MAIN_FILE = main
TEX_FILE = $(MAIN_FILE).tex
MAIN_JS_FILE = $(MAIN_FILE).js
MANGLED_JS_FILE = $(MAIN_FILE).mangled.js
OUTPUT_JS_FILE = functions.test.js
ZIP_OUTPUT_FILE = functions.zip

# Directories
BUILD_DIR = build
PDF_DIR = output_pdf
TEST_DIR = output_test
ZIP_OUTPUT_DIR = zip_output

# Compiler
LUALATEX = lualatex
NODE_JS = node
NPM = npm
OBFUSCATOR = ./node_modules/javascript-obfuscator/bin/javascript-obfuscator

all: compile

$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

$(PDF_DIR):
	@mkdir -p $(PDF_DIR)

$(TEST_DIR):
	@mkdir -p $(TEST_DIR)

$(ZIP_OUTPUT_DIR):
	@mkdir -p $(ZIP_OUTPUT_DIR)

dirs: $(BUILD_DIR) $(PDF_DIR) $(TEST_DIR) $(ZIP_OUTPUT_DIR)

check-node:
	@command -v node >/dev/null 2>&1 || { echo "Error: Node.js not found. Please install from https://nodejs.org/"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "Error: npm not found. Make sure Node.js is installed."; exit 1; }

check-luatex:
	@command -v lualatex >/dev/null 2>&1 || { echo "Error: LuaTeX (lualatex) not found. Install via 'sudo apt install lualatex' or equivalent."; exit 1; }
check-tools: check-node check-luatex

compile_pdf: compile_js check-tools dirs
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  Building PDF with LuaLaTeX"
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  → SEED: $(SEED), COUNT: $(COUNT)"
	@echo "  → Compiling... (log: $(BUILD_DIR)/latex.log)"
	$(LUALATEX) --shell-escape -output-directory=$(BUILD_DIR) -jobname=$(MAIN_FILE) '\def\myseed{$(SEED)}\def\mycount{$(COUNT)}\input{$(TEX_FILE)}' > $(BUILD_DIR)/latex.log 2>&1
	@cp $(BUILD_DIR)/$(MAIN_FILE).pdf $(PDF_DIR)/$(MAIN_FILE).pdf
	@echo "  ✓ PDF created: $(PDF_DIR)/$(MAIN_FILE).pdf"
	@echo ""

compile_js:  check-tools dirs
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  Building JavaScript Tests"
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  → SEED: $(SEED), COUNT: $(COUNT)"
	@echo ""
	$(NODE_JS) $(MAIN_JS_FILE) $(SEED) $(COUNT) '$(TEST_DIR)/$(MAIN_FILE).js' || exit 1
	@echo ""
	@echo "  → Installing dependencies..."
	@$(NPM) install --silent 2>&1 | grep -v "^npm" | sed 's/^/    /' || true
	@echo "  → Obfuscating code..."
	$(OBFUSCATOR) --config 'js_config/obfuscator_config.json' $(TEST_DIR)/$(MANGLED_JS_FILE) --output $(TEST_DIR)/$(OUTPUT_JS_FILE) || exit 1
	@echo ""
	@echo "  ✓ Test file: $(TEST_DIR)/$(OUTPUT_JS_FILE)"
	@echo ""

compile:  compile_pdf compile_js

create_zip:  compile_pdf compile_js
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  Creating ZIP Archive"
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  → Packaging: $(ZIP_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE)"
	@zip -q -j $(ZIP_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE) $(TEST_DIR)/$(OUTPUT_JS_FILE)
	@echo "  ✓ Archive ready: $(ZIP_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE)"
	@echo ""

clean:
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  Cleaning intermediate files..."
	@echo "═══════════════════════════════════════════════════════════"
	@rm -rf $(BUILD_DIR)/*
	@rm -rf $(TEST_DIR)/*
	@rm -rf $(PDF_DIR)/*
	@rm -rf $(ZIP_OUTPUT_DIR)/*
	@echo "  ✓ All folders cleaned"
	@echo ""

# Clean everything including PDFs
distclean: clean npm_clean
	@echo "Cleaning all generated files..."
	@rm -f *~ *.bak
	@echo "All files cleaned"

npm_clean: 
	@echo "Cleaning node_modules..."
	@rm -rf node_modules
	@echo "npm cleaned"

# Show help
help:
	@echo "Usage:"
	@echo "  make                           - Build PDF and JS with default seed and count"
	@echo "  make SEED=xxx COUNT=n          - Build with custom seed and count"
	@echo "  make compile_pdf               - Build only PDF"
	@echo "  make compile_js                - Build only JS (obfuscated)"
	@echo "  make create_zip                - Build everything and create zip archive"
	@echo "  make clean                     - Remove intermediate files"
	@echo "  make distclean                 - Remove all generated files"
	@echo "  make npm_clean                 - Remove node_modules"
	@echo ""
	@echo "Examples:"
	@echo "  make SEED=12 COUNT=5"
	@echo "  make create_zip SEED=42 COUNT=10"
	@echo ""
	@echo "Output folders:"
	@echo "  Intermediate files: $(BUILD_DIR)/"
	@echo "  PDF files: $(PDF_DIR)/"
	@echo "  JS files: $(TEST_DIR)/"
	@echo "  Zip archives: $(ZIP_OUTPUT_DIR)/"
	@echo ""
	@echo "Configuration:"
	@echo "  Default SEED: $(SEED)"
	@echo "  Default COUNT: $(COUNT)"
	@echo "  Output JS file: $(OUTPUT_JS_FILE)"
	@echo "  Zip file: $(ZIP_OUTPUT_FILE)"

.PHONY: all compile_pdf version clean distclean help dirs compile_js compile create_zip
