const fs = require('fs');
const path = require('path');
const config = require('./config/js/config_loader.js');
const FileSelector = require('./config/js/src/file_selector.js');
const TestConcatenator = require('./config/js/src/test_concatenator.js');
const FunctionObfuscator = require('./config/js/src/function_obfuscator.js');
const LatexExporter = require('./config/js/src/latex_exporter.js');

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

process.on('uncaughtException', (err) => {
    console.error(`\nFATAL ERROR:\n${err.message}\n${err.stack}\n`);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error(`\nFATAL ERROR: Unhandled Promise Rejection\n${reason}\n`);
    process.exit(1);
});

// ============================================================================
// MAIN
// ============================================================================

function main() {
    const { seed, n, outputFilePath } = parseArgs();

    const testsDir = path.resolve(__dirname, config.getExercisesTestsDir());
    const texDir = path.resolve(__dirname, config.getExercisesTexDir());

    // Select and shuffle files
    const selector = new FileSelector(testsDir, texDir);
    const selectedFiles = selector.getFiles(seed, n);
    console.log('Shuffled JS files:', selectedFiles);

    // Write shuffled file list
    fs.writeFileSync(
        config.getJsShuffledFilePath(),
        selectedFiles.map(f => f.replace('.js', '')).join('\n') + '\n'
    );

    // Concatenate test files
    const concatenator = new TestConcatenator(testsDir, config.getUtilsPath());
    concatenator.concatenate(selectedFiles, outputFilePath);
    console.log('All files concatenated into:', outputFilePath);

    // Obfuscate (or copy as-is)
    const mangledPath = outputFilePath.replace('.js', '.mangled.js');
    const concatenatedCode = fs.readFileSync(outputFilePath, 'utf8');

    if (config.getMangled()) {
        const obfuscator = new FunctionObfuscator(seed);
        const names = obfuscator.extractNames(concatenatedCode);
        console.log(`Found ${names.length} functions to obfuscate`);

        const mapping = obfuscator.createMapping(names);
        const mangledCode = obfuscator.applyMapping(concatenatedCode, mapping);
        fs.writeFileSync(mangledPath, mangledCode);
        console.log(`✓ Functions mangled: ${mangledPath}`);

        LatexExporter.saveMapping(mapping, config.getFunctionMappingPath(seed));
        console.log(`✓ LaTeX mapping saved`);

        console.log('\nFunction mapping:');
        Object.entries(mapping).forEach(([orig, obf]) => console.log(`  ${orig} → ${obf}`));
    } else {
        fs.writeFileSync(mangledPath, concatenatedCode);
        console.log(`✓ No mangling, copied to: ${mangledPath}`);
    }
}

function parseArgs() {
    if (process.argv.length < 5) {
        console.error('Usage: node main.js <seed> <N> <output>');
        process.exit(1);
    }

    const seed = process.argv[2];
    const n = parseInt(process.argv[3], 10);
    const outputFilePath = process.argv[4];

    if (isNaN(n) || n <= 0) {
        console.error('N must be a positive integer.');
        process.exit(1);
    }

    return { seed, n, outputFilePath };
}

main();
