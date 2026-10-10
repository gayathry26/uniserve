// utils/utils.js
const calculateRelevanceScore = (evaluation) => {
  // Weighted average calculation
  const weights = {
    technicalAccuracy: 0.5,
    completeness: 0.3,
    clarity: 0.2
  };

  const relevanceScore = (
    (evaluation.technicalAccuracy * weights.technicalAccuracy) +
    (evaluation.completeness * weights.completeness) +
    (evaluation.clarity * weights.clarity)
  );

  // Round to 1 decimal place
  return Math.round(relevanceScore * 10) / 10;
};

const parseAIResponse = (content) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Invalid JSON response from AI');
  }
};

const getDifficultyInfo = (level) => {
  const levels = {
    expert: 'Deep technical questions and system design'
  };
  return levels[level] || levels.expert;
};

module.exports = {
  calculateRelevanceScore,
  parseAIResponse,
  getDifficultyInfo
};