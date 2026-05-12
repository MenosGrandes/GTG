import { copyFileSync } from 'node:fs';
import config from './config/core/config_loader.js';
import { FileSelector } from './config/core/file_selector.js';
import { getPlugin } from './config/core/plugin_registry.js';

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
const plugin = getPlugin(config.getLanguage());

const selector = new FileSelector(config, plugin);
const selectedFiles = selector.getFiles(seed, n);

plugin.concatenate(selectedFiles, selector.testsDir, plugin.getUtilsPath(), outputFilePath);

if (config.getMangled() && plugin.supportsObfuscation) {
    const mangledPath = outputFilePath.replace(plugin.extension, '.mangled' + plugin.extension);
    plugin.obfuscate(seed, outputFilePath, mangledPath, config.getFunctionMappingPath(seed));
} else {
    const mangledPath = outputFilePath.replace(plugin.extension, '.mangled' + plugin.extension);
    copyFileSync(outputFilePath, mangledPath);
}
