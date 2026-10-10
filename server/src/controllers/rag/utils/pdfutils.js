const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const logger = require('winston');

async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text.trim();
  } catch (e) {
    logger.error(`Error extracting text from PDF ${filePath}: ${e.message}`);
    return '';
  }
}

module.exports = { extractTextFromPDF };