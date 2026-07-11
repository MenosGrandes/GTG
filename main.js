import { copyFileSync } from "node:fs";
import config from "./config/core/js/config_loader.js";
import { FileSelector } from "./config/core/js/file_selector.js";
import { getPlugin } from "./config/core/js/plugin_registry.js";

process.on("uncaughtException", (err) => {
  console.error(`\nFATAL ERROR:\n${err.message}\n${err.stack}\n`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(`\nFATAL ERROR: Unhandled Promise Rejection\n${reason}\n`);
  process.exit(1);
});

function parseArgs() {
  if (process.argv.length < 4) {
    console.error("Usage: node main.js <seed>  <output> <difficulty>");
    console.error("  difficulty: {level,count} tuples, e.g. {1,2},{3,1},{5,1}");
    process.exit(1);
  }

  const seedStr = process.argv[2];
  const outputFilePath = process.argv[3];
  const difficulty = process.argv[4];

  if (!/^\d+$/.test(seedStr)) {
    throw new Error(`SEED must be a non-negative integer. ${seedStr}`);
    process.exit(1);
  }

  const seed = parseInt(seedStr, 10);

  const tupleMatch = difficulty.match(/\{(\d+),(\d+)\}/g);
  if (!tupleMatch) {
    throw new Error(`DIFFICULTY must be {level,count} tuples (e.g., {1,5},{3,2}). ${difficulty}`);

    process.exit(1);
  }
  const difficulties = [];
  for (const t of tupleMatch) {
    const [, level, count] = t.match(/\{(\d+),(\d+)\}/);
    for (let i = 0; i < parseInt(count, 10); i++) {
      difficulties.push(parseInt(level, 10));
    }
  }

  return { seed, outputFilePath, difficulties };
}

const { seed, outputFilePath, difficulties } = parseArgs();
const plugin = getPlugin(config.getLanguage());

const selector = new FileSelector(config, plugin);
const selectedFiles = selector.getFilesByDifficulty(seed, difficulties);
console.log(selectedFiles);
plugin.concatenate(selectedFiles, selector.testsDir, plugin.getUtilsPath(), outputFilePath);

if (config.getMangled() && plugin.supportsObfuscation) {
  const mangledPath = outputFilePath.replace(plugin.extension, ".mangled" + plugin.extension);
  plugin.obfuscate(seed, outputFilePath, mangledPath, config.getFunctionMappingPath(seed), {
    texDir: config.getExercisesTexDir(),
    selectedFiles,
  });
} else {
  const mangledPath = outputFilePath.replace(plugin.extension, ".mangled" + plugin.extension);
  copyFileSync(outputFilePath, mangledPath);
}
