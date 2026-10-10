// services/aiService.js
const axios = require('axios');
const { parseAIResponse } = require('../utils/utils');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "YOUR_DEEPSEEK_API_KEY";

const aiService = {
  askQuestion: async (difficulty = 'expert', questionseed = '') => {
    const prompt = `You are a technical interviewer generating specific interview questions.

Context
You are evaluating 
${questionseed}

Task
1. Create *exactly three* medium-level viva questions that assess a candidate's understanding of the above context.  
2. Each question must focus on a *different key concept* relevant to the context.  
3. Do *not* include multiple sub-questions or answers inside any single question.  
4. Respond with *only* valid JSON in the format below—no extra text:

{
  "questions": [
    {
      "question": "string",
      "category": "string",
      "difficulty": "string",
      "context": "string"
    }
  ]
}

IMPORTANT: 
- Return ONLY valid JSON in your response
- Do not include any additional text or markdown formatting
- Generate questions that test practical implementation knowledge`;

    try {
      const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a technical interviewer analyzing. Generate specific technical interview questions in valid JSON format. Return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content;
      const parsed = parseAIResponse(content);

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid questions format received from AI');
      }

      return parsed.questions;
    } catch (error) {
      console.error('DeepSeek API error:', error.response?.data || error.message);
      throw new Error('Failed to get response from DeepSeek API');
    }
  },

  evaluateAnswer: async (question, answer, difficulty) => {
    const prompt = `Evaluate this technical interview answer:
  
Question (${difficulty} difficulty): ${question}
Candidate Answer: ${answer}

Provide evaluation in JSON format with these fields:
{
  "technicalAccuracy": number (0-10),
  "relevance": number (0-10),
  "completeness": number (0-10),
  "clarity": number (0-10),
  "feedback": string,
  "score": number (1-10),
  "suggestedImprovements": string
}

IMPORTANT: Return ONLY valid JSON in your response. Do not include any additional text or markdown formatting.`;

    try {
      const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a technical evaluation system. Evaluate technical interview answers with detailed feedback in valid JSON format. Return ONLY valid JSON in your response.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content;
      const evaluation = parseAIResponse(content);
      evaluation.relevanceScore = calculateRelevanceScore(evaluation);

      return evaluation;
    } catch (error) {
      console.error('DeepSeek API error:', error.response?.data || error.message);
      throw new Error('Failed to get evaluation from DeepSeek API');
    }
  }
};

module.exports = aiService;