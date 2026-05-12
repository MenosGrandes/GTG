# Makefile for LuaLaTeX Exercise Generator

include config/make/colors.mk

# Configuration file
CONFIG_FILE = project.config.json

# Default values (can be overridden via command line or load-config)
SEED ?= 12
COUNT ?= 3
N ?= 1

# Directory layout
BUILD_DIR = build
OUTPUT_DIR = output
CONFIG_DIR = config
PDF_DIR = $(OUTPUT_DIR)/pdf
TEST_DIR = $(OUTPUT_DIR)/tests
ZIP_OUTPUT_DIR = $(OUTPUT_DIR)/zip
SEED_OUTPUT_DIR = $(OUTPUT_DIR)/$(SEED)
CORE_DIR = $(CONFIG_DIR)/core
PLUGINS_DIR = $(CONFIG_DIR)/plugins
LUA_CONFIG_DIR = $(CONFIG_DIR)/lua
TEX_CONFIG_DIR = $(CONFIG_DIR)/tex

# File names
MAIN_FILE = main
TEX_FILE = $(MAIN_FILE).tex
MAIN_JS_FILE = $(MAIN_FILE).js
MANGLED_JS_FILE = $(MAIN_FILE).mangled.js
OUTPUT_JS_FILE = functions.test.js
ZIP_OUTPUT_FILE = functions.zip

# Tools
LUALATEX = lualatex
NODE_JS = node
NPM = npm
OBFUSCATOR = ./node_modules/.bin/javascript-obfuscator

# All directories that need to exist
ALL_DIRS = $(BUILD_DIR) $(PDF_DIR) $(TEST_DIR) $(ZIP_OUTPUT_DIR) $(SEED_OUTPUT_DIR)

# ─── Header macro ─────────────────────────────────────────────────────────────
define header
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  $(1)"
	@echo "═══════════════════════════════════════════════════════════"
endef

# ─── Default target ───────────────────────────────────────────────────────────
all: create

# ─── Directory creation (order-only, single rule) ─────────────────────────────
$(ALL_DIRS):
	@mkdir -p $@

# ─── Tool checks ─────────────────────────────────────────────────────────────
check-node:
	@command -v $(NODE_JS) >/dev/null 2>&1 || { echo "Error: Node.js not found. Please install from https://nodejs.org/"; exit 1; }
	@command -v $(NPM) >/dev/null 2>&1 || { echo "Error: npm not found. Make sure Node.js is installed."; exit 1; }

check-luatex:
	@command -v $(LUALATEX) >/dev/null 2>&1 || { echo "Error: LuaTeX (lualatex) not found. Install via 'sudo apt install texlive-lualatex' or equivalent."; exit 1; }

# ─── Configuration loading ────────────────────────────────────────────────────
load-config:
	$(call header,Loading Configuration)
	@test -f $(CONFIG_FILE) || { echo "Error: Configuration file $(CONFIG_FILE) not found!"; exit 1; }
	$(eval CONFIG_VALUES := $(shell $(NODE_JS) read_config.js))
	$(eval BUILD_DIR := $(word 1,$(CONFIG_VALUES)))
	$(eval OUTPUT_DIR := $(word 2,$(CONFIG_VALUES)))
	$(eval CONFIG_DIR := $(word 3,$(CONFIG_VALUES)))
	$(eval PDF_DIR := $(OUTPUT_DIR)/pdf)
	$(eval TEST_DIR := $(OUTPUT_DIR)/tests)
	$(eval ZIP_OUTPUT_DIR := $(OUTPUT_DIR)/zip)
	$(eval PLUGINS_DIR := $(CONFIG_DIR)/plugins)
	$(eval LUA_CONFIG_DIR := $(CONFIG_DIR)/lua)
	$(eval TEX_CONFIG_DIR := $(CONFIG_DIR)/tex)
	@echo "Config loaded: BUILD_DIR=$(BUILD_DIR) OUTPUT_DIR=$(OUTPUT_DIR) CONFIG_DIR=$(CONFIG_DIR)"

check-tools: check-node check-luatex load-config

# ─── LuaLaTeX compilation macro ──────────────────────────────────────────────
define run_lualatex
	@echo "  → Compiling $(1)..."
	@$(LUALATEX) --shell-escape -output-directory=$(BUILD_DIR) -jobname=$(1) \
		-interaction=nonstopmode -halt-on-error \
		'\def\myseed{$(SEED)}\def\mycount{$(COUNT)}\input{$(2)}' \
		> $(BUILD_DIR)/$(1).log 2>&1 || \
		{ echo "=== ERROR ($(1)) ==="; grep -A5 "^!" $(BUILD_DIR)/$(1).log; \
		  echo "Full log: $(BUILD_DIR)/$(1).log"; exit 1; }
endef

# ─── Language detection ────────────────────────────────────────────────────────
LANGUAGE = $(shell $(NODE_JS) -e "process.stdout.write(JSON.parse(require('fs').readFileSync('$(CONFIG_FILE)','utf8')).language)")
ifeq ($(wildcard $(PLUGINS_DIR)/$(LANGUAGE)/Makefile.mk),)
$(error Unsupported language '$(LANGUAGE)'. No Makefile.mk found at $(PLUGINS_DIR)/$(LANGUAGE)/)
endif

# ─── Build targets (language-specific) ────────────────────────────────────────
include $(PLUGINS_DIR)/$(LANGUAGE)/Makefile.mk

compile_pdf: check-tools | $(BUILD_DIR) $(PDF_DIR)
	$(call header,Building PDF with LuaLaTeX)
	@echo "  → SEED: $(SEED), COUNT: $(COUNT)"
	$(call run_lualatex,$(MAIN_FILE),$(TEX_FILE))
	@mv $(BUILD_DIR)/$(MAIN_FILE).pdf $(PDF_DIR)/$(MAIN_FILE).pdf
	@echo "  ✓ PDF created: $(PDF_DIR)/$(MAIN_FILE).pdf"

compile: compile_tests compile_pdf

# ─── Package targets ──────────────────────────────────────────────────────────
create_zip: compile | $(ZIP_OUTPUT_DIR)
	$(call header,Creating ZIP Archive)
	@zip -q -j $(ZIP_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE) $(TEST_DIR)/$(OUTPUT_JS_FILE)
	@echo "  ✓ Archive: $(ZIP_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE)"

create: create_zip | $(SEED_OUTPUT_DIR)
	$(call header,Creating Solution)
	@mv $(ZIP_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE) $(SEED_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE)
	@mv $(PDF_DIR)/$(MAIN_FILE).pdf $(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf
	@test -f $(SEED_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE) || { echo "Error: ZIP not found at $(SEED_OUTPUT_DIR)/$(ZIP_OUTPUT_FILE)"; exit 1; }
	@test -f $(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf || { echo "Error: PDF not found at $(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf"; exit 1; }
	@echo "  ✓ Solution ready: $(SEED_OUTPUT_DIR)/"

# ─── Batch with random seeds ──────────────────────────────────────────────────
random_seeds:
	$(call header,Generating $(N) random seeds)
	@for i in $$(seq 1 $(N)); do \
		RSEED=$$($(NODE_JS) -e "console.log(Math.floor(Math.random()*999999)+1)"); \
		echo "  → Building with SEED=$$RSEED COUNT=$(COUNT)"; \
		$(MAKE) --no-print-directory create SEED=$$RSEED COUNT=$(COUNT) || exit 1; \
	done
	@echo "  ✓ Generated $(N) solutions"

# ─── Clean targets ────────────────────────────────────────────────────────────
clean_output:
	$(call header,Cleaning output files...)
	@rm -rf $(OUTPUT_DIR)
	@echo "  ✓ Output cleaned"

clean_build:
	$(call header,Cleaning build files...)
	@rm -rf $(BUILD_DIR)
	@echo "  ✓ Build cleaned"

npm_clean:
	$(call header,Cleaning node_modules...)
	@rm -rf node_modules
	@echo "  ✓ node_modules cleaned"

distclean: clean_output clean_build npm_clean
	@rm -f *~ *.bak
	@echo "  ✓ All cleaned"

# ─── Help ─────────────────────────────────────────────────────────────────────
help:
	@echo "Usage: make [target] [SEED=n] [COUNT=n]"
	@echo ""
	@echo "Targets:"
	@echo "  all (default)    Full pipeline: compile → zip → move to seed dir"
	@echo "  compile          Build both PDF and JS"
	@echo "  compile_pdf      Build only PDF"
	@echo "  compile_tests    Build tests (dispatches to language target)"
	@echo "  create_zip       Compile and create zip archive"
	@echo "  create           Full pipeline (same as 'all')"
	@echo "  clean_output     Remove output directory"
	@echo "  clean_build      Remove build directory"
	@echo "  distclean        Remove all generated files and node_modules"
	@echo "  npm_clean        Remove node_modules"
	@echo "  check-tools      Verify required tools are installed"
	@echo "  load-config      Load and display configuration"
	@echo "  help             Show this message"
	@echo ""
	@echo "Examples:"
	@echo "  make SEED=12 COUNT=5"
	@echo "  make create_zip SEED=42 COUNT=10"
	@echo ""
	@echo "Defaults: SEED=$(SEED), COUNT=$(COUNT)"
	@echo "Dirs:     build=$(BUILD_DIR) output=$(OUTPUT_DIR) config=$(CONFIG_DIR)"

.PHONY: all compile_pdf compile_tests compile create_zip create random_seeds check-node check-luatex check-tools load-config clean_output clean_build distclean npm_clean help
