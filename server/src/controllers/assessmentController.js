const { queryCommon } = require('../config/db');
const { detectCompilers, executeSubmission } = require('../services/compilerService');
const { logAuditEvent } = require('../services/auditService');

/**
 * Get system runtime & compiler availability
 */
async function getRuntimeStatus(req, res, next) {
  try {
    const compilers = await detectCompilers();
    res.json({
      success: true,
      compilers,
      executionLimits: {
        timeoutMs: parseInt(process.env.CODE_EXEC_TIMEOUT_MS || '5000', 10),
        maxOutputBytes: '5 MB',
        sandbox: 'Ephemeral Process Isolation with Non-destructive Privileges',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List all active coding assessments
 */
async function getAllAssessments(req, res, next) {
  try {
    const assessments = await queryCommon(
      `SELECT ca.*, 
              (SELECT COUNT(*) FROM assessment_questions WHERE assessment_id = ca.id) AS total_questions
       FROM coding_assessments ca
       WHERE ca.is_active = 1
       ORDER BY ca.created_at DESC`
    );

    res.json({ success: true, data: assessments });
  } catch (err) {
    next(err);
  }
}

/**
 * Get assessment details and questions
 * (Security rule: Hidden test cases are stripped for student users!)
 */
async function getAssessmentById(req, res, next) {
  try {
    const assessmentId = req.params.id;

    const [assessment] = await queryCommon(
      `SELECT * FROM coding_assessments WHERE id = ?`,
      [assessmentId]
    );

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const isStaff = ['TPO_OFFICER', 'ADMIN', 'FACULTY_COORDINATOR'].includes(req.user.role_name);

    // Retrieve questions
    const questions = await queryCommon(
      `SELECT id, assessment_id, title, difficulty, problem_statement, input_format, output_format,
              constraints, points, time_limit_ms, memory_limit_mb, sample_test_cases
              ${isStaff ? ', hidden_test_cases' : ''}
       FROM assessment_questions
       WHERE assessment_id = ?
       ORDER BY id ASC`,
      [assessmentId]
    );

    // Student previous submissions
    let mySubmissions = [];
    if (req.user.role_name === 'STUDENT') {
      mySubmissions = await queryCommon(
        `SELECT id, question_id, language, execution_status, score, passed_test_cases, total_test_cases, submitted_at
         FROM assessment_submissions
         WHERE assessment_id = ? AND student_id = ?
         ORDER BY submitted_at DESC`,
        [assessmentId, req.user.student_id]
      );
    }

    res.json({
      success: true,
      assessment,
      questions,
      mySubmissions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Execute and submit programming solution
 */
async function submitCodeSolution(req, res, next) {
  try {
    const { assessment_id, question_id, language, source_code } = req.body;
    const studentId = req.user.student_id || req.user.id;
    const registerNumber = req.user.register_number || 'STAFF_TEST';

    if (!assessment_id || !question_id || !language || !source_code) {
      return res.status(400).json({
        success: false,
        message: 'Missing required submission fields (assessment_id, question_id, language, source_code).',
      });
    }

    // Retrieve question and both sample and hidden test cases from common DB
    const [question] = await queryCommon(
      `SELECT * FROM assessment_questions WHERE id = ? AND assessment_id = ?`,
      [question_id, assessment_id]
    );

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found in assessment.' });
    }

    let sampleCases = [];
    let hiddenCases = [];

    try {
      sampleCases = typeof question.sample_test_cases === 'string' 
        ? JSON.parse(question.sample_test_cases) 
        : (question.sample_test_cases || []);
    } catch (e) {}

    try {
      hiddenCases = typeof question.hidden_test_cases === 'string' 
        ? JSON.parse(question.hidden_test_cases) 
        : (question.hidden_test_cases || []);
    } catch (e) {}

    const allTestCases = [
      ...sampleCases.map(s => ({ ...s, isSample: true })),
      ...hiddenCases.map(h => ({ ...h, isSample: false })),
    ];

    // Execute through secure sandbox runner
    const executionResult = await executeSubmission({
      language,
      sourceCode: source_code,
      testCases: allTestCases,
    });

    const executionStatus = executionResult.status || 'RUNTIME_ERROR';
    const passedCount = executionResult.passedTestCases || 0;
    const totalCount = executionResult.totalTestCases || allTestCases.length;
    const calculatedScore = totalCount > 0 ? Math.round((passedCount / totalCount) * (question.points || 25)) : 0;
    const execTimeMs = executionResult.executionTimeMs || 0;
    const errorMsg = executionResult.errorMessage || executionResult.error || null;

    // Record submission to common DB
    await queryCommon(
      `INSERT INTO assessment_submissions (assessment_id, question_id, student_id, register_number, language, source_code, execution_status, passed_test_cases, total_test_cases, score, execution_time_ms, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assessment_id,
        question_id,
        studentId,
        registerNumber,
        language.toLowerCase(),
        source_code,
        executionStatus,
        passedCount,
        totalCount,
        calculatedScore,
        execTimeMs,
        errorMsg,
      ]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'SUBMIT_CODE',
      module: 'ASSESSMENT',
      details: { questionId: question_id, language, status: executionStatus, score: calculatedScore },
      registerNumber,
    });

    res.json({
      success: true,
      executionStatus,
      passedTestCases: passedCount,
      totalTestCases: totalCount,
      score: calculatedScore,
      executionTimeMs: execTimeMs,
      testResults: executionResult.testResults || [],
      errorMessage: errorMsg,
      runtimeMissing: executionResult.runtimeMissing || false,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get assessment leaderboard / submissions
 */
async function getAssessmentLeaderboard(req, res, next) {
  try {
    const assessmentId = req.params.id;

    const leaderboard = await queryCommon(
      `SELECT asub.student_id, asub.register_number, u.first_name, u.last_name, sm.department_code,
              SUM(asub.score) AS total_score,
              COUNT(DISTINCT asub.question_id) AS solved_questions,
              MAX(asub.submitted_at) AS last_submission
       FROM assessment_submissions asub
       JOIN students_master sm ON sm.id = asub.student_id
       JOIN users u ON u.id = sm.user_id
       WHERE asub.assessment_id = ?
       GROUP BY asub.student_id, asub.register_number, u.first_name, u.last_name, sm.department_code
       ORDER BY total_score DESC, last_submission ASC
       LIMIT 50`,
      [assessmentId]
    );

    res.json({ success: true, data: leaderboard });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRuntimeStatus,
  getAllAssessments,
  getAssessmentById,
  submitCodeSolution,
  getAssessmentLeaderboard,
};
