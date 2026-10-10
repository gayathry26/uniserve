const { queryCommon, queryDept } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * List all students with search, filters, and pagination
 */
async function getAllStudents(req, res, next) {
  try {
    const { department, status, minCgpa, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClause = 'WHERE 1=1';
    const params = [];

    // Role department isolation for faculty coordinator
    if (req.user.role_name === 'FACULTY_COORDINATOR') {
      whereClause += ' AND sm.department_code = ?';
      params.push(req.user.department_code);
    } else if (department && department !== 'ALL') {
      whereClause += ' AND sm.department_code = ?';
      params.push(department.toUpperCase());
    }

    if (status && status !== 'ALL') {
      whereClause += ' AND sm.placement_status = ?';
      params.push(status);
    }

    if (minCgpa) {
      whereClause += ' AND sm.cgpa >= ?';
      params.push(parseFloat(minCgpa));
    }

    if (search) {
      whereClause += ' AND (sm.register_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const countSql = `
      SELECT COUNT(*) AS total 
      FROM students_master sm
      JOIN users u ON u.id = sm.user_id
      ${whereClause}
    `;
    const [countRows] = await queryCommon(countSql, params);
    const totalCount = countRows.total;

    const listSql = `
      SELECT sm.*, u.first_name, u.last_name, u.email, u.phone, u.status AS account_status
      FROM students_master sm
      JOIN users u ON u.id = sm.user_id
      ${whereClause}
      ORDER BY sm.cgpa DESC
      LIMIT ? OFFSET ?
    `;
    const students = await queryCommon(listSql, [...params, parseInt(limit, 10), parseInt(offset, 10)]);

    res.json({
      success: true,
      data: students,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get individual student by ID including their department database semester breakdown
 */
async function getStudentById(req, res, next) {
  try {
    const studentId = req.params.id;

    const students = await queryCommon(
      `SELECT sm.*, u.first_name, u.last_name, u.email, u.phone, u.avatar_url
       FROM students_master sm
       JOIN users u ON u.id = sm.user_id
       WHERE sm.id = ?`,
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const student = students[0];

    // Check department isolation: if faculty coordinator, ensure same department
    if (req.user.role_name === 'FACULTY_COORDINATOR' && req.user.department_code !== student.department_code) {
      return res.status(403).json({
        success: false,
        message: 'Department isolation violation: You cannot access students outside your department.',
      });
    }

    // Query Department Database for isolated semester breakdown & mentoring notes
    let academicBreakdown = null;
    let mockEvals = [];
    try {
      const deptRows = await queryDept(
        student.department_code,
        `SELECT * FROM dept_students_academic WHERE register_number = ?`,
        [student.register_number]
      );
      if (deptRows.length > 0) {
        academicBreakdown = deptRows[0];
      }

      mockEvals = await queryDept(
        student.department_code,
        `SELECT * FROM dept_mock_evaluations WHERE register_number = ? ORDER BY evaluation_date DESC`,
        [student.register_number]
      );
    } catch (deptErr) {
      console.warn(`[Student Dept DB] Failed to query ${student.department_code} DB:`, deptErr.message);
    }

    // Documents from common DB
    const documents = await queryCommon(
      `SELECT * FROM student_documents WHERE student_id = ? ORDER BY created_at DESC`,
      [studentId]
    );

    // Applications & Offers
    const applications = await queryCommon(
      `SELECT ja.*, j.title AS job_title, j.ctc_lpa, c.name AS company_name
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       JOIN companies c ON c.id = j.company_id
       WHERE ja.student_id = ?`,
      [studentId]
    );

    res.json({
      success: true,
      student,
      departmentAcademicData: academicBreakdown,
      mockEvaluations: mockEvals,
      documents,
      applications,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update student profile (skills, portfolio, contact links)
 */
async function updateStudentProfile(req, res, next) {
  try {
    const studentId = req.params.id;
    const { skills, linkedin_url, github_url, portfolio_url, phone } = req.body;

    // Ensure student only updates their own profile unless staff
    if (req.user.role_name === 'STUDENT' && req.user.student_id !== parseInt(studentId, 10)) {
      return res.status(403).json({ success: false, message: 'You can only update your own profile.' });
    }

    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : (skills || '[]');

    await queryCommon(
      `UPDATE students_master 
       SET skills = ?, linkedin_url = ?, github_url = ?, portfolio_url = ?
       WHERE id = ?`,
      [skillsJson, linkedin_url || null, github_url || null, portfolio_url || null, studentId]
    );

    if (phone) {
      await queryCommon(
        `UPDATE users u
         JOIN students_master sm ON sm.user_id = u.id
         SET u.phone = ?
         WHERE sm.id = ?`,
        [phone, studentId]
      );
    }

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_PROFILE',
      module: 'STUDENT_PROFILE',
      details: { studentId },
    });

    res.json({ success: true, message: 'Student profile updated successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Mock ERP Import / Sync function
 */
async function syncFromErp(req, res, next) {
  try {
    const { register_number } = req.body;
    // Simulates an ERP adapter reconciliation
    res.json({
      success: true,
      message: `ERP synchronization completed for ${register_number || 'all active students'}. Records validated with institutional registrar.`,
      syncedCount: 1,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudentProfile,
  syncFromErp,
};
