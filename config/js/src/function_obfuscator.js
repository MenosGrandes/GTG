import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { saveMapping } from './latex_exporter.js';

export class FunctionObfuscator {
    #seed;

    constructor(seed) {
        this.#seed = seed;
    }

    extractNames(code) {
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

    createMapping(functionNames) {
        const mapping = {};
        const existing = new Set();

        for (const name of functionNames) {
            const obfuscated = this.#generateName(name, existing);
            mapping[name] = obfuscated;
            existing.add(obfuscated);
        }

        return mapping;
    }

    applyMapping(code, mapping) {
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

    mangleFile(inputPath, outputPath, mappingPath) {
        const code = readFileSync(inputPath, 'utf8');
        const names = this.extractNames(code);
        const mapping = this.createMapping(names);
        const mangledCode = this.applyMapping(code, mapping);
        writeFileSync(outputPath, mangledCode);
        saveMapping(mapping, mappingPath);
        return mapping;
    }

    #generateName(originalName, existingNames) {
        for (let attempt = 0; attempt < 1000; attempt++) {
            const combined = `${this.#seed}_${originalName}_${this.#seed}_${attempt}`;
            const hash = createHash('sha256').update(combined).digest('hex').substring(0, 8);
            const name = `fn_${hash}`;
            if (!existingNames.has(name)) return name;
        }
        throw new Error(`Could not generate unique name for ${originalName} after 1000 attempts`);
    }
}
