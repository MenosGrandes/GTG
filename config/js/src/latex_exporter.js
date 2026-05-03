const fs = require('fs');
const path = require('path');

class LatexExporter {
    static saveMapping(mapping, outputPath) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const content = Object.entries(mapping)
            .map(([orig, obf]) => {
                const escaped = obf.replace(/_/g, '\\_');
                return `\\newcommand{\\func${orig}}{\\texttt{${escaped}}}`;
            })
            .join('\n');

        fs.writeFileSync(outputPath, content);
        return outputPath;
    }
}

module.exports = LatexExporter;
