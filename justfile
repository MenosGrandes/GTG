# GTG - Graded Test Generator

set shell := ["bash", "-euo", "pipefail", "-c"]
set positional-arguments := true

# ─── Configuration ────────────────────────────────────────────────────────────

config_file := ".gtgrc"
seed := env("SEED","0")
difficulty := env("DIFFICULTY","{1,1}")
root_directory := source_directory()

# ─── NPM Configuration ────────────────────────────────────────────────────────────

npm_sentinel := root_directory / ".npm_installed"

# ─── Derived from config ──────────────────────────────────────────────────────

language := `node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('.gtgrc','utf8')).language)"`
build_dir := `node -e "const c=JSON.parse(require('fs').readFileSync('.gtgrc','utf8'));process.stdout.write(c.directories.build)"`
output_dir := `node -e "const c=JSON.parse(require('fs').readFileSync('.gtgrc','utf8'));process.stdout.write(c.directories.output)"`

# ─── Directory layout ─────────────────────────────────────────────────────────

pdf_dir := output_dir / "pdf"
test_dir := output_dir / "tests"
zip_dir := output_dir / "zip"
seed_dir := output_dir / seed
plugins_dir := "config/plugins"

# ─── File names ───────────────────────────────────────────────────────────────

main_file := "main"
tex_file := main_file + ".tex"
main_js_file := main_file + ".js"
#MenosGrandes TODO those  output_js_file and zip_file should be set only by plugins
output_js_file := "functions.test.js"
zip_file := "functions.zip"

# ─── Tools ────────────────────────────────────────────────────────────────────

lualatex := "lualatex"
node := "node"
npm := "npm"
uv := "uv"



# ─── Escape helpers ──────────────────────────────────────────────────────────

lbrace := "{"
rbrace := "}"

[doc("Full pipeline: compile tests + PDF, create ZIP, move to seed dir")]
default: create

# ─── Utility recipes ──────────────────────────────────────────────────────────
[private]
@_header msg:
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  {{ msg }}"
    echo "═══════════════════════════════════════════════════════════"

[private]
_dirs:
    @mkdir -p {{ build_dir }} {{ pdf_dir }} {{ test_dir }} {{ zip_dir }} {{ seed_dir }}

[doc("Verify all required tools are available")]
[private]
check-tools: check-node check-luatex check-python

[private]
@check-node:
    command -v {{ node }} >/dev/null 2>&1 || { echo "Error: Node.js not found."; exit 1; }
    command -v {{ npm }} >/dev/null 2>&1 || { echo "Error: npm not found."; exit 1; }

[private]
@check-luatex:
    command -v {{ lualatex }} >/dev/null 2>&1 || { echo "Error: LuaTeX (lualatex) not found."; exit 1; }

[private]
@check-python:
    command -v {{ uv }} >/dev/null 2>&1 || { echo "Error: uv not found."; exit 1; }
[doc("Check Node root dependencies")]
[private]
root_npm_dependencies: 
    #!/usr/bin/env bash
    echo "  → Checking  dependencies..."
    if [ ! -f "{{npm_sentinel}}" ] || [ "{{root_directory}}/package.json" -nt "{{npm_sentinel}}" ]; then
        npm install --prefix "{{root_directory}}" --silent 2>&1 | grep -v "^npm" || true
        touch "{{npm_sentinel}}"
    else
        echo "  → Npm dependencies up to date"
    fi


#MenosGrandes do I need to export them? Yes, as they are used as env vars in other recipes and by tests
[doc("Build tests (dispatches to language plugin)")]
compile-tests: _dirs root_npm_dependencies
    #!/usr/bin/env bash
    just _header "Building Tests [{{ language }}]"
    export SEED="{{ seed }}"
    export DIFFICULTY="{{ difficulty }}"
    export BUILD_DIR="{{ build_dir }}"
    export TEST_DIR="{{ test_dir }}"
    export CONFIG_FILE="{{ config_file }}"
    export MAIN_JS_FILE="{{ main_js_file }}"
    export MAIN_FILE="{{ main_file }}"
    export OUTPUT_JS_FILE="{{ output_js_file }}"
    export ZIP_DIR="{{ zip_dir }}"
    export ZIP_FILE="{{ zip_file }}"
    echo "  → SEED: {{seed}}, DIFFICULTY: {{difficulty}}"
    just --justfile {{ plugins_dir }}/{{ language }}/justfile --working-directory . compile-tests

[doc("Generate function name images")]
[private]
generate-fn-images: _dirs
    @mkdir -p {{ build_dir }}/fn_images
    @{{ uv }} run python config/core/py/generate_fn_images.py {{ build_dir }}/function_mapping_{{ seed }}.tex {{ build_dir }}/fn_images/

[doc("Encrypt PDF and strip ToUnicode")]
[private]
_secure-pdf:
    @just _header "  → Encrypting and stripping ToUnicode..."
    @{{ uv }} run python config/core/py/encrypt_pdf.py "{{ pdf_dir }}/{{ main_file }}.pdf"  {{ seed }}  "{{ pdf_dir }}/{{ main_file }}_encrypted.pdf"
    @rm -f "{{ pdf_dir }}/{{ main_file }}.pdf"
    @mv "{{ pdf_dir }}/{{ main_file }}_encrypted.pdf" "{{ pdf_dir }}/{{ main_file }}.pdf"
    @echo "  ✓ PDF secured"

[doc("Build PDF with LuaLaTeX")]
[private]
compile-pdf: check-tools generate-fn-images _dirs && _secure-pdf
    #!/usr/bin/env bash
    just _header "Building PDF with LuaLaTeX"
    echo "  → SEED: {{ seed }}"
    echo "  → Compiling {{ main_file }}..."
    export TEXMF_OUTPUT_DIRECTORY={{ build_dir }}
    {{ lualatex }} --shell-escape -output-directory={{ build_dir }} -jobname={{ main_file }} \
        -interaction=nonstopmode -halt-on-error \
        '\def\myseed{{ lbrace }}{{ seed }}{{ rbrace }}\input{{ lbrace }}{{ tex_file }}{{ rbrace }}' \
        > {{ build_dir }}/{{ main_file }}.log 2>&1 || \
        { echo "=== ERROR ==="; grep -A5 "^!" {{ build_dir }}/{{ main_file }}.log; \
          echo "Full log: {{ build_dir }}/{{ main_file }}.log"; exit 1; }
    mv {{ build_dir }}/{{ main_file }}.pdf {{ pdf_dir }}/{{ main_file }}.pdf
    echo "  ✓ PDF created: {{ pdf_dir }}/{{ main_file }}.pdf"

#MenosGrandes TODO  move zip creation to plugin ?
[doc("Create ZIP archive")]
[private]
create-zip: compile-tests compile-pdf
    #!/usr/bin/env bash
    if test -f "{{ zip_dir }}/{{ zip_file }}"; then
        echo "  ✓ ZIP already created by plugin"
    else
        zip -q -j "{{ zip_dir }}/{{ zip_file }}" "{{ test_dir }}/{{ output_js_file }}"
    fi
    echo "  ✓ Archive: {{ zip_dir }}/{{ zip_file }}"

[doc("Full pipeline: compile + zip + move to seed dir")]
create: create-zip
    #!/usr/bin/env bash
    just _header "Creating Solution"
    mkdir -p {{ seed_dir }}
    [ -f {{ zip_dir }}/{{ zip_file }} ] && mv {{ zip_dir }}/{{ zip_file }} {{ seed_dir }}/{{ zip_file }}
    [ -f {{ pdf_dir }}/{{ main_file }}.pdf ] && mv {{ pdf_dir }}/{{ main_file }}.pdf {{ seed_dir }}/{{ main_file }}.pdf
    echo "  ✓ Solution ready: {{ seed_dir }}/"


[doc("Remove output directory")]
clean-output:
    @just _header "Cleaning output files..."
    @rm -rf {{ output_dir }}
    @echo "  ✓ Output cleaned"

[doc("Remove build directory")]
clean-build:
    @just _header "Cleaning build files..."
    @rm -rf {{ build_dir }}
    @echo "  ✓ Build cleaned"

[doc("Remove dirs listed in .clean files")]
[private]
plugins-clean:
    #!/usr/bin/env bash
    just _header "Remove dirs listed in .clean files"
    readarray -t clean_files < <(fdfind --ignore-file '.gitignore' -t f -Hap .clean {{ source_directory() }})
    IFS=$'\n' 

    for row in "${clean_files[@]}";do   
    [ -s $row ] || continue
    if  rg -q '[^[:space:]]' $row 
    then
        echo -e "$row"
        for LINE in $(cat "$row")
        do
            echo -e "\t $(dirname $row)/$LINE"
            rm -rf $(dirname $row)/$LINE
        done
    fi
    echo ""
    done 

    echo "✓ Plugin cleanup complete"

[doc("Remove all generated/build/plugins files")]
distclean: clean-output clean-build plugins-clean
    @rm -f *~ *.bak
    @echo "✓ All cleaned"



[doc("Run all tests (JS + Python)")]
run_internal_tests: check-tools root_npm_dependencies
    #!/usr/bin/env bash
    just _header "Running all tests"
    echo "  → JavaScript tests (vitest)..."

    npx vitest run --printConsoleTrace=true --silent=false || exit 1
    echo ""
    echo "  → Python tests (pytest)..."
    uv run pytest tests/unit/ || exit 1
    echo ""
    echo "  ✓ All tests passed"

[doc("Show available recipes")]
help:
    @just --list
