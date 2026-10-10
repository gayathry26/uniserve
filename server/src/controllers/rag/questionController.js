const { callPython } = require('./utils/pythonutils');
const logger = require('winston');

async function askQuestion(req, res) {
  const { question, collection_name } = req.body;
  if (!question) {
    return res.status(400).json({ success: false, error: 'No question provided' });
  }

  try {
    const inputData = {
      question,
      collection_name: collection_name || 'pdf_collection',
    };
    const result = await callPython('ask_question', inputData);
    if (!result.success) {
      throw new Error(result.error);
    }
    res.status(200).json({
      success: true,
      answer: result.answer,
      context_sources: result.context_sources,
      contexts: result.contexts,
    });
  } catch (e) {
    logger.error(`Error processing query: ${e.message}`);
    res.status(500).json({ success: false, error: e.message });
  }
}

module.exports = { askQuestion };