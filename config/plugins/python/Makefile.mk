compile_tests: check-tools | $(BUILD_DIR) $(TEST_DIR)
	$(call header,Building Tests [python])
	@if [ "$$($(NODE_JS) -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync('$(CONFIG_FILE)','utf8')).checkDuplicates))")" = "false" ]; then \
		echo "$(RED)  ⚠ Duplication finder is set to OFF$(RESET)"; \
	elif [ -f $(BUILD_DIR)/.duplicates_checked ]; then \
		echo "$(YELLOW)  ℹ Duplication check skipped (already passed)$(RESET)"; \
	fi
	@echo "  → SEED: $(SEED), COUNT: $(COUNT)"
	$(NODE_JS) $(MAIN_JS_FILE) $(SEED) $(COUNT) '$(TEST_DIR)/$(MAIN_FILE).py'
	@echo "  ✓ Test file: $(TEST_DIR)/$(MAIN_FILE).py"
