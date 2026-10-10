const { queryCommon } = require('../config/db');

const DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: [
    '/',
    '/students',
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
    '/reports',
    '/finance',
    '/alumni',
    '/grievances',
    '/ai-assistant',
    '/admin',
    '/settings',
  ],
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

async function initRolePermissions() {
  try {
    await queryCommon(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_name VARCHAR(50) NOT NULL UNIQUE,
        allowed_pages JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    for (const [roleName, pages] of Object.entries(DEFAULT_PERMISSIONS)) {
      await queryCommon(
        `INSERT INTO role_permissions (role_name, allowed_pages)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE allowed_pages = VALUES(allowed_pages)`,
        [roleName, JSON.stringify(pages)]
      );
    }

    console.log('✅ role_permissions table initialized and seeded in MySQL successfully');
  } catch (err) {
    console.error('❌ Error initializing role_permissions:', err);
    throw err;
  }
}

if (require.main === module) {
  initRolePermissions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  DEFAULT_PERMISSIONS,
  initRolePermissions,
};
