test('a', () => {
  // Edge case: empty string
  expect(functions.a('')).toBe('');
  

  // Random test cases with varying lengths
  callN(
    () => {
      const s = __mg_randomString(30);
      expect(functions.a(s)).toBe("hello")
    }
    , __mg__callNGlobalCount)
});
