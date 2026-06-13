import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const SOLUTIONS_DIR = "exercises/solutions";
const META_DIR = "exercises/tests";

function computeMetrics(code) {
  const lines = code.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//"));
  const loc = lines.length;

  // Count classes
  const classMatches = code.matchAll(/\bclass\s+(\w+)(?:\s+extends\s+(\w+))?/g);
  const classes = [];
  const inheritance = {};
  for (const m of classMatches) {
    classes.push(m[1]);
    if (m[2]) inheritance[m[1]] = m[2];
  }

  // Count error classes (extend Error)
  const errors = classes.filter((c) => {
    const pattern = new RegExp(`class\\s+${c}\\s+extends\\s+Error`);
    return pattern.test(code);
  });

  // Non-error classes
  const implClasses = classes.filter((c) => !errors.includes(c));

  // Count methods (class methods + prototype methods)
  const methodMatches = [...code.matchAll(/^\s+(\w+)\s*\([^)]*\)\s*\{/gm)];
  const constructors = [...code.matchAll(/^\s+constructor\s*\([^)]*\)\s*\{/gm)];
  const methods = methodMatches.filter((m) => m[1] !== "constructor");

  // Cyclomatic complexity per method
  const methodBodies = extractMethodBodies(code);
  const cyclomatics = methodBodies.map((body) => computeCyclomatic(body));
  const maxCyclomatic = cyclomatics.length > 0 ? Math.max(...cyclomatics) : 0;
  const avgCyclomatic =
    cyclomatics.length > 0
      ? Math.round((cyclomatics.reduce((s, c) => s + c, 0) / cyclomatics.length) * 100) / 100
      : 0;

  // Inheritance depth
  let maxDepth = 0;
  for (const cls of implClasses) {
    let depth = 0;
    let current = cls;
    while (inheritance[current]) {
      depth++;
      current = inheritance[current];
    }
    maxDepth = Math.max(maxDepth, depth);
  }

  // Coupling: how many other classes does each class reference
  const coupling = computeCoupling(code, implClasses);

  // Concepts
  const concepts = detectConcepts(code, implClasses, inheritance, errors);

  return {
    loc,
    classes: implClasses.length,
    errors: errors.length,
    methods: methods.length,
    constructors: constructors.length,
    maxCyclomatic,
    avgCyclomatic,
    inheritanceDepth: maxDepth,
    coupling,
    concepts,
  };
}

function extractMethodBodies(code) {
  const bodies = [];
  const lines = code.split("\n");
  let inMethod = false;
  let braceCount = 0;
  let currentBody = [];

  for (const line of lines) {
    if (!inMethod && /^\s+\w+\s*\([^)]*\)\s*\{/.test(line)) {
      inMethod = true;
      braceCount = 0;
    }
    if (inMethod) {
      currentBody.push(line);
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      if (braceCount <= 0) {
        bodies.push(currentBody.join("\n"));
        currentBody = [];
        inMethod = false;
      }
    }
  }
  return bodies;
}

function computeCyclomatic(body) {
  let complexity = 1;
  const patterns = [
    /\bif\b/g,
    /\belse if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\?\?/g,
    /&&/g,
    /\|\|/g,
    /\?[^.]/g,
  ];
  for (const pattern of patterns) {
    const matches = body.match(pattern);
    if (matches) complexity += matches.length;
  }
  return complexity;
}

function computeCoupling(code, classes) {
  let totalRefs = 0;
  for (const cls of classes) {
    const others = classes.filter((c) => c !== cls);
    for (const other of others) {
      const pattern = new RegExp(`\\b${other}\\b`, "g");
      // Find references to other class within this class's body
      const classBody = extractClassBody(code, cls);
      if (classBody && pattern.test(classBody)) {
        totalRefs++;
      }
    }
  }
  return totalRefs;
}

function extractClassBody(code, className) {
  const startPattern = new RegExp(`class\\s+${className}[^{]*\\{`);
  const match = code.match(startPattern);
  if (!match) return null;
  const startIdx = match.index + match[0].length;
  let braces = 1;
  let i = startIdx;
  while (i < code.length && braces > 0) {
    if (code[i] === "{") braces++;
    if (code[i] === "}") braces--;
    i++;
  }
  return code.slice(startIdx, i);
}

function detectConcepts(code, classes, inheritance, errors) {
  const concepts = [];
  if (Object.keys(inheritance).length > 0) concepts.push("inheritance");
  if (code.includes("super(")) concepts.push("super");
  if (/#\w+/.test(code)) concepts.push("encapsulation");
  if (errors.length > 0) concepts.push("error-handling");
  if (/\bthrow\s+new\b/.test(code)) concepts.push("throw");
  if (/\.prototype\./.test(code) || /Object\.create/.test(code)) concepts.push("prototypes");
  if (/Object\.assign/.test(code)) concepts.push("mixins");
  if (/\bstatic\b/.test(code)) concepts.push("static-methods");
  if (/\bMap\b/.test(code) || /new Map/.test(code)) concepts.push("map");
  if (/\bSet\b/.test(code) || /new Set/.test(code)) concepts.push("set");
  if (/\.reduce\(/.test(code)) concepts.push("reduce");
  if (/\.filter\(/.test(code)) concepts.push("filter");
  if (/\.find\(/.test(code)) concepts.push("find");
  if (/\.sort\(/.test(code)) concepts.push("sort");
  if (/Math\./.test(code)) concepts.push("math");
  if (/Date\.now/.test(code)) concepts.push("timing");
  if (classes.length >= 3) concepts.push("multi-class");
  if (/instanceof/.test(code)) concepts.push("instanceof");
  return concepts;
}

function assignDifficulty(metrics) {
  const { loc, classes, methods, errors, maxCyclomatic, inheritanceDepth, coupling } = metrics;

  // Level 5: 120+ LOC, 4+ classes, inheritance, high cyclomatic or many methods
  if (loc >= 120 && classes >= 4 && inheritanceDepth >= 1 && (maxCyclomatic >= 6 || methods >= 20))
    return 5;

  // Level 4: 3+ classes with inheritance + errors + moderate complexity
  if (classes >= 4 && inheritanceDepth >= 1 && errors >= 2 && (maxCyclomatic >= 4 || methods >= 10))
    return 4;

  // Level 3: 3+ classes with errors, cross-class interaction
  if (classes >= 3 && errors >= 2) return 3;

  // Level 2: moderate LOC or multiple methods or some structural complexity
  if (loc >= 31 && (maxCyclomatic >= 3 || methods >= 5 || classes >= 2)) return 2;

  // Level 1: simple
  return 1;
}

function generateMetaToml(fileNum, metrics, difficulty) {
  const lines = [
    `[exercise]`,
    `difficulty = ${difficulty}`,
    `concepts = [${metrics.concepts.map((c) => `"${c}"`).join(", ")}]`,
    ``,
    `[metrics]`,
    `loc = ${metrics.loc}`,
    `classes = ${metrics.classes}`,
    `methods = ${metrics.methods}`,
    `errors = ${metrics.errors}`,
    `max_cyclomatic = ${metrics.maxCyclomatic}`,
    `avg_cyclomatic = ${metrics.avgCyclomatic}`,
    `inheritance_depth = ${metrics.inheritanceDepth}`,
    `coupling = ${metrics.coupling}`,
  ];
  return lines.join("\n") + "\n";
}

// Main
const files = readdirSync(SOLUTIONS_DIR)
  .filter((f) => f.endsWith(".js"))
  .sort();
const results = [];

for (const file of files) {
  const code = readFileSync(join(SOLUTIONS_DIR, file), "utf8");
  const num = parseInt(file.match(/\d+/)[0]);
  const metrics = computeMetrics(code);
  const difficulty = assignDifficulty(metrics);
  results.push({ file, num, metrics, difficulty });

  const toml = generateMetaToml(num, metrics, difficulty);
  const metaPath = join(META_DIR, file.replace(".js", ".meta.toml"));
  writeFileSync(metaPath, toml);
}

// Print summary table
console.log("File\tD\tLOC\tCls\tMth\tErr\tCC\tInh\tCoup");
console.log("─".repeat(72));
for (const r of results) {
  const m = r.metrics;
  console.log(
    `${r.num}\t${r.difficulty}\t${m.loc}\t${m.classes}\t${m.methods}\t${m.errors}\t${m.maxCyclomatic}\t${m.inheritanceDepth}\t${m.coupling}`,
  );
}

// Distribution
const dist = [0, 0, 0, 0, 0];
for (const r of results) dist[r.difficulty - 1]++;
console.log(
  `\nDistribution: D1=${dist[0]} D2=${dist[1]} D3=${dist[2]} D4=${dist[3]} D5=${dist[4]}`,
);
