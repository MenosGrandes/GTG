test('reverseString', () => {
  function reverseString(str) {
    return str.split('').reverse().join('');
  }
  
  // Edge case: empty string
  expect(functions.reverseString('')).toBe(reverseString(''));
  
  // Edge case: single character
  const singleChar = __mg_randomString(1);
  expect(functions.reverseString(singleChar)).toBe(reverseString(singleChar));
  
  // Edge case: two characters
  const twoChars = __mg_randomString(2);
  expect(functions.reverseString(twoChars)).toBe(reverseString(twoChars));
  
  // Edge case: short strings (3-5 chars)
  const shortStr = __mg_randomString(__mg_randomInt(3, 5));
  expect(functions.reverseString(shortStr)).toBe(reverseString(shortStr));
  
  // Edge case: string with spaces
  const strWithSpaces = __mg_randomString(10) + ' ' + __mg_randomString(10);
  expect(functions.reverseString(strWithSpaces)).toBe(reverseString(strWithSpaces));
  
  // Edge case: string with special characters
  const specialChars = '!@#$%^&*()';
  const strWithSpecial = __mg_randomString(5) + specialChars[__mg_randomInt(0, specialChars.length - 1)] + __mg_randomString(5);
  expect(functions.reverseString(strWithSpecial)).toBe(reverseString(strWithSpecial));
  
  // Edge case: string with newlines and tabs
  const strWithWhitespace = __mg_randomString(5) + '\n' + __mg_randomString(5) + '\t' + __mg_randomString(5);
  expect(functions.reverseString(strWithWhitespace)).toBe(reverseString(strWithWhitespace));
  
  // Random test cases with varying lengths
  callN(
    () => {
      const s = __mg_randomString(30);
      expect(functions.reverseString(s)).toBe(reverseString(s))
    }
    , __mg__callNGlobalCount)
});
