const fs = require('fs');
const path = require('path');

class FileSelector {
    constructor(testsDir, texDir) {
        this.testsDir = testsDir;
        this.texDir = texDir;
    }

    getFiles(seed, n) {
        const dirPath = path.resolve(this.testsDir);
        let files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));

        if (files.length === 0) {
            throw new Error(`No .js files found in ${this.testsDir}`);
        }
        if (n > files.length) {
            throw new Error(`N (${n}) exceeds available JS files (${files.length})`);
        }

        this._validateMatchingTexFiles(files);

        files.sort();
        const names = files.map(f => f.replace('.js', ''));
        const rng = FileSelector._seededRandom(parseInt(seed, 10));
        FileSelector._shuffle(names, rng);

        return names.slice(0, n).map(name => name + '.js');
    }

    _validateMatchingTexFiles(jsFiles) {
        if (!this.texDir || !fs.existsSync(this.texDir)) return;

        const texNames = fs.readdirSync(this.texDir)
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

    static _seededRandom(seed) {
        const a = BigInt(1103515245);
        const c = BigInt(12345);
        const m = BigInt(2147483648);
        let state = BigInt(seed);

        return function () {
            state = (a * state + c) % m;
            return Number(state) / Number(m);
        };
    }

    static _shuffle(array, rng) {
        for (let i = array.length; i >= 2; i--) {
            const j = Math.floor(rng() * i) + 1;
            [array[i - 1], array[j - 1]] = [array[j - 1], array[i - 1]];
        }
        return array;
    }
}

module.exports = FileSelector;
