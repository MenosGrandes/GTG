const fs = require('fs');
const path = require('path');

class TestConcatenator {
    constructor(testsDir, utilsPath) {
        this.testsDir = testsDir;
        this.utilsPath = utilsPath;
    }

    concatenate(fileNames, outputPath) {
        this._validateFilesExist(fileNames);

        fs.writeFileSync(outputPath, '');

        if (!fs.existsSync(this.utilsPath)) {
            throw new Error(`Utils file not found: ${this.utilsPath}`);
        }
        fs.appendFileSync(outputPath, fs.readFileSync(this.utilsPath, 'utf-8') + '\n');

        for (const fileName of fileNames) {
            const filePath = path.join(this.testsDir, fileName);
            fs.appendFileSync(outputPath, fs.readFileSync(filePath, 'utf8') + ' \n');
        }

        return outputPath;
    }

    _validateFilesExist(fileNames) {
        const missing = fileNames.filter(f => !fs.existsSync(path.join(this.testsDir, f)));
        if (missing.length > 0) {
            throw new Error(
                `Missing test files:\n${missing.map(f => `  - ${path.join(this.testsDir, f)}`).join('\n')}`
            );
        }
    }
}

module.exports = TestConcatenator;
