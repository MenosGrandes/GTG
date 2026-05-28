compile_tests: check-tools | $(BUILD_DIR) $(TEST_DIR)
	$(call header,Building Tests [javascript])
	@if [ "$$($(NODE_JS) -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync('$(CONFIG_FILE)','utf8')).checkDuplicates))")" = "false" ]; then \
		echo "$(RED)  ⚠ Duplication finder is set to OFF$(RESET)"; \
	elif [ -f $(BUILD_DIR)/.duplicates_checked ]; then \
		echo "$(YELLOW)  ℹ Duplication check skipped (already passed)$(RESET)"; \
	fi
	@echo "  → SEED: $(SEED), COUNT: $(COUNT)"
	$(NODE_JS) $(MAIN_JS_FILE) $(SEED) $(COUNT) '$(TEST_DIR)/$(MAIN_FILE).js'
	@if [ ! -f $(BUILD_DIR)/.npm_installed ] || [ package.json -nt $(BUILD_DIR)/.npm_installed ]; then \
		echo "  → Installing dependencies..."; \
		$(NPM) install --silent 2>&1 | grep -v "^npm" || true; \
		touch $(BUILD_DIR)/.npm_installed; \
	else \
		echo "  → Dependencies up to date"; \
	fi
	@echo "  → Obfuscating code..."
	$(OBFUSCATOR) --config '$(PLUGINS_DIR)/javascript/obfuscator_config.json' \
		$(TEST_DIR)/$(MANGLED_JS_FILE) --output $(TEST_DIR)/$(OUTPUT_JS_FILE)
	@echo "  → Adding integrity check..."
	@HASH=$$($(NODE_JS) -e "const c=require('crypto'),f=require('fs');process.stdout.write(c.createHash('sha256').update(f.readFileSync('$(TEST_DIR)/$(OUTPUT_JS_FILE)','utf8')).digest('hex'))"); \
	$(NODE_JS) -e "const fs=require('fs'),p='$(TEST_DIR)/$(OUTPUT_JS_FILE)',c=fs.readFileSync(p,'utf8');fs.writeFileSync(p,'const __ic=require(\"crypto\").createHash(\"sha256\");const __if=require(\"fs\").readFileSync(__filename,\"utf8\");if(__ic.update(__if.slice(__if.indexOf(\"\\\\n\")+1)).digest(\"hex\")!==\"'+'$$HASH'+'\"){throw new Error(\"Integrity check failed\")}\\n'+c)"
	@echo "  ✓ Test file: $(TEST_DIR)/$(OUTPUT_JS_FILE)"
