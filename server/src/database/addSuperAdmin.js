const { queryCommon } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function run() {
  try {
    await queryCommon(`INSERT INTO roles (id, role_name, description) 
      VALUES (8, 'SUPER_ADMIN', 'Master super administrator with unrestricted access to all modules') 
      ON DUPLICATE KEY UPDATE role_name=VALUES(role_name), description=VALUES(description)`);

    const hash = await bcrypt.hash('Password@123', 10);

    await queryCommon(`INSERT INTO users (uuid, email, password_hash, role_id, role_name, first_name, last_name, phone, status)
      VALUES (?, 'superadmin@uniserve.edu', ?, 8, 'SUPER_ADMIN', 'Super', 'Administrator', '+91 9999999999', 'ACTIVE')
      ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role_name='SUPER_ADMIN'`, [uuidv4(), hash]);

    await queryCommon(`INSERT INTO users (uuid, email, password_hash, role_id, role_name, first_name, last_name, phone, status)
      VALUES (?, 'superadmin@college.edu', ?, 8, 'SUPER_ADMIN', 'Super', 'Administrator', '+91 9999999999', 'ACTIVE')
      ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role_name='SUPER_ADMIN'`, [uuidv4(), hash]);

    console.log('✅ SUPER_ADMIN successfully provisioned into MySQL database!');
  } catch (err) {
    console.error('Error provisioning SUPER_ADMIN:', err);
  } finally {
    process.exit(0);
  }
}

run();
