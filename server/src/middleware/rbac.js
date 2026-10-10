/**
 * Role-Based Access Control (RBAC) Middleware
 * @param {string[]} allowedRoles - List of permitted roles
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthenticated request.',
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role_name}' is not authorized to access this resource.`,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
}

module.exports = {
  authorize,
};
