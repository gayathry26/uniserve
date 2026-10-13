const jwt = require('jsonwebtoken');
const { queryCommon } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_placement_jwt_secret_key_2026_production_grade';

/**
 * Authenticate JWT token and attach user info
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token missing.',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid, expired, or malformed authentication token.',
      error: err.name,
    });
  }

  try {
    // Fetch live user to ensure active status
    const users = await queryCommon(
      `SELECT u.id, u.uuid, u.email, u.role_id, u.role_name, u.first_name, u.last_name, 
              COALESCE(sm.department_code, u.department_code) AS department_code, u.status,
              sm.id AS student_id, sm.register_number, sm.cgpa, sm.placement_status,
              sm.batch, sm.graduation_year, COALESCE(sm.academic_year, '2026-2027') AS academic_year
       FROM users u
       LEFT JOIN students_master sm ON sm.user_id = u.id
       WHERE u.id = ? AND u.status = 'ACTIVE'`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or inactive account.',
      });
    }

    req.user = users[0];
    next();
  } catch (dbErr) {
    next(dbErr);
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET,
};
