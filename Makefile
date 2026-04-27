# Makefile for LuaLaTeX Exercise Generator

# Configuration file
CONFIG_FILE = project.config.json

# Default values (will be overridden by load-config target)
BUILD_DIR = build
OUTPUT_DIR = output
CONFIG_DIR = config
PDF_DIR = $(OUTPUT_DIR)/pdf
TEST_DIR = $(OUTPUT_DIR)/tests
ZIP_OUTPUT_DIR = $(OUTPUT_DIR)/zip
JS_CONFIG_DIR = $(CONFIG_DIR)/js
LUA_CONFIG_DIR = $(CONFIG_DIR)/lua
TEX_CONFIG_DIR = $(CONFIG_DIR)/tex
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

SEED_OUTPUT_DIR = $(OUTPUT_DIR)/$(SEED)

# Compiler
LUALATEX = lualatex
NODE_JS = node
NPM = npm
OBFUSCATOR = ./node_modules/.bin/javascript-obfuscator


$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

$(PDF_DIR):
	@mkdir -p $(PDF_DIR)

$(TEST_DIR):
	@mkdir -p $(TEST_DIR)

$(ZIP_OUTPUT_DIR):
	@mkdir -p $(ZIP_OUTPUT_DIR)

$(SEED_OUTPUT_DIR):
	@mkdir -p $(SEED_OUTPUT_DIR)


dirs: $(BUILD_DIR) $(PDF_DIR) $(TEST_DIR) $(ZIP_OUTPUT_DIR) $(SEED_OUTPUT_DIR)

check-node:
	@command -v node >/dev/null 2>&1 || { echo "Error: Node.js not found. Please install from https://nodejs.org/"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "Error: npm not found. Make sure Node.js is installed."; exit 1; }

check-luatex:
	@command -v lualatex >/dev/null 2>&1 || { echo "Error: LuaTeX (lualatex) not found. Install via 'sudo apt install lualatex' or equivalent."; exit 1; }

load-config:
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  Check config file "
	@echo "═══════════════════════════════════════════════════════════"
	@test -f $(CONFIG_FILE) || { echo "Error: Configuration file $(CONFIG_FILE) not found!"; exit 1; }
	$(eval CONFIG_VALUES := $(shell $(NODE_JS) read_config.js))
	$(eval BUILD_DIR := $(word 1,$(CONFIG_VALUES)))
	$(eval OUTPUT_DIR := $(word 2,$(CONFIG_VALUES)))
	$(eval CONFIG_DIR := $(word 3,$(CONFIG_VALUES)))
	$(eval PDF_DIR := $(OUTPUT_DIR)/pdf)
	$(eval TEST_DIR := $(OUTPUT_DIR)/tests)
	$(eval ZIP_OUTPUT_DIR := $(OUTPUT_DIR)/zip)
	$(eval JS_CONFIG_DIR := $(CONFIG_DIR)/js)
	$(eval LUA_CONFIG_DIR := $(CONFIG_DIR)/lua)
	$(eval TEX_CONFIG_DIR := $(CONFIG_DIR)/tex)

	@echo ""
	@echo "----------------------------------------------------------"
	@echo "Configuration Paths Loaded Successfully:"
	
	@echo "  ✓ Base Output Dir:        $(OUTPUT_DIR)"
	@echo "  ✓ Build Directory:        $(BUILD_DIR)"
	@echo "  ✓ Global Config Directory: $(CONFIG_DIR)"

	@echo "--- Subdirectories ---"
	@echo "  ✓ JS Config Source Path:  $(JS_CONFIG_DIR)"
	@echo "  ✓ Lua Config Source Path: $(LUA_CONFIG_DIR)"
	@echo "  ✓ TEX Config Source Path: $(TEX_CONFIG_DIR)"

	@echo "--- Output Artifact Directories ---"
	@echo "  ✓ PDF Output Directory:   $(PDF_DIR)"
	@echo "  ✓ Test Output Directory:  $(TEST_DIR)"
	@echo "  ✓ Zip Archive Directory:  $(ZIP_OUTPUT_DIR)"
	@echo "----------------------------------------------------------"
	@echo "  ✓ SEED_OUTPUT_DIR:  $(SEED_OUTPUT_DIR)"
	@echo "----------------------------------------------------------"
check-tools: check-node  check-luatex load-config


compile_pdf: compile_js check-tools dirs
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  Building PDF with LuaLaTeX"
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  → SEED: $(SEED), COUNT: $(COUNT)"
	@echo "  → Compiling... (log: $(BUILD_DIR)/build.latex.log)"
	$(LUALATEX) --shell-escape -output-directory=$(BUILD_DIR) -jobname=$(MAIN_FILE) '\def\myseed{$(SEED)}\def\mycount{$(COUNT)}\input{$(TEX_FILE)}' > $(BUILD_DIR)/build.latex.log 2>&1 || true
	@mv $(BUILD_DIR)/$(MAIN_FILE).pdf $(PDF_DIR)/$(MAIN_FILE).pdf
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
	$(NPM) install --silent 2>&1 | grep -v "^npm" | sed 's/^/    /' || true
	@echo "  → Obfuscating code..."
	$(OBFUSCATOR) --config '$(JS_CONFIG_DIR)/obfuscator_config.json' $(TEST_DIR)/$(MANGLED_JS_FILE) --output $(TEST_DIR)/$(OUTPUT_JS_FILE) || exit 1
	@echo ""
	@echo "  ✓ Test file: $(TEST_DIR)/$(OUTPUT_JS_FILE)"
	@echo ""

compile:   compile_js compile_pdf

create_zip:  compile
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  Creating ZIP Archive"
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  → Packaging: $(ZIP_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE)"
	@zip -q -j $(ZIP_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE) $(TEST_DIR)/$(OUTPUT_JS_FILE)
	@echo "  ✓ Archive ready: $(ZIP_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE)"
	@echo ""
move_zip:
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  Move ZIP"
	@echo "═══════════════════════════════════════════════════════════"
	@mv $(ZIP_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE) $(SEED_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE)
	@echo "  ✓ PDF ready: $(SEED_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE)"

move_pdf:
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  Move PDF"
	@echo "═══════════════════════════════════════════════════════════"
	@mv $(PDF_DIR)/$(MAIN_FILE).pdf $(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf
	@echo "  ✓ PDF ready: $(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf"

create: $(SEED_OUTPUT_DIR) create_zip move_zip move_pdf
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  Creating solution"
	@echo "═══════════════════════════════════════════════════════════"
	@test -f $(SEED_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE) || { echo "Error: File not found at $(SEED_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE)"; exit 1; }
	@test -f $(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf || { echo "Error: File not found at $(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf"; exit 1; }

	@echo "  ✓ Solution for student ready: $(SEED_OUTPUT_DIR)"

	

clean:
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  Cleaning intermediate files..."
	@echo "═══════════════════════════════════════════════════════════"
	@rm -rf $(BUILD_DIR)/*
	@rm -rf $(OUTPUT_DIR)/*
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
	@echo "  Output files: $(OUTPUT_DIR)/"
	@echo "  Config files: $(CONFIG_DIR)/"
	@echo ""
	@echo "Configuration:"
	@echo "  Default SEED: $(SEED)"
	@echo "  Default COUNT: $(COUNT)"
	@echo "  Output JS file: $(OUTPUT_JS_FILE)"
	@echo "  Zip file: $(ZIP_OUTPUT_FILE)"



all: create

.PHONY: all compile_pdf version clean distclean help dirs compile_js compile create_zip load-config create
