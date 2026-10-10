require('dotenv').config();
// Set the DeepSeek API key
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "YOUR_DEEPSEEK_API_KEY";
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Using axios instead of OpenAI package
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');

// Initialize Express
const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Utility functions
const utils = {
  parseAIResponse: (content) => {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid JSON response from AI');
    }
  },

  getDifficultyInfo: (level) => {
    const levels = {
      expert: "Deep technical questions and system design"
    };
    return levels[level] || levels.expert;
  }
};

// AI Analysis Service - Updated for DeepSeek API
const aiService = {
  askQuestion: async (difficulty = 'expert', questionseed = "") => {
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
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a technical interviewer analyzing. Generate specific technical interview questions in valid JSON format. Return ONLY valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content;
      const parsed = utils.parseAIResponse(content);
      
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
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a technical evaluation system. Evaluate technical interview answers with detailed feedback in valid JSON format. Return ONLY valid JSON in your response."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content;
      const evaluation = utils.parseAIResponse(content);
      evaluation.relevanceScore = calculateRelevanceScore(evaluation);
      
      return evaluation;
    } catch (error) {
      console.error('DeepSeek API error:', error.response?.data || error.message);
      throw new Error('Failed to get evaluation from DeepSeek API');
    }
  }
};

// ... rest of your code remains the same ...
  evaluateAnswer: async (question, answer, difficulty) => {
    const prompt = `
  Evaluate this technical interview answer :
  
  Question (${difficulty} difficulty): ${question}
  Candidate Answer: ${answer}
  
  Provide evaluation in JSON format with these fields:
  {
    "technicalAccuracy": number (0-10),  // How technically correct the answer is
    "relevance": number (0-10),          // How directly the answer addresses the question
    "completeness": number (0-10),       // How thorough the answer is
    "clarity": number (0-10),            // How clear and well-structured the answer is
    "feedback": string,                  // Detailed feedback on the answer
    "score": number (1-10),              // Overall score
    "suggestedImprovements": string      // Specific suggestions for improvement
  }
  
  Evaluation Criteria:
  1. Technical Accuracy (50% weight):
     - Correctness of technical details
     - Appropriate use of terminology
     - Accurate description of systems/components
  
  2. Relevance (30% weight):
     - Directly addresses the question asked
     - Stays focused on the key points
     - Avoids irrelevant information
  
  3. Completeness (20% weight):
     - Covers all important aspects of the question
     - Provides sufficient detail
     - Addresses potential edge cases
 
  IMPORTANT: Return ONLY valid JSON in your response. Do not include any additional text or markdown formatting.
  `;
  
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a technical evaluation system speak like human tamilnadu english. Evaluate technical interview answers with detailed feedback in valid JSON format. Return ONLY valid JSON in your response."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.7
    });
  
    const content = completion.choices[0].message.content;
    const evaluation = utils.parseAIResponse(content);
    
    // Calculate relevance score based on the evaluation
    evaluation.relevanceScore = calculateRelevanceScore(evaluation);
    
    return evaluation;
  }

// Routes
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { difficulty = 'expert', questionseed = "" } = req.body;

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
});

app.post('/api/evaluate-answer', async (req, res) => {
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

    // Calculate relevance score based on the evaluation metrics
    const relevanceScore = calculateRelevanceScore(evaluation);

    res.json({
      success: true,
      feedback: evaluation.feedback,
      score: evaluation.score,
      relevanceScore: relevanceScore,  // Added relevance score
      isRelevant: relevanceScore >= 7,  // Threshold for considering answer relevant
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
});

// New utility function to calculate relevance score
function calculateRelevanceScore(evaluation) {
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
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});