export class LanguagePlugin {
  get extension() {
    throw new Error("Not implemented");
  }
  get namePattern() {
    throw new Error("Not implemented");
  }
  get supportsObfuscation() {
    return false;
  }

  getUtilsPath() {
    throw new Error("Not implemented");
  }
  getTestsDir() {
    throw new Error("Not implemented");
  }

  extractNames(content) {
    throw new Error("Not implemented");
  }
  concatenate(files, testsDir, utilsPath, outputPath) {
    throw new Error("Not implemented");
  }
  obfuscate(seed, inputPath, outputPath, mappingPath) {
    throw new Error("Not implemented");
  }
}
