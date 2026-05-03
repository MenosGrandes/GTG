const crypto = require('crypto');

class FunctionObfuscator {
    constructor(seed) {
        this.seed = seed;
    }

    extractNames(code) {
        const names = new Set();

        // test('functionName', ...)
        for (const m of code.matchAll(/test\s*\(\s*['"](\w+)['"]/g)) {
            if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
        }
        // functions.xxx(...)
        for (const m of code.matchAll(/functions\.(\w+)\s*\(/g)) {
            if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
        }
        // module.exports = { ... }
        const exportsBlock = code.match(/module\.exports\s*=\s*{([^}]+)}/s);
        if (exportsBlock) {
            for (const m of exportsBlock[1].matchAll(/(\w+)(?:\s*[:,])/g)) {
                if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
            }
        }
        // module.exports.xxx = ...
        for (const m of code.matchAll(/module\.exports\.(\w+)\s*=/g)) {
            if (m[1].length >= 2 && /^[a-zA-Z]/.test(m[1])) names.add(m[1]);
        }

        for (const name of names) {
            if (!/^[A-Za-z]+$/.test(name)) {
                throw new Error(`Function name '${name}' is forbidden. Use letters only.`);
            }
        }

        return Array.from(names).sort();
    }

    createMapping(functionNames) {
        const mapping = {};
        const existing = new Set();

        for (const name of functionNames) {
            const obfuscated = this._generateName(name, existing);
            mapping[name] = obfuscated;
            existing.add(obfuscated);
        }

        return mapping;
    }

    applyMapping(code, mapping) {
        let result = code;
        for (const [original, obfuscated] of Object.entries(mapping)) {
            result = result
                .replace(new RegExp(`functions\\.${original}\\b`, 'g'), `functions.${obfuscated}`)
                .replace(new RegExp(`test\\s*\\(\\s*['"]${original}['"]`, 'g'), `test('${obfuscated}'`)
                .replace(new RegExp(`\\b${original}\\s*([,:])`, 'g'), `${obfuscated}$1`);
        }
        return result;
    }

    _generateName(originalName, existingNames) {
        for (let attempt = 0; attempt < 1000; attempt++) {
            const combined = `${this.seed}_${originalName}_${this.seed}_${attempt}`;
            const hash = crypto.createHash('sha256').update(combined).digest('hex').substring(0, 8);
            const name = `fn_${hash}`;
            if (!existingNames.has(name)) return name;
        }
        throw new Error(`Could not generate unique name for ${originalName} after 1000 attempts`);
    }
}

module.exports = FunctionObfuscator;
