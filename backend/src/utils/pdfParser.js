const fs = require('fs');
const pdfParse = require('pdf-parse');

// Extracts per-page text from a PDF. pdf-parse doesn't expose page
// boundaries directly, so we use its pagerender hook to capture text per
// page -- this is what lets citations say "Page 14" instead of just a
// document title.
async function extractPages(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pages = [];

  await pdfParse(dataBuffer, {
    pagerender: async (pageData) => {
      const textContent = await pageData.getTextContent();
      const text = textContent.items.map((item) => item.str).join(' ');
      pages.push({ page: pages.length + 1, text });
      return text;
    },
  });

  return pages.filter((p) => p.text && p.text.trim().length > 0);
}

module.exports = { extractPages };
