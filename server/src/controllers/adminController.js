const { queryCommon, checkDatabaseHealth, defaultDeptDatabaseMap } = require('../config/db');
const { detectCompilers } = require('../services/compilerService');
const { logAuditEvent } = require('../services/auditService');

/**
 * List all users with roles and status
 */
async function getAllUsers(req, res, next) {
  try {
    const { role, department, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (role && role !== 'ALL') {
      whereClause += ' AND role_name = ?';
      params.push(role);
    }

    if (department && department !== 'ALL') {
      whereClause += ' AND department_code = ?';
      params.push(department);
    }

    if (search) {
      whereClause += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const [countRows] = await queryCommon(`SELECT COUNT(*) AS total FROM users ${whereClause}`, params);
    const totalCount = countRows.total;

    const users = await queryCommon(
      `SELECT id, uuid, email, role_name, first_name, last_name, phone, department_code, status, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    res.json({
      success: true,
      data: users,
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
 * Update user status (ACTIVE / SUSPENDED / INACTIVE)
 */
async function updateUserStatus(req, res, next) {
  try {
    const userId = req.params.id;
    const { status, role_name } = req.body;

    await queryCommon(
      `UPDATE users 
       SET status = COALESCE(?, status), role_name = COALESCE(?, role_name)
       WHERE id = ?`,
      [status, role_name, userId]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_USER_ACCOUNT',
      module: 'USER_MANAGEMENT',
      details: { targetUserId: userId, newStatus: status, newRole: role_name },
    });

    res.json({ success: true, message: 'User updated successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Department Database Registry Mappings
 */
async function getDepartmentDatabases(req, res, next) {
  try {
    const registry = await queryCommon(
      `SELECT * FROM department_databases ORDER BY dept_code ASC`
    );

    const dbHealth = await checkDatabaseHealth();

    res.json({
      success: true,
      registry,
      health: dbHealth,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update or configure department database mapping
 */
async function updateDepartmentDatabase(req, res, next) {
  try {
    const deptId = req.params.id;
    const { database_name, is_active } = req.body;

    await queryCommon(
      `UPDATE department_databases 
       SET database_name = COALESCE(?, database_name), is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [database_name, is_active, deptId]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_DEPT_DB_MAPPING',
      module: 'DATABASE_REGISTRY',
      details: { deptId, database_name, is_active },
    });

    res.json({ success: true, message: 'Department database mapping configuration updated.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Search and filter system audit logs
 */
async function getAuditLogs(req, res, next) {
  try {
    const { module: modName, search, limit = 50 } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (modName && modName !== 'ALL') {
      whereClause += ' AND al.module = ?';
      params.push(modName);
    }

    if (search) {
      whereClause += ' AND (al.action LIKE ? OR al.details LIKE ? OR u.email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const logs = await queryCommon(
      `SELECT al.*, u.email AS user_email, u.role_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [...params, parseInt(limit, 10)]
    );

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllUsers,
  updateUserStatus,
  getDepartmentDatabases,
  updateDepartmentDatabase,
  getAuditLogs,
};
