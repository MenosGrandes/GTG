import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { LanguagePlugin } from '../../core/plugin.js';
import { saveMapping } from '../../core/latex_exporter.js';

export class JavaScriptPlugin extends LanguagePlugin {
    get extension() { return '.js'; }
    get namePattern() { return /functions\.([A-Za-z]+)/g; }
    get supportsObfuscation() { return true; }

    getUtilsPath() { return join('config', 'plugins', 'javascript', 'utils.js'); }
    getTestsDir(config) { return config.getExercisesTestsDir(); }

    extractNames(content) {
        const names = new Set();
        for (const m of content.matchAll(this.namePattern)) {
            names.add(m[1]);
        }
        return [...names];
    }

    concatenate(files, testsDir, utilsPath, outputPath) {
        if (!existsSync(utilsPath)) {
            throw new Error(`Utils file not found: ${utilsPath}`);
        }
        const parts = [readFileSync(utilsPath, 'utf8')];
        for (const file of files) {
            parts.push(readFileSync(join(testsDir, file), 'utf8'));
        }
        writeFileSync(outputPath, parts.join('\n'));
    }

    obfuscate(seed, inputPath, outputPath, mappingPath) {
        const code = readFileSync(inputPath, 'utf8');
        const names = this.#extractAllNames(code);
        const mapping = this.#createMapping(seed, names);
        const mangledCode = this.#applyMapping(code, mapping);
        writeFileSync(outputPath, mangledCode);
        saveMapping(mapping, mappingPath);
        return mapping;
    }

    #extractAllNames(code) {
        const names = new Set();

        for (const m of code.matchAll(/test\s*\(\s*['"](\w+)['"]/g)) {
            if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
        }
        for (const m of code.matchAll(/functions\.(\w+)/g)) {
            if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
        }
        const exportsBlock = code.match(/module\.exports\s*=\s*{([^}]+)}/s);
        if (exportsBlock) {
            for (const m of exportsBlock[1].matchAll(/(\w+)(?:\s*[:,])/g)) {
                if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
            }
        }
        for (const m of code.matchAll(/module\.exports\.(\w+)\s*=/g)) {
            if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
        }

        for (const name of names) {
            if (!/^[A-Za-z]+$/.test(name)) {
                throw new Error(`Function name '${name}' is forbidden. Use letters only.`);
            }
        }
        return [...names].sort();
    }

    #createMapping(seed, names) {
        const mapping = {};
        const existing = new Set();
        for (const name of names) {
            for (let attempt = 0; attempt < 1000; attempt++) {
                const hash = createHash('sha256')
                    .update(`${seed}_${name}_${seed}_${attempt}`)
                    .digest('hex').substring(0, 8);
                const obf = `fn_${hash}`;
                if (!existing.has(obf)) {
                    mapping[name] = obf;
                    existing.add(obf);
                    break;
                }
            }
        }
        return mapping;
    }

    #applyMapping(code, mapping) {
        let result = code;
        const sorted = Object.entries(mapping).sort((a, b) => b[0].length - a[0].length);
        for (const [original, obfuscated] of sorted) {
            if (!/^[A-Za-z]+$/.test(original)) {
                throw new Error(`Invalid function name for mapping: '${original}'`);
            }
            result = result
                .replace(new RegExp(`functions\\.${original}\\b`, 'g'), `functions.${obfuscated}`)
                .replace(new RegExp(`test\\s*\\(\\s*['"]${original}['"]`, 'g'), `test('${obfuscated}'`)
                .replace(new RegExp(`\\b${original}\\s*([,:])`, 'g'), `${obfuscated}$1`);
        }
        return result;
    }
}
