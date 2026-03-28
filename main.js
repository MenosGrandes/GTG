const fs = require('fs');
const path = require('path');
const instructionDir = 'tests'
// Helper: Convert string seed to a number for random generation
function seededRandom(seed) {
    const a = 1103515245;
    const c = 12345;
    const m = 2147483648; // 2^31
    let state = seed;

    return function () {
        state = (a * state + c) % m;
        // Handle negative results (JavaScript % can return negative)
        if (state < 0) state += m;
        return state / m;
    };
}

// Fisher-Yates shuffle (must match Lua implementation)
function shuffle(array, rng) {
    const n = array.length;
    for (let i = n; i >= 2; i--) {  // i from n down to 2
        const j = Math.floor(rng() * i) + 1;  // j in [1, i]
        // Swap array[i-1] and array[j-1] (0-indexed)
        [array[i - 1], array[j - 1]] = [array[j - 1], array[i - 1]];
    }
    return array;
}
function removeExtension(filename) {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? filename : filename.slice(0, lastDotIndex);
}
function addJsExtension(filename) {
    return filename + '.js';
}
// Main function to get JS files based on seed and N
function getJSFiles(seed, n) {
    try {
        const dirPath = path.resolve(__dirname, instructionDir); // Adjust as needed
        let files = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));

        if (files.length === 0) {
            return `No .js files found in ${instructionDir} directory.`;
        }

        if (n > files.length) {
            return `Error: N (${n}) exceeds number of available JS files (${files.length}).`;
        }
        let fileTables = files.map(removeExtension);
        const rng = seededRandom(seed);
        shuffle(fileTables, rng); // Shuffle using seed
        const jsFilesShuffled = fileTables.slice(0, n); // Return first N elements
        return jsFilesShuffled.map(addJsExtension)
    } catch (err) {
        return `Error reading files: ${err.message}`;
    }
}

// Main entry point - Parse command-line arguments
if (process.argv.length < 5) {
    console.error("Usage: node script.js <seed> <N> <output>");
    process.exit(1);
}

const seed = process.argv[2];
const N = parseInt(process.argv[3], 10);

if (typeof seed !== 'string' || typeof N !== 'number') {
    console.error("Invalid input. Seed must be a string, N must be a number.");
    process.exit(1);
}

if (N <= 0) {
    console.error("N must be a positive integer.");
    process.exit(1);
}
const outputFilePath = process.argv[4];

const result = getJSFiles(seed, N);
console.log("Shuffled JS files:", result);
const dirPath = path.resolve(__dirname, `${instructionDir}`);

try {
    fs.writeFileSync(outputFilePath, '');
    fs.appendFileSync(outputFilePath, `const functions = require('./functions.js')\n`);

    for (const fileName of result) {
        const filePath = path.join(dirPath, fileName);
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        fs.appendFileSync(outputFilePath, `${fileContent} \n`);
    }

    console.log("All  files have been concatenated into:", outputFilePath);
} catch (err) {
    console.error('Error during concatenation:', err.message);
}

