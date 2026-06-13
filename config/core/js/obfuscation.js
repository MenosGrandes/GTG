import { createHash } from "node:crypto";

/**
 * Creates a seed-deterministic name mapping using SHA-256.
 * @param {number} seed - Random seed
 * @param {string[]} names - Sorted list of names to obfuscate
 * @param {string} prefix - Prefix for obfuscated names (e.g. 'fn_', 'Cmp', 'cls_')
 * @returns {Object} Mapping of original → obfuscated names
 */
export function createMapping(seed, names, prefix) {
  const mapping = {};
  const existing = new Set();
  for (const name of names) {
    for (let attempt = 0; attempt < 1000; attempt++) {
      const hash = createHash("sha256")
        .update(`${seed}_${name}_${seed}_${attempt}`)
        .digest("hex")
        .substring(0, 8);
      const obf = `${prefix}${hash}`;
      if (!existing.has(obf)) {
        mapping[name] = obf;
        existing.add(obf);
        break;
      }
    }
  }
  return mapping;
}

/**
 * Applies a name mapping to code using plugin-specific replacer functions.
 * Sorts entries longest-first to prevent partial matches.
 * @param {string} code - Source code to transform
 * @param {Object} mapping - { original: obfuscated } name mapping
 * @param {Function[]} replacers - Array of (code, original, obfuscated) => newCode
 * @returns {string} Transformed code
 */
export function applyMapping(code, mapping, replacers) {
  let result = code;
  const sorted = Object.entries(mapping).sort((a, b) => b[0].length - a[0].length);
  for (const [original, obfuscated] of sorted) {
    for (const replacer of replacers) {
      result = replacer(result, original, obfuscated);
    }
  }
  return result;
}
