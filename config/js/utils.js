const functions = require('./functions.js')
// Set global timeout for all tests (in milliseconds)
// This prevents infinite loops and ensures tests complete quickly
jest.setTimeout(10000); // 10 seconds per test
// Run func N times — used by every test to get statistical coverage with random data
function __mg_callN(func, N) {
  for (let i = 0; i < N; i++) func();
}
const callN = __mg_callN;
const __mg__callNGlobalCount = 20;

// Random lowercase ASCII string of length N
function __mg_randomString(N) {
  let s = '';
  for (let i = 0; i < N; i++) s += String.fromCharCode((Math.random() * 26 | 0) + 97);
  return s;
}

// Random integer array of given length, values in [0, max]
function __mg__generateRandomArray(length, max) {
  return Array.from({ length }, () => Math.random() * (max + 1) | 0);
}

// Random integer in [min, max)
function __mg__getRandomInt(min, max) {
  return (Math.random() * (Math.ceil(max) - Math.ceil(min)) | 0) + Math.ceil(min);
}
// Random integer in [min, max)
function __mg_randomInt(min, max) {
  return (Math.random() * (Math.ceil(max) - Math.ceil(min)) | 0) + Math.ceil(min);
}
