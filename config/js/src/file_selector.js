import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

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
    #testsDir;
    #texDir;

    constructor(configLoader) {
        if (!configLoader) {
            throw new Error('FileSelector requires a configLoader instance');
        }
        this.#configLoader = configLoader;
        this.#testsDir = resolve(configLoader.getExercisesTestsDir());
        this.#texDir = resolve(configLoader.getExercisesTexDir());
    }

    get testsDir() { return this.#testsDir; }

    getFiles(seed, n) {
        const files = this.#loadFiles();
        this.#validate(files);
        const selected = this.#select(files, seed, n);
        this.#persist(selected);
        return selected;
    }

    #loadFiles() {
        const files = readdirSync(this.#testsDir).filter(f => f.endsWith('.js'));
        if (files.length === 0) {
            throw new Error(`No .js files found in ${this.#testsDir}`);
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
            throw new Error(`N (${n}) exceeds available JS files (${files.length})`);
        }

        files.sort();
        const names = files.map(f => f.replace('.js', ''));
        const rng = seededRandom(seed);
        shuffle(names, rng);

        return names.slice(0, n).map(name => name + '.js');
    }

    #persist(selected) {
        const listPath = this.#configLoader.getJsShuffledFilePath();
        mkdirSync(dirname(listPath), { recursive: true });
        writeFileSync(listPath, selected.map(f => f.replace('.js', '')).join('\n') + '\n');
    }

    #validateNoDuplicateNames(jsFiles) {
        const nameToFiles = {};
        for (const file of jsFiles) {
            const content = readFileSync(join(this.#testsDir, file), 'utf8');
            for (const m of content.matchAll(/functions\.([A-Za-z]+)/g)) {
                (nameToFiles[m[1]] ??= new Set()).add(file);
            }
        }
        const duplicates = Object.entries(nameToFiles).filter(([, files]) => files.size > 1);
        if (duplicates.length > 0) {
            const details = duplicates.map(([name, files]) =>
                `  "${name}" in: ${[...files].join(', ')}`
            ).join('\n');
            throw new Error(`Duplicate function/class names across test files:\n${details}`);
        }
    }

    #validateMatchingTexFiles(jsFiles) {
        if (!existsSync(this.#texDir)) return;

        const texNames = readdirSync(this.#texDir)
            .filter(f => f.endsWith('.tex'))
            .map(f => f.replace('.tex', ''));
        const jsNames = jsFiles.map(f => f.replace('.js', ''));

        const missingJs = texNames.filter(n => !jsNames.includes(n));
        const extraJs = jsNames.filter(n => !texNames.includes(n));

        if (missingJs.length === 0 && extraJs.length === 0) return;

        let msg = 'File mismatch between tests and tex directories:\n';
        if (missingJs.length > 0) {
            msg += `  Missing .js for: ${missingJs.slice(0, 5).join(', ')}`;
            if (missingJs.length > 5) msg += ` (+${missingJs.length - 5} more)`;
            msg += '\n';
        }
        if (extraJs.length > 0) {
            msg += `  Extra .js without .tex: ${extraJs.slice(0, 5).join(', ')}`;
            if (extraJs.length > 5) msg += ` (+${extraJs.length - 5} more)`;
        }
        throw new Error(msg);
    }

    #shouldCheckDuplicates() {
        if (!this.#configLoader.getCheckDuplicates()) return false;
        const flagPath = join(this.#configLoader.getBuildDir(), '.duplicates_checked');
        return !existsSync(flagPath);
    }

    #markDuplicatesChecked() {
        const buildDir = this.#configLoader.getBuildDir();
        mkdirSync(buildDir, { recursive: true });
        writeFileSync(join(buildDir, '.duplicates_checked'), '');
    }
}
