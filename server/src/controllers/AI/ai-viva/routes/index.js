// routes/interviewRoutes.js
const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

router.post('/generate-questions', interviewController.generateQuestions);
router.post('/evaluate-answer', interviewController.evaluateAnswer);

module.exports = router;