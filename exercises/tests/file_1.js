test('abc1', () => {
  // Edge case: empty string
  expect(functions.abc1('')).toBe('');
  

  // Random test cases with varying lengths
  callN(
    () => {
      const s = __mg_randomString(30);
      expect(functions.abc1(s)).toBe("hello")
    }
    , __mg__callNGlobalCount)
});
