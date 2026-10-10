const utils = {
  parseAIResponse: (content) => {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid JSON response from AI');
    }
  },

  calculateRelevanceScore: (evaluation) => {
    const weights = {
      technicalAccuracy: 0.5,
      completeness: 0.3,
      clarity: 0.2,
    };

    const relevanceScore =
      evaluation.technicalAccuracy * weights.technicalAccuracy +
      evaluation.completeness * weights.completeness +
      evaluation.clarity * weights.clarity;

    return Math.round(relevanceScore * 10) / 10;
  },
};

module.exports = utils;
