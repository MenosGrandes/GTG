import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const CONFIG_NAME = 'project.config.json';

function findConfig(startDir) {
    let dir = startDir;
    while (true) {
        const candidate = join(dir, CONFIG_NAME);
        if (existsSync(candidate)) return candidate;
        const parent = dirname(dir);
        if (parent === dir) {
            throw new Error(`${CONFIG_NAME} not found from ${startDir}`);
        }
        dir = parent;
    }
}

function deepFreeze(obj) {
    for (const val of Object.values(obj)) {
        if (val && typeof val === 'object') deepFreeze(val);
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
        this.#config = deepFreeze(JSON.parse(readFileSync(this.#configPath, 'utf8')));
    }

    get configPath() { return this.#configPath; }
    get rootDir() { return this.#rootDir; }

    getExercisesTexDir() { return this.#config.directories.exercises.tex; }
    getExercisesTestsDir() { return this.#config.directories.exercises.tests; }
    getConfigDir() { return this.#config.directories.config.base; }
    getOutputPdfDir() { return this.#config.directories.output.pdf; }
    getOutputTestDir() { return this.#config.directories.output.test; }
    getOutputZipDir() { return this.#config.directories.output.zip; }
    getBuildDir() { return this.#config.directories.build; }

    getTexShuffledFilePath() { return join(this.getBuildDir(), this.#config.files.shuffledFiles.tex); }
    getJsShuffledFilePath() { return join(this.getBuildDir(), this.#config.files.shuffledFiles.js); }

    getFunctionMappingPath(seed) {
        const filename = this.#config.files.functionMapping.replace('{seed}', seed);
        return join(this.getBuildDir(), filename);
    }

    resolve(...pathSegments) { return resolve(this.#rootDir, ...pathSegments); }
    getConfig() { return this.#config; }
    getMangled() { return this.#config.mangled; }
    getDebug() { return this.#config.debug; }
    getCheckDuplicates() { return this.#config.checkDuplicates; }
    getLanguage() { return this.#config.language; }
}

export default new ConfigLoader();
