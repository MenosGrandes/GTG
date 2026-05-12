import { copyFileSync } from 'node:fs';
import config from './config/js/config_loader.js';
import { FileSelector } from './config/js/src/file_selector.js';
import { TestConcatenator } from './config/js/src/test_concatenator.js';
import { FunctionObfuscator } from './config/js/src/function_obfuscator.js';

process.on('uncaughtException', (err) => {
    console.error(`\nFATAL ERROR:\n${err.message}\n${err.stack}\n`);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error(`\nFATAL ERROR: Unhandled Promise Rejection\n${reason}\n`);
    process.exit(1);
});

function parseArgs() {
    if (process.argv.length < 5) {
        console.error('Usage: node main.js <seed> <N> <output>');
        process.exit(1);
    }

    const seedStr = process.argv[2];
    const n = parseInt(process.argv[3], 10);
    const outputFilePath = process.argv[4];

    if (!/^\d+$/.test(seedStr)) {
        console.error('SEED must be a non-negative integer.');
        process.exit(1);
    }

    const seed = parseInt(seedStr, 10);

    if (isNaN(n) || n <= 0) {
        console.error('N must be a positive integer.');
        process.exit(1);
    }

    return { seed, n, outputFilePath };
}

const { seed, n, outputFilePath } = parseArgs();

const selector = new FileSelector(config);
const selectedFiles = selector.getFiles(seed, n);

const concatenator = new TestConcatenator(selector.testsDir, config.getUtilsPath());
concatenator.concatenate(selectedFiles, outputFilePath);

const mangledPath = outputFilePath.replace('.js', '.mangled.js');
if (config.getMangled()) {
    const obfuscator = new FunctionObfuscator(seed);
    obfuscator.mangleFile(outputFilePath, mangledPath, config.getFunctionMappingPath(seed));
} else {
    copyFileSync(outputFilePath, mangledPath);
}
