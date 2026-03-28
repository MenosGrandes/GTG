
describe('getRevenueByCategory', () => {
  // --- 1. Happy Path (Podstawowe działanie) ---
  test('powinna poprawnie sumować przychody dla validnych danych', () => {
    const transactions = [
      { id: 1, category: 'Electronics', amount: 1000 },
      { id: 2, category: 'Books', amount: 50 },
      { id: 3, category: 'Electronics', amount: 2000 },
    ];

    const result = functions.getRevenueByCategory(transactions);

    expect(result).toEqual({
      Electronics: 3000,
      Books: 50,
    });
  });

  test('powinna obsługiwać domyślny parametr minAmount (0)', () => {
    const transactions = [
      { category: 'A', amount: 10 },
      { category: 'B', amount: 5 },
    ];

    const result = functions.getRevenueByCategory(transactions);
    expect(result).toEqual({ A: 10, B: 5 });
  });

  // --- 2. Filtracja (minAmount) ---
  test('powinna filtrować transakcje poniżej progu minAmount', () => {
    const transactions = [
      { category: 'A', amount: 100 },
      { category: 'B', amount: 50 }, // Poniżej progu
      { category: 'A', amount: 200 },
    ];

    const result = functions.getRevenueByCategory(transactions, 60);

    expect(result).toEqual({ A: 300 }); // B powinno zostać pominięte
    expect(result.B).toBeUndefined();
  });

  // --- 3. Obsługa Błędów i Invalid Data ---
  test('powinna zwrócić pusty obiekt, gdy input nie jest tablicą', () => {
    expect(functions.getRevenueByCategory(null)).toEqual({});
    expect(functions.getRevenueByCategory(undefined)).toEqual({});
    expect(functions.getRevenueByCategory('string')).toEqual({});
    expect(functions.getRevenueByCategory({})).toEqual({});
    expect(functions.getRevenueByCategory(123)).toEqual({});
  });

  test('powinna ignorować elementy z brakującym category', () => {
    const transactions = [
      { category: 'Valid', amount: 100 },
      { amount: 100 }, // Brak category
      { category: null, amount: 100 }, // Null category
      { category: undefined, amount: 100 },
    ];

    const result = functions.getRevenueByCategory(transactions);
    expect(result).toEqual({ Valid: 100 });
  });

  test('powinna ignorować elementy z niepoprawnym amount', () => {
    const transactions = [
      { category: 'Valid', amount: 100 },
      { category: 'Invalid', amount: '100' }, // String
      { category: 'Invalid', amount: null },
      { category: 'Invalid', amount: NaN },
      { category: 'Invalid' }, // Undefined
    ];

    const result = functions.getRevenueByCategory(transactions);
    expect(result).toEqual({ Valid: 100 });
  });

  test('powinna obsługiwać pustą tablicę', () => {
    expect(functions.getRevenueByCategory([])).toEqual({});
  });

  // --- 4. Immutability (Niezmienność danych) ---
  test('nie powinna mutować oryginalnej tablicy wejściowej', () => {
    const transactions = [
      { id: 1, category: 'A', amount: 100 },
    ];
    
    // Tworzymy głęboką kopię do porównania przed wywołaniem
    const originalCopy = JSON.parse(JSON.stringify(transactions));

    functions.getRevenueByCategory(transactions);

    expect(transactions).toEqual(originalCopy);
  });

  // --- 5. Edge Cases (Przypadki brzegowe) ---
  test('powinna obsługiwać ujemne kwoty zgodnie z logiką minAmount', () => {
    const transactions = [
      { category: 'Refund', amount: -50 },
      { category: 'Sale', amount: 100 },
    ];

    // Domyślnie minAmount = 0, więc -50 powinno być odrzucone (bo -50 < 0)
    const resultDefault = functions.getRevenueByCategory(transactions);
    expect(resultDefault).toEqual({ Sale: 100 });

    // Jeśli minAmount = -100, to -50 powinno zostać wliczone
    const resultNegativeThreshold = functions.getRevenueByCategory(transactions, -100);
    expect(resultNegativeThreshold).toEqual({ Refund: -50, Sale: 100 });
  });
});