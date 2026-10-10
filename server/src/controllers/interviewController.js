const { queryCommon, queryDept } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * Get interviews list
 */
async function getInterviews(req, res, next) {
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (req.user.role_name === 'STUDENT') {
      whereClause += ' AND i.student_id = ?';
      params.push(req.user.student_id);
    } else if (req.user.role_name === 'FACULTY_COORDINATOR') {
      whereClause += ' AND sm.department_code = ?';
      params.push(req.user.department_code);
    }

    const interviews = await queryCommon(
      `SELECT i.*, j.title AS job_title, c.name AS company_name,
              sm.register_number, sm.department_code, u.first_name, u.last_name, u.email
       FROM interviews i
       JOIN job_applications ja ON ja.id = i.application_id
       JOIN jobs j ON j.id = ja.job_id
       JOIN companies c ON c.id = j.company_id
       JOIN students_master sm ON sm.id = i.student_id
       JOIN users u ON u.id = sm.user_id
       ${whereClause}
       ORDER BY i.scheduled_slot ASC`,
      params
    );

    res.json({ success: true, count: interviews.length, data: interviews });
  } catch (err) {
    next(err);
  }
}

/**
 * Schedule interview slot
 */
async function scheduleInterview(req, res, next) {
  try {
    const { application_id, round_id, scheduled_slot, interviewer_name, meeting_link_or_room } = req.body;

    const [app] = await queryCommon(`SELECT * FROM job_applications WHERE id = ?`, [application_id]);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    await queryCommon(
      `INSERT INTO interviews (application_id, round_id, student_id, interviewer_name, scheduled_slot, meeting_link_or_room, status, decision)
       VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED', 'PENDING')`,
      [application_id, round_id || null, app.student_id, interviewer_name || 'Technical Panel', scheduled_slot, meeting_link_or_room || 'Room 302, Placement Block']
    );

    // Update application state
    await queryCommon(`UPDATE job_applications SET status = 'IN_PROCESS' WHERE id = ?`, [application_id]);

    await logAuditEvent({
      userId: req.user.id,
      action: 'SCHEDULE_INTERVIEW',
      module: 'INTERVIEWS',
      details: { applicationId: application_id, slot: scheduled_slot },
    });

    res.status(201).json({ success: true, message: 'Interview slot scheduled successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit interview evaluation and rating
 */
async function submitInterviewFeedback(req, res, next) {
  try {
    const interviewId = req.params.id;
    const { rating, feedback, decision } = req.body;

    const [interview] = await queryCommon(`SELECT * FROM interviews WHERE id = ?`, [interviewId]);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    await queryCommon(
      `UPDATE interviews 
       SET rating = ?, feedback = ?, decision = ?, status = 'COMPLETED'
       WHERE id = ?`,
      [rating, feedback, decision || 'RECOMMENDED', interviewId]
    );

    // If candidate recommended, advance application or set shortlisted
    if (decision === 'RECOMMENDED') {
      await queryCommon(
        `UPDATE job_applications SET status = 'SHORTLISTED', current_round_number = current_round_number + 1 WHERE id = ?`,
        [interview.application_id]
      );
    } else if (decision === 'NOT_RECOMMENDED') {
      await queryCommon(
        `UPDATE job_applications SET status = 'REJECTED' WHERE id = ?`,
        [interview.application_id]
      );
    }

    res.json({ success: true, message: 'Interview evaluation recorded successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInterviews,
  scheduleInterview,
  submitInterviewFeedback,
};
