const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config/js/config_loader.js');

// Load directories from config
const instructionDir = config.getExercisesTestsDir();

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

process.on('uncaughtException', (err) => {
    console.error('\n' + '='.repeat(80));
    console.error('FATAL ERROR:');
    console.error('='.repeat(80));
    console.error(err.message);
    console.error('');
    console.error('Stack trace:');
    console.error(err.stack);
    console.error('='.repeat(80) + '\n');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n' + '='.repeat(80));
    console.error('FATAL ERROR: Unhandled Promise Rejection');
    console.error('='.repeat(80));
    console.error(reason);
    if (reason && reason.stack) {
        console.error('');
        console.error('Stack trace:');
        console.error(reason.stack);
    }
    console.error('='.repeat(80) + '\n');
    process.exit(1);
});

// ============================================================================
// FUNCTION NAME OBFUSCATION
// ============================================================================

/**
 * Generate deterministic obfuscated function name from original name and seed
 * Each seed produces different names for the same function
 * Includes collision detection
 */
function generateObfuscatedName(originalName, seed, existingNames = new Set()) {
    let attempt = 0;
    let hash, obfuscatedName;
    do {
        // Combine seed with function name for unique hash per seed
        // Add attempt counter to handle collisions
        const combined = `${seed}_${originalName}_${seed}_${attempt}`;
        hash = crypto.createHash('sha256')
            .update(combined)
            .digest('hex')
            .substring(0, 8);
        obfuscatedName = `fn_${hash}`;
        attempt++;
        // Safety limit to prevent infinite loop
        if (attempt > 1000) {
            throw new Error(`Could not generate unique name for ${originalName} after 1000 attempts`);
        }
    } while (existingNames.has(obfuscatedName));
    return obfuscatedName;
}

/**
 * Extract function names from test files
 * Looks for: test('functionName', ...) and functions.functionName(...)
 */
function extractFunctionNames(code) {
    const names = new Set();
    // Method 1: Extract from test() calls: test('functionName', ...)
    const testMatches = code.matchAll(/test\s*\(\s*['"](\w+)['"]/g);
    for (const match of testMatches) {
        // Only add if it's a reasonable function name (at least 2 chars, starts with letter)
        if (match[1].length >= 2 && /^[a-zA-Z]/.test(match[1])) {
            names.add(match[1]);
        }
    }
    // Method 2: Extract from functions.xxx() calls
    const functionCallMatches = code.matchAll(/functions\.(\w+)\s*\(/g);
    for (const match of functionCallMatches) {
        // Only add if it's a reasonable function name (at least 2 chars, starts with letter)
        if (match[1].length >= 2 && /^[a-zA-Z]/.test(match[1])) {
            names.add(match[1]);
        }
    }
    // Method 3: Extract from module.exports (if present)
    const exportsMatch = code.match(/module\.exports\s*=\s*{([^}]+)}/s);
    if (exportsMatch) {
        const exportContent = exportsMatch[1];
        const matches = exportContent.matchAll(/(\w+)(?:\s*[:,])/g);
        for (const match of matches) {
            if (match[1].length >= 2 && /^[a-zA-Z]/.test(match[1])) {
                names.add(match[1]);
            }
        }
    }
    // Method 4: Extract from module.exports.xxx = ...
    const individualExports = code.matchAll(/module\.exports\.(\w+)\s*=/g);
    for (const match of individualExports) {
        if (match[1].length >= 2 && /^[a-zA-Z]/.test(match[1])) {
            names.add(match[1]);
        }
    }
        //validates names only
    names.forEach(name => {
        if (!/^[A-Za-z]+$/.test(name)) {
            throw new Error(`Function name \'${name}\' is forbidden. use letters only`)
        }

    });
    return Array.from(names).sort();
}

/**
 * Rename all function references in code
 */
function renameFunctionsInCode(code, mapping) {
    let result = code;
    for (const [original, obfuscated] of Object.entries(mapping)) {
        // Replace: functions.originalName
        result = result.replace(
            new RegExp(`functions\\.${original}\\b`, 'g'),
            `functions.${obfuscated}`
        );
        // Replace in test names: test('originalName', ...) -> test('obfuscated', ...)
        result = result.replace(
            new RegExp(`test\\s*\\(\\s*['"]${original}['"]`, 'g'),
            `test('${obfuscated}'`
        );
        // Replace in exports: originalName, or originalName:
        result = result.replace(
            new RegExp(`\\b${original}\\s*([,:])`, 'g'),
            `${obfuscated}$1`
        );
    }

    return result;
}

// Helper: Convert string seed to a number for random generation
function seededRandom(seed) {
    const a = 1103515245;
    const c = 12345;
    const m = 2147483648; // 2^31
    let state = seed;

    return function () {
        // Use BigInt for accurate calculation, then convert back
        const bigA = BigInt(a);
        const bigC = BigInt(c);
        const bigM = BigInt(m);
        const bigState = BigInt(state);

        const newState = (bigA * bigState + bigC) % bigM;
        state = Number(newState);

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
    const dirPath = path.resolve(__dirname, instructionDir); // Adjust as needed
    let files = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));

    if (files.length === 0) {
        throw new Error(`No .js files found in ${instructionDir} directory.`);
    }

    if (n > files.length) {
        throw new Error(`N (${n}) exceeds number of available JS files (${files.length}).`);
    }

    // Validate that test files match tex_exercises files
    const texExercisesPath = path.resolve(__dirname, config.getExercisesTexDir());
    if (fs.existsSync(texExercisesPath)) {
        const texFiles = fs.readdirSync(texExercisesPath)
            .filter(file => file.endsWith('.tex'))
            .map(file => file.replace('.tex', ''));

        const jsFiles = files.map(file => file.replace('.js', ''));

        // Check if all tex files have corresponding js files
        const missingJs = texFiles.filter(name => !jsFiles.includes(name));
        const extraJs = jsFiles.filter(name => !texFiles.includes(name));

        if (missingJs.length > 0 || extraJs.length > 0) {
            let errorMsg = `ERROR: File mismatch between ${config.getExercisesTestsDir()}/ and ${config.getExercisesTexDir()}/\n`;
            if (missingJs.length > 0) {
                errorMsg += `Missing .js files for: ${missingJs.slice(0, 5).join(', ')}`;
                if (missingJs.length > 5) errorMsg += ` and ${missingJs.length - 5} more`;
                errorMsg += '\n';
            }
            if (extraJs.length > 0) {
                errorMsg += `Extra .js files without .tex: ${extraJs.slice(0, 5).join(', ')}`;
                if (extraJs.length > 5) errorMsg += ` and ${extraJs.length - 5} more`;
            }
            throw new Error(errorMsg);
        }
    }

    // Sort files alphabetically for deterministic ordering before shuffle
    files.sort();

    let fileTables = files.map(removeExtension);
    const rng = seededRandom(parseInt(seed, 10));
    shuffle(fileTables, rng); // Shuffle using seed
    const jsFilesShuffled = fileTables.slice(0, n); // Return first N elements
    return jsFilesShuffled.map(addJsExtension)
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

// Write JS shuffled files to output for validation
const jsShuffledPath = config.getJsShuffledFilePath();
const jsFileNames = result.map(f => f.replace('.js', ''));
fs.writeFileSync(jsShuffledPath, jsFileNames.join('\n') + '\n');

const dirPath = path.resolve(__dirname, `${instructionDir}`);

// Step 1: Concatenate all test files
fs.writeFileSync(outputFilePath, '');

// Check if utils.js exists and include it
const utilsPath = config.getUtilsPath();
if (fs.existsSync(utilsPath)) {
    const data = fs.readFileSync(utilsPath, 'utf-8');
    fs.appendFileSync(outputFilePath, data + '\n');
    console.log('  ✓ Included utils.js');
} else {
    throw new Error("No utils!")
}

// Validate all test files exist before processing
const missingFiles = [];
for (const fileName of result) {
    const filePath = path.join(dirPath, fileName);
    if (!fs.existsSync(filePath)) {
        missingFiles.push(filePath);
    }
}

if (missingFiles.length > 0) {
    console.error('\n❌ ERROR: Missing test files:');
    missingFiles.forEach(file => console.error(`  - ${file}`));
    console.error(`\nPlease ensure all test files exist in the ${config.getExercisesTestsDir()}/ directory.\n`);
    process.exit(1);
}

// Process all test files
for (const fileName of result) {
    const filePath = path.join(dirPath, fileName);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    fs.appendFileSync(outputFilePath, `${fileContent} \n`);
}

console.log("All files have been concatenated into:", outputFilePath);

// Step 2: Extract function names and create mapping
const concatenatedCode = fs.readFileSync(outputFilePath, 'utf8');
const functionNames = extractFunctionNames(concatenatedCode);

console.log(`Found ${functionNames.length} functions to obfuscate`);

// Generate mapping: original -> obfuscated
const mapping = {};
const existingNames = new Set(); // Track generated names to prevent collisions

functionNames.forEach(name => {
    const obfuscatedName = generateObfuscatedName(name, seed, existingNames);
    mapping[name] = obfuscatedName;
    existingNames.add(obfuscatedName); // Add to set after generation
});

// Step 3: Rename functions in code
const mangledCode = renameFunctionsInCode(concatenatedCode, mapping);
const mangledFilePath = outputFilePath.replace('.js', '.mangled.js');
fs.writeFileSync(mangledFilePath, mangledCode);
console.log(`✓ Functions mangled: ${mangledFilePath}`);

// Step 4: Save mapping for LaTeX (TeX format)
const buildDir = config.getBuildDir();
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}
const texMappingFile = config.getFunctionMappingPath(seed);
const texMapping = Object.entries(mapping)
    .map(([orig, obf]) => {
        // Escape underscores for LaTeX
        const escapedObf = obf.replace(/_/g, '\\_');
        return `\\newcommand{\\func${orig}}{\\texttt{${escapedObf}}}`;
    })
    .join('\n');
fs.writeFileSync(texMappingFile, texMapping);
console.log(`✓ LaTeX mapping saved: ${texMappingFile}`);

// Step 5: Display complete mapping
console.log('\nComplete function mapping:');
Object.entries(mapping).forEach(([orig, obf]) => {
    console.log(`  ${orig} → ${obf}`);
});
