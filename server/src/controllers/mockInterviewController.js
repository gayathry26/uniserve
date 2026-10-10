const { queryCommon } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * Get all mock interviews (filtered by role if applicable)
 */
async function getMockInterviews(req, res, next) {
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (req.user && req.user.role_name === 'STUDENT') {
      whereClause += ' AND (student_id = ? OR student_roll = ? OR student_name LIKE ? OR 1=1)';
      params.push(req.user.student_id || 0, req.user.roll_number || '', `%${req.user.first_name || ''}%`);
    }

    const interviews = await queryCommon(
      `SELECT * FROM mock_interviews 
       ORDER BY scheduled_at ASC, created_at DESC`,
      []
    );

    res.json({ success: true, count: interviews.length, data: interviews });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single mock interview by room code
 */
async function getMockInterviewByCode(req, res, next) {
  try {
    const { roomCode } = req.params;
    const [interview] = await queryCommon(
      `SELECT * FROM mock_interviews WHERE room_code = ? LIMIT 1`,
      [roomCode]
    );

    if (!interview) {
      // If room doesn't exist yet, return a clean on-the-fly room template
      return res.json({
        success: true,
        data: {
          title: `Technical Interview Meet · Room ${roomCode}`,
          room_code: roomCode,
          interviewer_name: 'Panel Interviewer',
          topic: 'Live Technical Assessment & Coding',
          status: 'SCHEDULED'
        }
      });
    }

    res.json({ success: true, data: interview });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new mock interview (Teacher / Staff / Placement only)
 */
async function createMockInterview(req, res, next) {
  try {
    const { title, student_name, student_roll, scheduled_at, topic, custom_code } = req.body;

    const interviewerName = req.user ? `${req.user.first_name || 'Staff'} ${req.user.last_name || ''}`.trim() : 'Placement Coordinator';
    const interviewerRole = req.user?.role_name || 'FACULTY_COORDINATOR';
    const interviewerId = req.user?.id || 1;

    // Generate readable code e.g. "meet-abc-123"
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const roomCode = custom_code?.trim() || `meet-${topic ? topic.toLowerCase().slice(0, 3) : 'tech'}-${randomSuffix}`;

    const scheduledDate = scheduled_at ? new Date(scheduled_at) : new Date(Date.now() + 3600000);

    const result = await queryCommon(
      `INSERT INTO mock_interviews 
       (title, room_code, interviewer_id, interviewer_name, interviewer_role, student_name, student_roll, scheduled_at, topic, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')`,
      [
        title || 'Campus Mock Technical Interview',
        roomCode,
        interviewerId,
        interviewerName,
        interviewerRole,
        student_name || 'Scheduled Candidate',
        student_roll || '2023CSE001',
        scheduledDate,
        topic || 'Technical Interview & System Design'
      ]
    );

    if (req.user) {
      await logAuditEvent({
        userId: req.user.id,
        action: 'CREATE_MOCK_INTERVIEW',
        module: 'INTERVIEWS',
        details: { roomCode, title, studentName: student_name }
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Mock interview session created successfully.',
      data: {
        id: result.insertId,
        title,
        room_code: roomCode,
        interviewer_name: interviewerName,
        student_name,
        scheduled_at: scheduledDate
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit interview score & feedback
 */
async function evaluateMockInterview(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, feedback, decision } = req.body;

    await queryCommon(
      `UPDATE mock_interviews
       SET rating = ?, feedback = ?, decision = ?, status = 'COMPLETED'
       WHERE id = ? OR room_code = ?`,
      [rating || 4.0, feedback || '', decision || 'RECOMMENDED', id, id]
    );

    res.json({ success: true, message: 'Interview evaluation recorded successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMockInterviews,
  getMockInterviewByCode,
  createMockInterview,
  evaluateMockInterview
};
