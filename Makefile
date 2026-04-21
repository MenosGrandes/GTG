# Makefile for LuaLaTeX Exercise Generator

# Default values (can be overridden via command line)
SEED ?= 12
COUNT ?= 3
MAIN_FILE = main
TEX_FILE = $(MAIN_FILE).tex
MAIN_JS_FILE = $(MAIN_FILE).js
OUTPUT_JS_FILE = functions.test.js

# Directories
BUILD_DIR = build
PDF_DIR = output_pdf
TEST_DIR = output_test

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

dirs: $(BUILD_DIR) $(PDF_DIR) $(TEST_DIR) 

check-node:
	@command -v node >/dev/null 2>&1 || { echo "Error: Node.js not found. Please install from https://nodejs.org/"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "Error: npm not found. Make sure Node.js is installed."; exit 1; }

check-luatex:
	@command -v lualatex >/dev/null 2>&1 || { echo "Error: LuaTeX (lualatex) not found. Install via 'sudo apt install lualatex' or equivalent."; exit 1; }
check-tools: check-node check-luatex

compile_pdf: check-tools dirs
	@echo "Building LuaLatex with SEED=$(SEED) and COUNT=$(COUNT)"
	$(LUALATEX) -output-directory=$(BUILD_DIR) -jobname=$(MAIN_FILE) '\def\myseed{$(SEED)}\def\mycount{$(COUNT)}\input{$(TEX_FILE)}'
	@cp $(BUILD_DIR)/$(MAIN_FILE).pdf $(PDF_DIR)/$(MAIN_FILE).pdf
	@echo "PDF output: $(PDF_DIR)/$(MAIN_FILE).pdf"

compile_js: check-tools dirs
	@echo "Building JS with SEED=$(SEED) and COUNT=$(COUNT) save to $(TEST_DIR)/$(MAIN_FILE).js"
	$(NODE_JS) $(MAIN_JS_FILE) $(SEED) $(COUNT) '$(TEST_DIR)/$(MAIN_FILE).js'
	@echo "Install npm packages"
	$(NPM) install
	$(OBFUSCATOR) --config 'js_config/obfuscator_config.json' '$(TEST_DIR)/$(MAIN_FILE).js' --output '$(TEST_DIR)/$(OUTPUT_JS_FILE)'

compile: compile_pdf compile_js

clean:
	@echo "Cleaning intermediate files..."
	@rm -rf $(BUILD_DIR)/*
	@rm -rf $(TEST_DIR)/*
	@rm -rf $(PDF_DIR)/*
	@echo "All folders cleaned"

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
	@echo "  make                           - Build with default seed and count"
	@echo "  make SEED=xxx COUNT=n          - Build with custom seed and count"
	@echo "  make clean                     - Remove intermediate files (build/)"
	@echo "  make distclean                 - Remove all generated files"
	@echo "  make npm_clean                 - remove node_modules"
	@echo ""
	@echo "Examples:"
	@echo "  make SEED=12 COUNT=5"
	@echo ""
	@echo "Output folders:"
	@echo "  Intermediate files: $(BUILD_DIR)/"
	@echo "  PDF files: $(PDF_DIR)/"
	@echo "  JS files: $(TEST_DIR)/"

.PHONY: all compile_pdf version clean distclean help dirs compile_js compile_pdf