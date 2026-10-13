const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryCommon } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const { logAuditEvent } = require('../services/auditService');

/**
 * User Login with email & password
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const identifier = email.trim().toLowerCase();
    const withCollege = identifier.includes('@') ? identifier : `${identifier}@college.edu`;
    const withUniserve = identifier.includes('@') ? identifier : `${identifier}@uniserve.edu`;

    const users = await queryCommon(
      `SELECT u.*, sm.id AS student_id, sm.register_number, sm.cgpa, sm.placement_status,
              sm.batch, sm.graduation_year, COALESCE(sm.academic_year, '2026-2027') AS academic_year,
              COALESCE(sm.department_code, u.department_code) AS final_dept
       FROM users u
       LEFT JOIN students_master sm ON sm.user_id = u.id
       WHERE u.email = ? OR u.email = ? OR u.email = ? OR sm.register_number = ?`,
      [identifier, withCollege, withUniserve, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const user = users[0];

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status.toLowerCase()}. Please contact administrator.`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.',
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        roleId: user.role_id,
        roleName: user.role_name,
        departmentCode: user.final_dept || user.department_code,
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      details: { email: user.email, role: user.role_name },
      departmentCode: user.final_dept || user.department_code,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roleName: user.role_name,
        departmentCode: user.final_dept || user.department_code,
        studentId: user.student_id,
        registerNumber: user.register_number,
        cgpa: user.cgpa,
        placementStatus: user.placement_status,
        batch: user.batch,
        graduationYear: user.graduation_year,
        academicYear: user.academic_year || '2026-2027',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get profile of currently logged-in user
 */
async function getCurrentUser(req, res, next) {
  try {
    const user = req.user;
    res.json({
      success: true,
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roleName: user.role_name,
        departmentCode: user.department_code,
        studentId: user.student_id,
        registerNumber: user.register_number,
        cgpa: user.cgpa,
        placementStatus: user.placement_status,
        batch: user.batch,
        graduationYear: user.graduation_year,
        academicYear: user.academic_year || '2026-2027',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Switch or test portal role (for demo/architect verification with authorized accounts)
 */
async function quickSwitchDemoRole(req, res, next) {
  try {
    const { targetRole } = req.body;
    const demoAccounts = {
      SUPER_ADMIN: 'superadmin@uniserve.edu',
      STUDENT: 'student.cse1@college.edu',
      TPO_OFFICER: 'tpo@college.edu',
      RECRUITER: 'recruiter.google@example.com',
      FACULTY_COORDINATOR: 'hod.cse@college.edu',
      MANAGEMENT: 'principal@college.edu',
      ALUMNI: 'alumni.alex@example.com',
    };

    const targetEmail = demoAccounts[targetRole];
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Invalid demo role requested.' });
    }

    const users = await queryCommon(
      `SELECT u.*, sm.id AS student_id, sm.register_number, sm.cgpa, sm.placement_status,
              sm.batch, sm.graduation_year, COALESCE(sm.academic_year, '2026-2027') AS academic_year,
              COALESCE(sm.department_code, u.department_code) AS final_dept
       FROM users u
       LEFT JOIN students_master sm ON sm.user_id = u.id
       WHERE u.email = ?`,
      [targetEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Demo user not found.' });
    }

    const user = users[0];
    const token = jwt.sign(
      {
        userId: user.id,
        roleId: user.role_id,
        roleName: user.role_name,
        departmentCode: user.final_dept || user.department_code,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: `Switched session to ${user.role_name} portal.`,
      token,
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roleName: user.role_name,
        departmentCode: user.final_dept || user.department_code,
        studentId: user.student_id,
        registerNumber: user.register_number,
        cgpa: user.cgpa,
        placementStatus: user.placement_status,
        batch: user.batch,
        graduationYear: user.graduation_year,
        academicYear: user.academic_year || '2026-2027',
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  getCurrentUser,
  quickSwitchDemoRole,
};
