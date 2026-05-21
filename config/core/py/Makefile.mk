encrypt_pdf: check-tools | $(BUILD_DIR) $(TEST_DIR)
	$(call header, Encrypt PDF )
	ifndef VIRTUAL_ENV
		$(error py virtualenv is undefined | uv venv && source .venv/bin/activate )
	endif
	@echo "  → Installing dependencies..."
	@$(UV) pip install -r pyproject.toml | grep -v "^.venv" || true
	@$(UV) run python config/core/py/encrypt_pdf.py "$(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf" $(SEED)  $(SEED_OUTPUT_DIR)/$(MAIN_FILE)_encrypted.pdf
	@rm -rf "$(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf"
	@mv "$(SEED_OUTPUT_DIR)/$(MAIN_FILE)_encrypted.pdf" "$(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf"

