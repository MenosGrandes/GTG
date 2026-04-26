#!/usr/bin/env node
/**
 * Read configuration for Makefile
 * Outputs: BUILD_DIR OUTPUT_DIR CONFIG_DIR
 */

try {
    const config = require('./project.config.json');
    const dirs = config.directories;
    
    // Extract base directories
    const outputDir = dirs.output.pdf.split('/')[0]; // Get 'output' from 'output/pdf'
    const configDir = dirs.config.js.split('/')[0];  // Get 'config' from 'config/js'
    
    console.log(dirs.build);
    console.log(outputDir);
    console.log(configDir);
} catch (e) {
    // Fallback defaults
    console.log('build');
    console.log('output');
    console.log('config');
}
