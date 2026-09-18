const { chunkPages } = require('../utils/chunker');

describe('chunker.chunkPages', () => {
  test('splits long pages into multiple overlapping chunks', () => {
    const longText = Array.from({ length: 500 }, (_, i) => `word${i}`).join(' ');
    const chunks = chunkPages([{ page: 1, text: longText }]);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.page).toBe(1);
      expect(Object.keys(c.termFreq).length).toBeGreaterThan(0);
    }
  });

  test('skips empty pages', () => {
    const chunks = chunkPages([{ page: 1, text: '   ' }, { page: 2, text: 'meaningful content about concepts' }]);
    expect(chunks.every((c) => c.page === 2)).toBe(true);
  });

  test('short page yields exactly one chunk', () => {
    const chunks = chunkPages([{ page: 3, text: 'a short page about machine learning concepts' }]);
    expect(chunks.length).toBe(1);
    expect(chunks[0].page).toBe(3);
  });
});
