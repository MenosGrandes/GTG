import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import { FileSelector } from '../../config/core/js/file_selector.js';

vi.mock('node:fs', () => ({
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
}));

import { readdirSync } from 'node:fs';

const TEST_FILES = ['alpha.js', 'beta.js', 'gamma.js', 'delta.js', 'epsilon.js'];

function createMockConfig() {
  return {
    getExercisesTestsDir: () => '/fake/tests',
    getExercisesTexDir: () => '/fake/tex',
    getJsShuffledFilePath: () => '/fake/build/shuffled.txt',
    getBuildDir: () => '/fake/build',
    getCheckDuplicates: () => false,
  };
}

function createMockPlugin() {
  return {
    extension: '.js',
    getTestsDir: () => '/fake/tests',
    extractNames: () => [],
  };
}

function createMapping(seed, names) {
  const mapping = {};
  const existing = new Set();
  for (const name of names) {
    for (let attempt = 0; attempt < 1000; attempt++) {
      const hash = createHash('sha256')
        .update(`${seed}_${name}_${seed}_${attempt}`)
        .digest('hex')
        .substring(0, 8);
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

describe('Determinism', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readdirSync.mockReturnValue(TEST_FILES);
  });

  it('same seed produces identical file selection', () => {
    const config = createMockConfig();
    const plugin = createMockPlugin();

    const selector1 = new FileSelector(config, plugin);
    const result1 = selector1.getFiles(42, 3);

    const selector2 = new FileSelector(config, plugin);
    const result2 = selector2.getFiles(42, 3);

    expect(result1).toEqual(result2);
  });

  it('same seed produces identical mapping', () => {
    const names = ['alpha', 'beta', 'gamma'];

    const result1 = createMapping(42, names);
    const result2 = createMapping(42, names);

    expect(result1).toEqual(result2);
  });

  it('different seeds produce different file lists', () => {
    const config = createMockConfig();
    const plugin = createMockPlugin();

    const selector1 = new FileSelector(config, plugin);
    const result1 = selector1.getFiles(1, 3);

    const selector2 = new FileSelector(config, plugin);
    const result2 = selector2.getFiles(2, 3);

    expect(result1).not.toEqual(result2);
  });
});
