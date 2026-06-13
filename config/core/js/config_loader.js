import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

const CONFIG_NAME = ".gtgrc";

function findConfig(startDir) {
  let dir = startDir;
  while (true) {
    const candidate = join(dir, CONFIG_NAME);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`${CONFIG_NAME} not found from ${startDir}`);
    dir = parent;
  }
}

function deepFreeze(obj) {
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") deepFreeze(val);
  }
  return Object.freeze(obj);
}

class ConfigLoader {
  #rootDir;
  #configPath;
  #config;

  constructor() {
    this.#configPath = findConfig(process.cwd());
    this.#rootDir = dirname(this.#configPath);
    this.#config = deepFreeze(JSON.parse(readFileSync(this.#configPath, "utf8")));
  }

  get configPath() {
    return this.#configPath;
  }
  get rootDir() {
    return this.#rootDir;
  }

  getExercisesTexDir() {
    const lang = this.#config.language || "javascript";
    const texLang = this.#config.texLanguage || "en";
    const langDir = lang === "javascript" ? "js" : lang;
    return `${this.#config.directories.exercises.tex}/${langDir}/${texLang}`;
  }

  getExercisesTestsDir() {
    return this.#config.directories.exercises.tests;
  }
  getConfigDir() {
    return this.#config.directories.config.base;
  }
  getBuildDir() {
    return this.#config.directories.build;
  }
  getOutputDir() {
    return this.#config.directories.output;
  }

  getTexShuffledFilePath() {
    return join(this.getBuildDir(), this.#config.files.shuffledFiles.tex);
  }
  getJsShuffledFilePath() {
    return join(this.getBuildDir(), this.#config.files.shuffledFiles.js);
  }

  getFunctionMappingPath(seed) {
    return join(this.getBuildDir(), this.#config.files.functionMapping.replace("{seed}", seed));
  }

  resolve(...p) {
    return resolve(this.#rootDir, ...p);
  }
  getConfig() {
    return this.#config;
  }
  getMangled() {
    return this.#config.mangled;
  }
  getCheckDuplicates() {
    return this.#config.checkDuplicates;
  }

  getLanguage() {
    if (!this.#config.language) throw new Error("'language' must be set in .gtgrc");
    return this.#config.language;
  }
}

export default new ConfigLoader();
