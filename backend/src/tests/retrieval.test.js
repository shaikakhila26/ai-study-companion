const { cosineSim } = require('../services/retrievalService');

describe('retrievalService.cosineSim', () => {
  test('identical vectors score 1', () => {
    const v = { a: 2, b: 3 };
    expect(cosineSim(v, v)).toBeCloseTo(1, 5);
  });

  test('orthogonal vectors score 0', () => {
    expect(cosineSim({ a: 1 }, { b: 1 })).toBe(0);
  });

  test('empty vector scores 0, never NaN', () => {
    expect(cosineSim({}, { a: 1 })).toBe(0);
    expect(cosineSim({ a: 1 }, {})).toBe(0);
  });

  test('partial overlap scores between 0 and 1', () => {
    const score = cosineSim({ a: 1, b: 1 }, { a: 1, c: 1 });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});
