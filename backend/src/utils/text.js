// Small text utilities shared by the chunker and the retrieval scorer.
const STOPWORDS = new Set(
  'a an the and or but if then else for of to in on at by with from as is are was were be been being ' +
  'this that these those it its it\'s i you he she we they them his her our your their not no do does did ' +
  'have has had will would could should can may might must about into over under again further than too very ' +
  's t just don now'.split(' ')
);

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function termFrequency(tokens) {
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  return tf;
}

module.exports = { tokenize, termFrequency, STOPWORDS };
