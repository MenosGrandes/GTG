test('reverseString', () => {
  function a(str) {
    return str;
  }
  callN(
    () => {
      const s = __mg__random(30);
      expect(functions.a(s)).toBe(a(s))
    }
    , __mg__callNGlobalCount)
});
