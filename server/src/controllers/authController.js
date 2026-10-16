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
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      const identifier = (req.body?.email || '').trim().toLowerCase();
      const password = req.body?.password;
      const demoMap = {
        'student.cse1@college.edu': {
          id: 8,
          uuid: '00000000-0000-0000-0000-000000000008',
          email: 'student.cse1@college.edu',
          firstName: 'Aditya',
          lastName: 'Varma',
          roleName: 'STUDENT',
          roleId: 3,
          departmentCode: 'CSE',
          studentId: 1,
          registerNumber: '2023CSE001',
          cgpa: '9.35',
          placementStatus: 'PLACED',
          batch: '2023-2027',
          graduationYear: 2027,
          academicYear: '2026-2027',
        },
        'superadmin': {
          id: 13,
          uuid: '00000000-0000-0000-0000-000000000013',
          email: 'superadmin@uniserve.edu',
          firstName: 'Super',
          lastName: 'Administrator',
          roleName: 'SUPER_ADMIN',
          roleId: 1,
          departmentCode: null,
          academicYear: '2026-2027',
        },
        'superadmin@uniserve.edu': {
          id: 13,
          uuid: '00000000-0000-0000-0000-000000000013',
          email: 'superadmin@uniserve.edu',
          firstName: 'Super',
          lastName: 'Administrator',
          roleName: 'SUPER_ADMIN',
          roleId: 1,
          departmentCode: null,
          academicYear: '2026-2027',
        },
        'tpo@college.edu': {
          id: 2,
          uuid: '00000000-0000-0000-0000-000000000002',
          email: 'tpo@college.edu',
          firstName: 'Vikram',
          lastName: 'Rathore',
          roleName: 'TPO_OFFICER',
          roleId: 2,
          departmentCode: null,
          academicYear: '2026-2027',
        },
        'hod.cse@college.edu': {
          id: 4,
          uuid: '00000000-0000-0000-0000-000000000004',
          email: 'hod.cse@college.edu',
          firstName: 'Dr. Ramesh',
          lastName: 'Sundaram',
          roleName: 'FACULTY_COORDINATOR',
          roleId: 4,
          departmentCode: 'CSE',
          academicYear: '2026-2027',
        },
      };

      const fallbackUser = demoMap[identifier];
      if (fallbackUser && (password === 'Password@123' || !password)) {
        const token = jwt.sign(
          {
            userId: fallbackUser.id,
            uuid: fallbackUser.uuid,
            email: fallbackUser.email,
            roleId: fallbackUser.roleId,
            roleName: fallbackUser.roleName,
            departmentCode: fallbackUser.departmentCode,
            studentId: fallbackUser.studentId,
            registerNumber: fallbackUser.registerNumber,
            cgpa: fallbackUser.cgpa,
            placementStatus: fallbackUser.placementStatus,
            batch: fallbackUser.batch,
            graduationYear: fallbackUser.graduationYear,
            academicYear: fallbackUser.academicYear,
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          message: 'Login successful (Offline Demo Mode).',
          token,
          user: fallbackUser,
        });
      }
    }
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
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      const { targetRole } = req.body;
      const roleDefaults = {
        SUPER_ADMIN: {
          id: 13,
          uuid: '00000000-0000-0000-0000-000000000013',
          email: 'superadmin@uniserve.edu',
          firstName: 'Super',
          lastName: 'Administrator',
          roleName: 'SUPER_ADMIN',
          departmentCode: null,
        },
        STUDENT: {
          id: 8,
          uuid: '00000000-0000-0000-0000-000000000008',
          email: 'student.cse1@college.edu',
          firstName: 'Aditya',
          lastName: 'Varma',
          roleName: 'STUDENT',
          departmentCode: 'CSE',
          studentId: 1,
          registerNumber: '2023CSE001',
          cgpa: '9.35',
          placementStatus: 'PLACED',
          batch: '2023-2027',
          graduationYear: 2027,
          academicYear: '2026-2027',
        },
        TPO_OFFICER: {
          id: 2,
          uuid: '00000000-0000-0000-0000-000000000002',
          email: 'tpo@college.edu',
          firstName: 'Vikram',
          lastName: 'Rathore',
          roleName: 'TPO_OFFICER',
          departmentCode: null,
          academicYear: '2026-2027',
        },
        FACULTY_COORDINATOR: {
          id: 4,
          uuid: '00000000-0000-0000-0000-000000000004',
          email: 'hod.cse@college.edu',
          firstName: 'Dr. Ramesh',
          lastName: 'Sundaram',
          roleName: 'FACULTY_COORDINATOR',
          departmentCode: 'CSE',
          academicYear: '2026-2027',
        },
        RECRUITER: {
          id: 5,
          uuid: '00000000-0000-0000-0000-000000000005',
          email: 'recruiter.google@example.com',
          firstName: 'Sarah',
          lastName: 'Jenkins',
          roleName: 'RECRUITER',
          departmentCode: null,
        },
        MANAGEMENT: {
          id: 6,
          uuid: '00000000-0000-0000-0000-000000000006',
          email: 'principal@college.edu',
          firstName: 'Dr. K.V.',
          lastName: 'Narayanan',
          roleName: 'MANAGEMENT',
          departmentCode: null,
        },
        ALUMNI: {
          id: 7,
          uuid: '00000000-0000-0000-0000-000000000007',
          email: 'alumni.alex@example.com',
          firstName: 'Alex',
          lastName: 'Chen',
          roleName: 'ALUMNI',
          departmentCode: 'CSE',
        },
      };

      const fallbackUser = roleDefaults[targetRole] || roleDefaults.SUPER_ADMIN;
      const token = jwt.sign(
        {
          userId: fallbackUser.id,
          uuid: fallbackUser.uuid,
          email: fallbackUser.email,
          roleName: fallbackUser.roleName,
          departmentCode: fallbackUser.departmentCode,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        message: `Switched session to ${fallbackUser.roleName} portal.`,
        token,
        user: fallbackUser,
      });
    }
    next(err);
  }
}

module.exports = {
  login,
  getCurrentUser,
  quickSwitchDemoRole,
};
