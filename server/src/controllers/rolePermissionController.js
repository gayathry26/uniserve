const { queryCommon } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

// Master list of all 21 Uniserve application pages
const ALL_PAGES = [
  { path: '/', label: 'Placement Dashboard', category: 'Core & Overview' },
  { path: '/students', label: 'Students Roster', category: 'Student Management' },
  { path: '/profile', label: 'My Student Profile', category: 'Student Management' },
  { path: '/companies', label: 'Hiring Companies', category: 'Recruitment & Drives' },
  { path: '/jobs', label: 'Jobs & Openings', category: 'Recruitment & Drives' },
  { path: '/drives', label: 'Placement Drives', category: 'Recruitment & Drives' },
  { path: '/applications', label: 'Applications Pipeline', category: 'Applications & Evaluation' },
  { path: '/assessment', label: 'Programming Assessment', category: 'Applications & Evaluation' },
  { path: '/interviews', label: 'Interview Slots', category: 'Applications & Evaluation' },
  { path: '/videocall/interview', label: 'Mock Video Call Meet', category: 'Applications & Evaluation' },
  { path: '/training', label: 'Training & Attendance', category: 'Career Development' },
  { path: '/internships', label: 'Internships & PPO', category: 'Career Development' },
  { path: '/offers', label: 'Offers & Joining', category: 'Career Development' },
  { path: '/policies', label: 'Placement Policies', category: 'Governance & Institutional' },
  { path: '/reports', label: 'NIRF / NAAC Reports', category: 'Governance & Institutional' },
  { path: '/finance', label: 'Budget & Finance', category: 'Governance & Institutional' },
  { path: '/alumni', label: 'Alumni Network', category: 'Community & Support' },
  { path: '/grievances', label: 'Grievance Desk', category: 'Community & Support' },
  { path: '/ai-assistant', label: 'AI Career Assistant', category: 'Intelligence & Tools' },
  { path: '/admin', label: 'Admin & DB Registry', category: 'System Administration' },
  { path: '/settings', label: 'Settings & Themes', category: 'System Administration' },
];

const ALL_PAGE_PATHS = ALL_PAGES.map((p) => p.path);

const USER_ROLES = [
  { id: 'SUPER_ADMIN', label: 'Master Super Administrator', desc: 'Absolute root administrator with unrestricted access to all modules' },
  { id: 'TPO_OFFICER', label: 'Placement Officer (TPO)', desc: 'Placement director orchestrating campus drives and corporate partnerships' },
  { id: 'STUDENT', label: 'Student Candidate', desc: 'Enrolled university candidate participating in recruitment & coding tests' },
  { id: 'FACULTY_COORDINATOR', label: 'Dept Coordinator (Staff/Faculty)', desc: 'Academic department placement coordinator and attendance mentor' },
  { id: 'RECRUITER', label: 'Company Recruiter', desc: 'Corporate hiring manager or technical interviewer' },
  { id: 'MANAGEMENT', label: 'Management / Principal', desc: 'Dean, Principal, and Executive Leadership' },
  { id: 'ALUMNI', label: 'Alumni Network', desc: 'Graduated alumni providing mentorship and referrals' },
];

const DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: ALL_PAGE_PATHS,
  TPO_OFFICER: [
    '/',
    '/students',
    '/companies',
    '/jobs',
    '/drives',
    '/applications',
    '/assessment',
    '/interviews',
    '/videocall/interview',
    '/training',
    '/internships',
    '/offers',
    '/policies',
    '/reports',
    '/finance',
    '/alumni',
    '/grievances',
    '/ai-assistant',
    '/settings',
  ],
  STUDENT: [
    '/profile',
    '/companies',
    '/jobs',
    '/drives',
    '/applications',
    '/assessment',
    '/interviews',
    '/videocall/interview',
    '/training',
    '/internships',
    '/offers',
    '/policies',
    '/alumni',
    '/grievances',
    '/ai-assistant',
    '/settings',
  ],
  FACULTY_COORDINATOR: [
    '/',
    '/students',
    '/companies',
    '/jobs',
    '/drives',
    '/applications',
    '/assessment',
    '/interviews',
    '/videocall/interview',
    '/training',
    '/internships',
    '/offers',
    '/policies',
    '/reports',
    '/alumni',
    '/grievances',
    '/ai-assistant',
    '/settings',
  ],
  RECRUITER: [
    '/',
    '/jobs',
    '/drives',
    '/applications',
    '/assessment',
    '/interviews',
    '/videocall/interview',
    '/offers',
    '/policies',
    '/settings',
  ],
  MANAGEMENT: [
    '/',
    '/students',
    '/companies',
    '/jobs',
    '/drives',
    '/offers',
    '/policies',
    '/reports',
    '/finance',
    '/grievances',
    '/settings',
  ],
  ALUMNI: [
    '/alumni',
    '/jobs',
    '/policies',
    '/grievances',
    '/ai-assistant',
    '/settings',
  ],
};

/**
 * Fetch all role permissions from MySQL backend
 */
async function getRolePermissions(req, res, next) {
  try {
    const rows = await queryCommon('SELECT role_name, allowed_pages FROM role_permissions');

    const permissions = { ...DEFAULT_PERMISSIONS };

    if (rows && rows.length > 0) {
      for (const row of rows) {
        try {
          const parsed = typeof row.allowed_pages === 'string'
            ? JSON.parse(row.allowed_pages)
            : row.allowed_pages;
          permissions[row.role_name] = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.warn(`[Permissions] Error parsing allowed_pages for ${row.role_name}:`, e.message);
        }
      }
    }

    // Enforce that SUPER_ADMIN always has 100% of all pages
    permissions.SUPER_ADMIN = ALL_PAGE_PATHS;

    res.json({
      success: true,
      permissions,
      allPages: ALL_PAGES,
      userRoles: USER_ROLES,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch allowed pages for the authenticated user's role
 */
async function getCurrentUserPermissions(req, res, next) {
  try {
    const roleName = req.user?.roleName || 'STUDENT';

    if (roleName === 'SUPER_ADMIN') {
      return res.json({
        success: true,
        roleName,
        isSuperAdmin: true,
        allowedPages: ALL_PAGE_PATHS,
      });
    }

    const rows = await queryCommon(
      'SELECT allowed_pages FROM role_permissions WHERE role_name = ?',
      [roleName]
    );

    let allowedPages = DEFAULT_PERMISSIONS[roleName] || [];
    if (rows && rows.length > 0) {
      try {
        const parsed = typeof rows[0].allowed_pages === 'string'
          ? JSON.parse(rows[0].allowed_pages)
          : rows[0].allowed_pages;
        if (Array.isArray(parsed)) {
          allowedPages = parsed;
        }
      } catch (e) {
        console.warn(`[Permissions] Error parsing allowed_pages for ${roleName}:`, e.message);
      }
    }

    res.json({
      success: true,
      roleName,
      isSuperAdmin: false,
      allowedPages,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update role permissions in MySQL database (Restricted to SUPER_ADMIN)
 */
async function updateRolePermissions(req, res, next) {
  try {
    const { roleName, allowedPages, permissions } = req.body;

    // Support either single role update or batch update
    if (permissions && typeof permissions === 'object') {
      for (const [rName, pages] of Object.entries(permissions)) {
        if (rName === 'SUPER_ADMIN') continue; // SUPER_ADMIN always keeps all pages

        const pagesJson = JSON.stringify(Array.isArray(pages) ? pages : []);
        await queryCommon(
          `INSERT INTO role_permissions (role_name, allowed_pages)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE allowed_pages = VALUES(allowed_pages)`,
          [rName, pagesJson]
        );
      }
    } else if (roleName && Array.isArray(allowedPages)) {
      if (roleName !== 'SUPER_ADMIN') {
        const pagesJson = JSON.stringify(allowedPages);
        await queryCommon(
          `INSERT INTO role_permissions (role_name, allowed_pages)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE allowed_pages = VALUES(allowed_pages)`,
          [roleName, pagesJson]
        );
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload. Provide either { roleName, allowedPages } or { permissions }.',
      });
    }

    if (req.user) {
      await logAuditEvent({
        userId: req.user.id || 1,
        action: 'UPDATE_ROLE_PERMISSIONS',
        module: 'PERMISSIONS',
        details: { updatedRole: roleName || 'BATCH_ALL', updatedBy: req.user.email },
        departmentCode: req.user.departmentCode || null,
      });
    }

    // Return the updated full permissions matrix
    const rows = await queryCommon('SELECT role_name, allowed_pages FROM role_permissions');
    const updated = { ...DEFAULT_PERMISSIONS };
    for (const row of rows) {
      try {
        const parsed = typeof row.allowed_pages === 'string'
          ? JSON.parse(row.allowed_pages)
          : row.allowed_pages;
        updated[row.role_name] = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // ignore
      }
    }
    updated.SUPER_ADMIN = ALL_PAGE_PATHS;

    res.json({
      success: true,
      message: 'Role permissions saved to database successfully.',
      permissions: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset role permissions to factory defaults in MySQL
 */
async function resetRolePermissions(req, res, next) {
  try {
    for (const [rName, pages] of Object.entries(DEFAULT_PERMISSIONS)) {
      await queryCommon(
        `INSERT INTO role_permissions (role_name, allowed_pages)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE allowed_pages = VALUES(allowed_pages)`,
        [rName, JSON.stringify(pages)]
      );
    }

    if (req.user) {
      await logAuditEvent({
        userId: req.user.id || 1,
        action: 'RESET_ROLE_PERMISSIONS',
        module: 'PERMISSIONS',
        details: { resetBy: req.user.email },
        departmentCode: req.user.departmentCode || null,
      });
    }

    res.json({
      success: true,
      message: 'Permissions reset to system defaults in database.',
      permissions: DEFAULT_PERMISSIONS,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  ALL_PAGES,
  USER_ROLES,
  DEFAULT_PERMISSIONS,
  getRolePermissions,
  getCurrentUserPermissions,
  updateRolePermissions,
  resetRolePermissions,
};
