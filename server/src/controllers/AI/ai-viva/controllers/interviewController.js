// controllers/interviewController.js
const aiService = require('../backend/services/aiService');
const { calculateRelevanceScore } = require('../utils/utils');

const interviewController = {
  generateQuestions: async (req, res) => {
    try {
      const { difficulty = 'expert', questionseed = '' } = req.body;

      const questions = await aiService.askQuestion(difficulty, questionseed);

      res.json({
        success: true,
        questions: questions.map(q => ({
          question: q.question,
          difficulty: q.difficulty || difficulty,
          context: q.context || ''
        })),
        difficulty
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({
        error: 'Failed to generate questions',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  evaluateAnswer: async (req, res) => {
    try {
      const { question, answer, difficulty = 'expert' } = req.body;

      if (!question || !answer) {
        return res.status(400).json({ error: 'Question and answer are required' });
      }

      const evaluation = await aiService.evaluateAnswer(question, answer, difficulty);

      // Validate evaluation format
      if (typeof evaluation.score !== 'number' || !evaluation.feedback) {
        throw new Error('Invalid evaluation format received');
      }

      // Calculate relevance score based on the evaluation
      const relevanceScore = calculateRelevanceScore(evaluation);

      res.json({
        success: true,
        feedback: evaluation.feedback,
        score: evaluation.score,
        relevanceScore: relevanceScore,
        isRelevant: relevanceScore >= 7,
        metrics: {
          technicalAccuracy: evaluation.technicalAccuracy,
          completeness: evaluation.completeness,
          clarity: evaluation.clarity,
          relevance: relevanceScore
        },
        suggestedImprovements: evaluation.suggestedImprovements || ''
      });
    } catch (error) {
      console.error('Evaluation error:', error);
      res.status(500).json({
        error: 'Failed to evaluate answer',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = interviewController;