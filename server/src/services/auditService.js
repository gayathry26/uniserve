const { queryCommon, queryDept } = require('../config/db');

/**
 * Record an audit log entry in central institutional database and optionally in department DB
 */
async function logAuditEvent({ userId, action, module: modName, details, ipAddress = '127.0.0.1', departmentCode = null, registerNumber = null }) {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details);

    // Common DB audit log
    await queryCommon(
      `INSERT INTO audit_logs (user_id, action, module, details, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, action, modName, detailsStr, ipAddress]
    );

    // Department DB audit log if applicable
    if (departmentCode) {
      await queryDept(
        departmentCode,
        `INSERT INTO dept_audit_logs (register_number, action, performed_by, details)
         VALUES (?, ?, ?, ?)`,
        [registerNumber || null, action, String(userId || 'SYSTEM'), detailsStr]
      );
    }
  } catch (err) {
    console.error('[Audit Service Error] Failed to record audit log:', err.message);
  }
}

module.exports = {
  logAuditEvent,
};
