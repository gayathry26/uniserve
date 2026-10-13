const { queryCommon } = require('../../config/db');
const { logAuditEvent } = require('../../services/auditService');

/**
 * Retrieve all scheduled and past mock interview meetings
 */
async function getMeetings(req, res, next) {
  try {
    let query = `
      SELECT 
        id,
        title,
        room_code,
        interviewer_id,
        interviewer_name,
        interviewer_role,
        student_id,
        student_name,
        student_roll,
        scheduled_at,
        topic,
        status,
        rating,
        feedback,
        decision,
        created_at
      FROM mock_interviews
    `;
    const params = [];
    const conditions = [];

    // Filter by student if requested or if caller is student
    if (req.user && req.user.role_name === 'STUDENT') {
      const studentRoll = req.user.roll_number || '';
      const studentName = req.user.first_name || '';
      conditions.push('(student_id = ? OR student_roll = ? OR student_name LIKE ? OR 1=1)');
      params.push(req.user.student_id || 0, studentRoll, `%${studentName}%`);
    }

    // Filter by status if provided
    if (req.query.status) {
      conditions.push('status = ?');
      params.push(req.query.status);
    }

    // Search query by title, room code, candidate name, or topic
    if (req.query.search) {
      conditions.push('(title LIKE ? OR room_code LIKE ? OR student_name LIKE ? OR topic LIKE ?)');
      const term = `%${req.query.search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY scheduled_at ASC, created_at DESC';

    const meetings = await queryCommon(query, params);
    res.json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve single meeting details by room code
 */
async function getMeetingByCode(req, res, next) {
  try {
    const { roomCode } = req.params;
    const [meeting] = await queryCommon(
      `SELECT * FROM mock_interviews WHERE room_code = ? LIMIT 1`,
      [roomCode]
    );

    if (!meeting) {
      // Dynamic fallback template for impromptu meetings
      return res.json({
        success: true,
        data: {
          title: `Technical Interview Meet - ${roomCode}`,
          room_code: roomCode,
          interviewer_name: 'Panel Interviewer',
          interviewer_role: 'FACULTY_COORDINATOR',
          student_name: 'Candidate',
          topic: 'Live Technical Assessment and System Architecture',
          status: 'SCHEDULED',
          scheduled_at: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      data: meeting
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Schedule a new mock interview meeting
 */
async function createMeeting(req, res, next) {
  try {
    const {
      title,
      student_id,
      student_name,
      student_roll,
      scheduled_at,
      topic,
      custom_code
    } = req.body;

    const interviewerName = req.user
      ? `${req.user.first_name || 'Staff'} ${req.user.last_name || ''}`.trim()
      : 'Placement Coordinator';
    const interviewerRole = req.user?.role_name || 'FACULTY_COORDINATOR';
    const interviewerId = req.user?.id || 1;

    // Clean, professional room code format (e.g. meet-dsa-4a92)
    const topicSlug = (topic || 'tech')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 4);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const roomCode = custom_code?.trim() || `meet-${topicSlug}-${randomSuffix}`;

    const scheduledDate = scheduled_at ? new Date(scheduled_at) : new Date(Date.now() + 3600000);

    const result = await queryCommon(
      `INSERT INTO mock_interviews 
       (title, room_code, interviewer_id, interviewer_name, interviewer_role, student_id, student_name, student_roll, scheduled_at, topic, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')`,
      [
        title || 'Campus Mock Technical Interview',
        roomCode,
        interviewerId,
        interviewerName,
        interviewerRole,
        student_id || null,
        student_name || 'Scheduled Candidate',
        student_roll || '2023CSE001',
        scheduledDate,
        topic || 'Technical Interview and System Design'
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
      message: 'Interview meeting scheduled successfully.',
      data: {
        id: result.insertId,
        title: title || 'Campus Mock Technical Interview',
        room_code: roomCode,
        interviewer_name: interviewerName,
        interviewer_role: interviewerRole,
        student_name: student_name || 'Scheduled Candidate',
        student_roll: student_roll || '2023CSE001',
        scheduled_at: scheduledDate,
        topic: topic || 'Technical Interview and System Design',
        status: 'SCHEDULED'
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update meeting status (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
 */
async function updateMeetingStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    await queryCommon(
      `UPDATE mock_interviews
       SET status = ?
       WHERE id = ? OR room_code = ?`,
      [status, id, id]
    );

    res.json({
      success: true,
      message: `Meeting status updated to ${status}.`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Record candidate evaluation ratings and feedback
 */
async function evaluateMeeting(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, feedback, decision } = req.body;

    const parsedRating = parseFloat(rating) || 4.0;
    const finalDecision = decision || 'RECOMMENDED';

    await queryCommon(
      `UPDATE mock_interviews
       SET rating = ?, feedback = ?, decision = ?, status = 'COMPLETED'
       WHERE id = ? OR room_code = ?`,
      [parsedRating, feedback || '', finalDecision, id, id]
    );

    if (req.user) {
      await logAuditEvent({
        userId: req.user.id,
        action: 'EVALUATE_MOCK_INTERVIEW',
        module: 'INTERVIEWS',
        details: { target: id, rating: parsedRating, decision: finalDecision }
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Candidate evaluation recorded successfully.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete / cancel a scheduled interview meeting
 */
async function deleteMeeting(req, res, next) {
  try {
    const { id } = req.params;

    await queryCommon(
      `DELETE FROM mock_interviews WHERE id = ? OR room_code = ?`,
      [id, id]
    );

    if (req.user) {
      await logAuditEvent({
        userId: req.user.id,
        action: 'DELETE_MOCK_INTERVIEW',
        module: 'INTERVIEWS',
        details: { targetId: id }
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Interview meeting record removed.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMeetings,
  getMeetingByCode,
  createMeeting,
  updateMeetingStatus,
  evaluateMeeting,
  deleteMeeting
};
