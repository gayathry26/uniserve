const { callPython } = require('./utils/pythonutils');
const logger = require('winston');

async function getDocuments(req, res) {
  try {
    const result = await callPython('get_documents', {});
    if (!result.success) {
      throw new Error(result.error);
    }
    res.status(200).json({ success: true, documents: result.documents });
  } catch (e) {
    logger.error(`Error retrieving documents: ${e.message}`);
    res.status(500).json({ success: false, error: e.message });
  }
}

async function deleteCollection(req, res) {
  const collectionName = req.params.collection_name.replace(/[^\w\-]/g, '_');
  try {
    const result = await callPython('delete_collection', { collection_name: collectionName });
    if (!result.success) {
      throw new Error(result.error);
    }
    res.status(200).json({ success: true, message: result.message });
  } catch (e) {
    logger.error(`Error deleting collection ${collectionName}: ${e.message}`);
    res.status(500).json({ success: false, error: e.message });
  }
}

async function deleteFile(req, res) {
  const collectionName = req.params.collection_name.replace(/[^\w\-]/g, '_');
  const documentId = req.params.document_id;
  try {
    const inputData = {
      collection_name: collectionName,
      document_id: documentId,
    };
    const result = await callPython('delete_file', inputData);
    if (!result.success) {
      throw new Error(result.error);
    }
    res.status(200).json({ success: true, message: result.message });
  } catch (e) {
    logger.error(`Error deleting file ${documentId} from ${collectionName}: ${e.message}`);
    res.status(500).json({ success: false, error: e.message });
  }
}

module.exports = { getDocuments, deleteCollection, deleteFile };