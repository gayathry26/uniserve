const { queryCommon } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * Get internships list
 */
async function getInternships(req, res, next) {
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (req.user.role_name === 'STUDENT') {
      whereClause += ' AND i.student_id = ?';
      params.push(req.user.student_id);
    } else if (req.user.role_name === 'FACULTY_COORDINATOR') {
      whereClause += ' AND i.department_code = ?';
      params.push(req.user.department_code);
    }

    const internships = await queryCommon(
      `SELECT i.*, u.first_name, u.last_name, u.email
       FROM internships i
       JOIN students_master sm ON sm.id = i.student_id
       JOIN users u ON u.id = sm.user_id
       ${whereClause}
       ORDER BY i.start_date DESC`,
      params
    );

    res.json({ success: true, count: internships.length, data: internships });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit or record internship opportunity
 */
async function createInternship(req, res, next) {
  try {
    const { company_name, role_title, stipend_monthly, start_date, end_date, ppo_offered } = req.body;
    const studentId = req.user.student_id;

    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Only students can file internship records.' });
    }

    await queryCommon(
      `INSERT INTO internships (student_id, register_number, department_code, company_name, role_title, stipend_monthly, start_date, end_date, status, ppo_offered)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?)`,
      [
        studentId,
        req.user.register_number,
        req.user.department_code,
        company_name,
        role_title,
        stipend_monthly || 0.00,
        start_date,
        end_date,
        ppo_offered ? 1 : 0,
      ]
    );

    res.status(201).json({ success: true, message: 'Internship recorded successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInternships,
  createInternship,
};
