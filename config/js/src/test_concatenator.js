import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export class TestConcatenator {
  #testsDir;
  #utilsPath;

  constructor(testsDir, utilsPath) {
    this.#testsDir = testsDir;
    this.#utilsPath = utilsPath;
  }

  concatenate(fileNames, outputPath) {
    this.#validateFilesExist(fileNames);

    if (!existsSync(this.#utilsPath)) {
      throw new Error(`Utils file not found: ${this.#utilsPath}`);
    }

    const parts = [readFileSync(this.#utilsPath, "utf8")];
    for (const fileName of fileNames) {
      parts.push(readFileSync(join(this.#testsDir, fileName), "utf8"));
    }

    writeFileSync(outputPath, parts.join("\n"));
    return outputPath;
  }

  #validateFilesExist(fileNames) {
    const missing = fileNames.filter((f) => !existsSync(join(this.#testsDir, f)));
    if (missing.length > 0) {
      throw new Error(
        `Missing test files:\n${missing.map((f) => `  - ${join(this.#testsDir, f)}`).join("\n")}`,
      );
    }
  }
}
