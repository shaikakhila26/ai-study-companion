const { computeTrend } = require('../services/masteryService');

describe('masteryService.computeTrend', () => {
  test('stable when too little history', () => {
    expect(computeTrend([{ value: 0.5 }])).toBe('stable');
  });

  test('improving when recent values trend up', () => {
    const history = [{ value: 0.3 }, { value: 0.35 }, { value: 0.4 }, { value: 0.45 }, { value: 0.5 }];
    expect(computeTrend(history)).toBe('improving');
  });

  test('attention when recent values trend down', () => {
    const history = [{ value: 0.6 }, { value: 0.55 }, { value: 0.5 }, { value: 0.45 }, { value: 0.4 }];
    expect(computeTrend(history)).toBe('attention');
  });

  test('stable when values barely move', () => {
    const history = [{ value: 0.5 }, { value: 0.51 }, { value: 0.49 }, { value: 0.5 }];
    expect(computeTrend(history)).toBe('stable');
  });
});
