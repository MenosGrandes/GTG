compile_tests: check-tools | $(BUILD_DIR) $(TEST_DIR)
	$(call header,Building Tests [javascript])
	@if [ "$$($(NODE_JS) -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync('$(CONFIG_FILE)','utf8')).checkDuplicates))")" = "false" ]; then \
		echo "$(RED)  ⚠ Duplication finder is set to OFF$(RESET)"; \
	elif [ -f $(BUILD_DIR)/.duplicates_checked ]; then \
		echo "$(YELLOW)  ℹ Duplication check skipped (already passed)$(RESET)"; \
	fi
	@echo "  → SEED: $(SEED), COUNT: $(COUNT)"
	$(NODE_JS) $(MAIN_JS_FILE) $(SEED) $(COUNT) '$(TEST_DIR)/$(MAIN_FILE).js'
	@echo "  → Installing dependencies..."
	@$(NPM) install --silent 2>&1 | grep -v "^npm" || true
	@echo "  → Obfuscating code..."
	$(OBFUSCATOR) --config '$(PLUGINS_DIR)/javascript/obfuscator_config.json' \
		$(TEST_DIR)/$(MANGLED_JS_FILE) --output $(TEST_DIR)/$(OUTPUT_JS_FILE)
	@echo "  ✓ Test file: $(TEST_DIR)/$(OUTPUT_JS_FILE)"
