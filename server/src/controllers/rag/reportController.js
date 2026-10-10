const path = require('path');
const { sanitizeFilename } = require('./utils/sanitize');
const { extractTextFromPDF } = require('./utils/pdfutils');
const { callPython } = require('./utils/pythonutils');
const logger = require('winston');

async function uploadReport(req, res) {
  if (!req.files || !req.body.collection_name) {
    return res.status(400).json({ success: false, error: 'Missing file or collection name' });
  }

  const collectionName = req.body.collection_name.replace(/[^\w\-]/g, '_').trim();
  if (!collectionName) {
    return res.status(400).json({ success: false, error: 'Collection name is required' });
  }

  const documentIds = [];
  for (const file of req.files) {
    try {
      const filename = sanitizeFilename(file.originalname);
      const filePath = path.join(__dirname, '../uploads/rag', filename);

      // Extract text
      const text = await extractTextFromPDF(filePath);
      if (!text) {
        return res.status(400).json({ success: false, error: `Failed to extract text from ${filename}` });
      }

      // Call Python for chunking, embedding, and storing
      const inputData = {
        text,
        filename,
        collection_name: collectionName,
      };
      const result = await callPython('upload', inputData);

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      documentIds.push(result.document);
    } catch (e) {
      logger.error(`Error processing file ${file.originalname}: ${e.message}`);
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  res.status(200).json({ success: true, documents: documentIds });
}

module.exports = { uploadReport };