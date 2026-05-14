const functions = require("./functions.js");
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
  let s = "";
  for (let i = 0; i < N; i++) s += String.fromCharCode(((Math.random() * 26) | 0) + 97);
  return s;
}

// Random integer array of given length, values in [0, max]
function __mg__generateRandomArray(length, max) {
  return Array.from({ length }, () => (Math.random() * (max + 1)) | 0);
}

// Random integer in [min, max)
function __mg__getRandomInt(min, max) {
  return ((Math.random() * (Math.ceil(max) - Math.ceil(min))) | 0) + Math.ceil(min);
}
// Random integer in [min, max)
function __mg_randomInt(min, max) {
  return ((Math.random() * (Math.ceil(max) - Math.ceil(min))) | 0) + Math.ceil(min);
}

// Random float in [min, max) with given decimal places
function __mg_randomFloat(min, max, decimals) {
  const val = Math.random() * (max - min) + min;
  return decimals !== undefined
    ? Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals)
    : val;
}

// Custom matcher: toBePrivateOrUndefined()
// Passes if the received value is undefined (field not publicly accessible).
// Use as: expect(instance.fieldName).toBePrivateOrUndefined()
// Works for both # private fields (never reachable) and missing public properties.
expect.extend({
  toBePrivateOrUndefined(received) {
    if (received === undefined) {
      return {
        pass: true,
        message: () =>
          `Expected property to be publicly accessible, but it was undefined (private or not exposed).`,
      };
    }
    return {
      pass: false,
      message: () =>
        `Expected property to be private (undefined from outside), but got: ${JSON.stringify(received)}.`,
    };
  },
});

// Custom matcher: toThrowClass(ErrorClass)
// Fails with a clear message if ErrorClass is undefined (not exported from functions.js)
// or if the thrown error is not an instance of ErrorClass.
expect.extend({
  toThrowClass(fn, ErrorClass) {
    if (typeof ErrorClass !== "function") {
      return {
        pass: false,
        message: () =>
          `toThrowClass() received ${String(ErrorClass)} instead of a constructor.\n` +
          `Make sure the error class is defined and exported from functions.js.`,
      };
    }
    try {
      fn();
      return {
        pass: false,
        message: () => `Expected function to throw ${ErrorClass.name}, but it did not throw.`,
      };
    } catch (err) {
      if (err instanceof ErrorClass) {
        return { pass: true, message: () => `Expected function not to throw ${ErrorClass.name}.` };
      }
      return {
        pass: false,
        message: () =>
          `Expected function to throw ${ErrorClass.name}, but it threw: ${err && err.constructor ? err.constructor.name : String(err)}.`,
      };
    }
  },
});
