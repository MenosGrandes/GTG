import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";

function seededRandom(seed) {
  const a = 1103515245n;
  const c = 12345n;
  const m = 2147483648n;
  let state = BigInt(seed);

  return () => {
    state = (a * state + c) % m;
    return Number(state) / Number(m);
  };
}

function shuffle(array, rng) {
  for (let i = array.length; i >= 2; i--) {
    const j = Math.floor(rng() * i) + 1;
    [array[i - 1], array[j - 1]] = [array[j - 1], array[i - 1]];
  }
  return array;
}

export class FileSelector {
  #configLoader;
  #plugin;
  #testsDir;
  #texDir;

  constructor(configLoader, plugin) {
    if (!configLoader) {
      throw new Error("FileSelector requires a configLoader instance");
    }
    if (!plugin) {
      throw new Error("FileSelector requires a language plugin");
    }
    this.#configLoader = configLoader;
    this.#plugin = plugin;
    this.#testsDir = resolve(plugin.getTestsDir(configLoader));
    this.#texDir = resolve(configLoader.getExercisesTexDir());
  }

  get testsDir() {
    return this.#testsDir;
  }
  get plugin() {
    return this.#plugin;
  }

  getFiles(seed, n) {
    const files = this.#loadFiles();
    this.#validate(files);
    const selected = this.#select(files, seed, n);
    this.#persist(selected);
    return selected;
  }

  #loadFiles() {
    const ext = this.#plugin.extension;
    const files = readdirSync(this.#testsDir).filter((f) => f.endsWith(ext));
    if (files.length === 0) {
      throw new Error(`No ${ext} files found in ${this.#testsDir}`);
    }
    return files;
  }

  #validate(files) {
    this.#validateMatchingTexFiles(files);
    if (this.#shouldCheckDuplicates()) {
      this.#validateNoDuplicateNames(files);
      this.#markDuplicatesChecked();
    }
  }

  #select(files, seed, n) {
    if (n > files.length) {
      throw new Error(`N (${n}) exceeds available files (${files.length})`);
    }

    const ext = this.#plugin.extension;
    files.sort();
    const names = files.map((f) => f.replace(ext, ""));
    const rng = seededRandom(seed);
    shuffle(names, rng);

    return names.slice(0, n).map((name) => name + ext);
  }

  #persist(selected) {
    const ext = this.#plugin.extension;
    const listPath = this.#configLoader.getJsShuffledFilePath();
    mkdirSync(dirname(listPath), { recursive: true });
    writeFileSync(listPath, selected.map((f) => f.replace(ext, "")).join("\n") + "\n");
  }

  #validateNoDuplicateNames(files) {
    const nameToFiles = {};
    for (const file of files) {
      const content = readFileSync(join(this.#testsDir, file), "utf8");
      for (const name of this.#plugin.extractNames(content)) {
        (nameToFiles[name] ??= new Set()).add(file);
      }
    }
    const duplicates = Object.entries(nameToFiles).filter(([, files]) => files.size > 1);
    if (duplicates.length > 0) {
      const details = duplicates
        .map(([name, files]) => `  "${name}" in: ${[...files].join(", ")}`)
        .join("\n");
      throw new Error(`Duplicate function/class names across test files:\n${details}`);
    }
  }

  #validateMatchingTexFiles(files) {
    if (!existsSync(this.#texDir)) return;

    const ext = this.#plugin.extension;
    const texNames = readdirSync(this.#texDir)
      .filter((f) => f.endsWith(".tex"))
      .map((f) => f.replace(".tex", ""));
    const testNames = files.map((f) => f.replace(ext, ""));

    const missingTest = texNames.filter((n) => !testNames.includes(n));
    const extraTest = testNames.filter((n) => !texNames.includes(n));

    if (missingTest.length === 0 && extraTest.length === 0) return;

    let msg = "File mismatch between tests and tex directories:\n";
    if (missingTest.length > 0) {
      msg += `  Missing ${ext} for: ${missingTest.slice(0, 5).join(", ")}`;
      if (missingTest.length > 5) msg += ` (+${missingTest.length - 5} more)`;
      msg += "\n";
    }
    if (extraTest.length > 0) {
      msg += `  Extra ${ext} without .tex: ${extraTest.slice(0, 5).join(", ")}`;
      if (extraTest.length > 5) msg += ` (+${extraTest.length - 5} more)`;
    }
    throw new Error(msg);
  }

  #shouldCheckDuplicates() {
    if (!this.#configLoader.getCheckDuplicates()) return false;
    const flagPath = join(this.#configLoader.getBuildDir(), ".duplicates_checked");
    return !existsSync(flagPath);
  }

  #markDuplicatesChecked() {
    const buildDir = this.#configLoader.getBuildDir();
    mkdirSync(buildDir, { recursive: true });
    writeFileSync(join(buildDir, ".duplicates_checked"), "");
  }
}
