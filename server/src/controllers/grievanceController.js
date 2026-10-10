const { v4: uuidv4 } = require('uuid');
const { queryCommon } = require('../config/db');

/**
 * List grievances (Student sees own, TPO/Admin sees all)
 */
async function getGrievances(req, res, next) {
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (req.user.role_name === 'STUDENT') {
      whereClause += ' AND g.student_id = ?';
      params.push(req.user.student_id);
    }

    const grievances = await queryCommon(
      `SELECT g.*, sm.register_number, u.first_name, u.last_name, u.email
       FROM grievances g
       JOIN students_master sm ON sm.id = g.student_id
       JOIN users u ON u.id = sm.user_id
       ${whereClause}
       ORDER BY g.created_at DESC`,
      params
    );

    res.json({ success: true, count: grievances.length, data: grievances });
  } catch (err) {
    next(err);
  }
}

/**
 * File new grievance ticket
 */
async function fileGrievance(req, res, next) {
  try {
    const { category, subject, description } = req.body;
    const studentId = req.user.student_id;

    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Only students can file placement grievances.' });
    }

    const ticketNumber = `GRV-${Date.now().toString().slice(-6)}`;

    await queryCommon(
      `INSERT INTO grievances (ticket_number, student_id, department_code, category, subject, description, status)
       VALUES (?, ?, ?, ?, ?, ?, 'OPEN')`,
      [ticketNumber, studentId, req.user.department_code, category || 'GENERAL', subject, description]
    );

    res.status(201).json({
      success: true,
      message: `Grievance ticket #${ticketNumber} created successfully. The placement committee will review within 48 hours.`,
      ticketNumber,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Resolve grievance ticket
 */
async function resolveGrievance(req, res, next) {
  try {
    const ticketId = req.params.id;
    const { status, resolution_notes } = req.body;

    await queryCommon(
      `UPDATE grievances SET status = ?, resolution_notes = ? WHERE id = ?`,
      [status || 'RESOLVED', resolution_notes, ticketId]
    );

    res.json({ success: true, message: 'Grievance ticket status updated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getGrievances,
  fileGrievance,
  resolveGrievance,
};
