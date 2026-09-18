const { tokenize, termFrequency } = require('./text');

// Splits page-tagged text into overlapping word-count chunks. Overlap keeps
// concepts that straddle a chunk boundary retrievable from either side.
// A real system might chunk by semantic section; this keeps the prototype
// deterministic and dependency-free.
const CHUNK_SIZE_WORDS = 220;
const CHUNK_OVERLAP_WORDS = 40;

function chunkPages(pages) {
  // pages: [{ page: number, text: string }]
  const chunks = [];
  let chunkIndex = 0;

  for (const { page, text } of pages) {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + CHUNK_SIZE_WORDS, words.length);
      const slice = words.slice(start, end).join(' ');
      const tokens = tokenize(slice);
      if (tokens.length > 0) {
        chunks.push({
          page,
          chunkIndex: chunkIndex++,
          text: slice,
          termFreq: termFrequency(tokens),
        });
      }
      if (end === words.length) break;
      start = end - CHUNK_OVERLAP_WORDS;
    }
  }

  return chunks;
}

module.exports = { chunkPages, CHUNK_SIZE_WORDS, CHUNK_OVERLAP_WORDS };
