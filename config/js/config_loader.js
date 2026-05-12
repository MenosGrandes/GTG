import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

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

    constructor(configPath = join(__dirname, '..', '..', 'project.config.json')) {
        this.#rootDir = __dirname;
        this.#configPath = configPath;
        this.#config = deepFreeze(JSON.parse(readFileSync(configPath, 'utf8')));
    }

    get configPath() { return this.#configPath; }

    getExercisesTexDir() { return this.#config.directories.exercises.tex; }
    getExercisesTestsDir() { return this.#config.directories.exercises.tests; }
    getConfigTexDir() { return this.#config.directories.config.tex; }
    getConfigLuaDir() { return this.#config.directories.config.lua; }
    getConfigJsDir() { return this.#config.directories.config.js; }
    getOutputPdfDir() { return this.#config.directories.output.pdf; }
    getOutputTestDir() { return this.#config.directories.output.test; }
    getOutputZipDir() { return this.#config.directories.output.zip; }
    getBuildDir() { return this.#config.directories.build; }

    getUtilsPath() { return join(this.getConfigJsDir(), this.#config.files.utils); }
    getObfuscatorConfigPath() { return join(this.getConfigJsDir(), this.#config.files.obfuscatorConfig); }
    getTexShuffledFilePath() { return join(this.getBuildDir(), this.#config.files.shuffledFiles.tex); }
    getJsShuffledFilePath() { return join(this.getBuildDir(), this.#config.files.shuffledFiles.js); }

    getFunctionMappingPath(seed) {
        const filename = this.#config.files.functionMapping.replace('{seed}', seed);
        return join(this.getBuildDir(), filename);
    }

    getStudentFunctionsPath() { return join(this.getConfigJsDir(), this.#config.files.studentFunctions); }
    resolve(...pathSegments) { return resolve(this.#rootDir, ...pathSegments); }
    getConfig() { return this.#config; }
    getMangled() { return this.#config.mangled; }
    getDebug() { return this.#config.debug; }
    getCheckDuplicates() { return this.#config.checkDuplicates; }
}

export default new ConfigLoader();
