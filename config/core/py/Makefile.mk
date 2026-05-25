encrypt_pdf: create | $(BUILD_DIR) $(TEST_DIR)
	$(call header, Encrypt PDF )

	@if [ ! -f $(BUILD_DIR)/.uv_installed ] || [ pyproject.toml -nt $(BUILD_DIR)/.uv_installed ]; then \
		echo "  → Installing dependencies..."; \
		$(UV) pip install -r pyproject.toml | grep -v "^.venv" || true; \
		touch $(BUILD_DIR)/.uv_installed; \
	else \
		echo "  → Dependencies up to date"; \
	fi
	@$(UV) run python config/core/py/encrypt_pdf.py "$(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf" $(SEED)  $(SEED_OUTPUT_DIR)/$(MAIN_FILE)_encrypted.pdf
	@rm -rf "$(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf"
	@mv "$(SEED_OUTPUT_DIR)/$(MAIN_FILE)_encrypted.pdf" "$(SEED_OUTPUT_DIR)/$(MAIN_FILE).pdf"

