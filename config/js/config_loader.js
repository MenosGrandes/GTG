/**
 * Configuration loader for project paths
 * Reads from project.config.json and provides path resolution
 */

const fs = require('fs');
const path = require('path');

class ConfigLoader {
    constructor(configPath = './project.config.json') {
        this.rootDir = __dirname;
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    // Directory getters
    getExercisesTexDir() {
        return this.config.directories.exercises.tex;
    }

    getExercisesTestsDir() {
        return this.config.directories.exercises.tests;
    }

    getConfigTexDir() {
        return this.config.directories.config.tex;
    }

    getConfigLuaDir() {
        return this.config.directories.config.lua;
    }

    getConfigJsDir() {
        return this.config.directories.config.js;
    }

    getOutputPdfDir() {
        return this.config.directories.output.pdf;
    }

    getOutputTestDir() {
        return this.config.directories.output.test;
    }

    getOutputZipDir() {
        return this.config.directories.output.zip;
    }

    getBuildDir() {
        return this.config.directories.build;
    }

    // File path getters
    getUtilsPath() {
        return path.join(this.getConfigJsDir(), this.config.files.utils);
    }

    getObfuscatorConfigPath() {
        return path.join(this.getConfigJsDir(), this.config.files.obfuscatorConfig);
    }

    getTexShuffledFilePath() {
        return path.join(this.getBuildDir(), this.config.files.shuffledFiles.tex);
    }

    getJsShuffledFilePath() {
        return path.join(this.getBuildDir(), this.config.files.shuffledFiles.js);
    }

    getFunctionMappingPath(seed) {
        const filename = this.config.files.functionMapping.replace('{seed}', seed);
        return path.join(this.getBuildDir(), filename);
    }

    getStudentFunctionsPath() {
        return path.join(this.getConfigJsDir(), this.config.files.studentFunctions);
    }

    // Resolve absolute path
    resolve(...pathSegments) {
        return path.resolve(this.rootDir, ...pathSegments);
    }

    // Get all config as object (for passing to other modules)
    getConfig() {
        return this.config;
    }
}

// Export singleton instance
module.exports = new ConfigLoader();
