const { defaultDeptDatabaseMap, getDepartmentPool } = require('../config/db');

/**
 * Department Data Isolation Middleware
 * Resolves the target department database pool based on the authenticated user and request scope.
 */
function enforceDepartmentIsolation(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated user.' });
  }

  const userRole = req.user.role_name;
  let targetDept = (req.params.departmentCode || req.query.department || req.body.department_code || '').toUpperCase();

  // If user is FACULTY_COORDINATOR or STUDENT, force their assigned department
  if (userRole === 'FACULTY_COORDINATOR' || userRole === 'STUDENT') {
    if (!req.user.department_code) {
      return res.status(403).json({
        success: false,
        message: 'No authorized department mapped to this account.',
      });
    }

    // Block any attempt to query a different department
    if (targetDept && targetDept !== req.user.department_code.toUpperCase()) {
      return res.status(403).json({
        success: false,
        message: `Department isolation violation: You are only authorized to access department '${req.user.department_code}'.`,
      });
    }

    targetDept = req.user.department_code.toUpperCase();
  } else {
    // Institutional roles (ADMIN, TPO_OFFICER, MANAGEMENT) can specify department, or default to CSE if unspecified
    if (!targetDept) {
      targetDept = 'CSE';
    }
  }

  // Validate department exists in supported registry
  if (!defaultDeptDatabaseMap[targetDept]) {
    return res.status(400).json({
      success: false,
      message: `Invalid or unregistered department code: '${targetDept}'.`,
      availableDepartments: Object.keys(defaultDeptDatabaseMap),
    });
  }

  req.departmentCode = targetDept;
  next();
}

module.exports = {
  enforceDepartmentIsolation,
};
