const { queryCommon } = require('../config/db');

async function updateSchema() {
  console.log('--- Applying Schema Updates for Placement Companies ---');

  const addCol = async (sql) => {
    try {
      await queryCommon(sql);
      console.log('✓ Success:', sql);
    } catch (e) {
      if (e.message.includes('Duplicate column') || e.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Column already exists for:', sql);
      } else {
        console.warn('Notice:', e.message);
      }
    }
  };

  await addCol('ALTER TABLE companies ADD COLUMN eligible_departments JSON');
  await addCol("ALTER TABLE companies ADD COLUMN academic_year VARCHAR(20) DEFAULT '2026-2027'");
  await addCol('ALTER TABLE companies ADD COLUMN eligible_student_count INT DEFAULT 60');
  await addCol('ALTER TABLE companies ADD COLUMN min_cgpa DECIMAL(4,2) DEFAULT 6.50');
  await addCol('ALTER TABLE companies ADD COLUMN package_ctc DECIMAL(6,2) DEFAULT 12.00');
  await addCol("ALTER TABLE companies ADD COLUMN drive_date DATE DEFAULT '2026-11-25'");
  await addCol("ALTER TABLE companies ADD COLUMN drive_venue VARCHAR(150) DEFAULT 'Main Campus Placement Cell'");
  await addCol("ALTER TABLE companies ADD COLUMN drive_mode VARCHAR(50) DEFAULT 'ON_CAMPUS'");
  await addCol("ALTER TABLE companies ADD COLUMN selection_stage VARCHAR(100) DEFAULT 'Online Assessment'");
  await addCol('ALTER TABLE companies ADD COLUMN selection_rounds JSON');
  await addCol('ALTER TABLE companies ADD COLUMN application_deadline DATETIME');
  await addCol("ALTER TABLE students_master ADD COLUMN academic_year VARCHAR(20) DEFAULT '2026-2027'");

  // Update existing companies with realistic department eligibility & schedule data
  console.log('Updating seed companies with eligible departments & placement data...');
  
  await queryCommon(`
    UPDATE companies 
    SET eligible_departments = ?,
        academic_year = '2026-2027',
        eligible_student_count = 50,
        min_cgpa = 8.00,
        package_ctc = 32.50,
        drive_date = '2026-11-25',
        drive_venue = 'Auditorium & Virtual Coding Labs',
        drive_mode = 'HYBRID',
        selection_stage = 'Online Assessment',
        selection_rounds = ?,
        application_deadline = '2026-11-20 23:59:59'
    WHERE name = 'Google India'
  `, [
    JSON.stringify(['CSE', 'ECE', 'IT']),
    JSON.stringify(['Resume Screening', 'Online Coding Assessment', 'Tech System Design Interview', 'HR Discussion'])
  ]);

  await queryCommon(`
    UPDATE companies 
    SET eligible_departments = ?,
        academic_year = '2026-2027',
        eligible_student_count = 60,
        min_cgpa = 7.50,
        package_ctc = 28.00,
        drive_date = '2026-12-05',
        drive_venue = 'Main Placement Seminar Hall',
        drive_mode = 'ON_CAMPUS',
        selection_stage = 'Online Assessment',
        selection_rounds = ?,
        application_deadline = '2026-11-28 23:59:59'
    WHERE name = 'Microsoft India'
  `, [
    JSON.stringify(['CSE', 'ECE', 'EEE', 'IT']),
    JSON.stringify(['Eligibility Filter', 'Online Aptitude & Coding', 'Technical Round 1 & 2', 'AA & Leadership Interview'])
  ]);

  await queryCommon(`
    UPDATE companies 
    SET eligible_departments = ?,
        academic_year = '2026-2027',
        eligible_student_count = 150,
        min_cgpa = 6.50,
        package_ctc = 9.00,
        drive_date = '2026-11-18',
        drive_venue = 'Campus Placement Block',
        drive_mode = 'ON_CAMPUS',
        selection_stage = 'Online Assessment',
        selection_rounds = ?,
        application_deadline = '2026-11-15 23:59:59'
    WHERE name = 'Tata Consultancy Services (TCS)'
  `, [
    JSON.stringify(['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']),
    JSON.stringify(['National Qualifier Test (NQT)', 'Technical Interview', 'Managerial Interview', 'HR Final'])
  ]);

  await queryCommon(`
    UPDATE companies 
    SET eligible_departments = ?,
        academic_year = '2026-2027',
        eligible_student_count = 40,
        min_cgpa = 7.00,
        package_ctc = 8.50,
        drive_date = '2026-12-10',
        drive_venue = 'Mechanical Block & Auditorium',
        drive_mode = 'ON_CAMPUS',
        selection_stage = 'Registration Stage',
        selection_rounds = ?,
        application_deadline = '2026-12-01 23:59:59'
    WHERE name = 'Larsen & Toubro (L&T)'
  `, [
    JSON.stringify(['MECH', 'CIVIL', 'EEE', 'ECE']),
    JSON.stringify(['Core Engineering Aptitude', 'Technical Interview', 'Group Discussion', 'Final HR'])
  ]);

  // Set academic_year for students_master
  await queryCommon("UPDATE students_master SET academic_year = '2026-2027' WHERE academic_year IS NULL OR academic_year = ''");

  // Ensure superadmin exists in users
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');
  const hash = await bcrypt.hash('Password@123', 10);
  await queryCommon(`
    INSERT INTO users (uuid, email, password_hash, role_id, role_name, first_name, last_name, phone, status)
    VALUES (?, 'superadmin@uniserve.edu', ?, 7, 'SUPER_ADMIN', 'Super', 'Administrator', '+91 9999999999', 'ACTIVE')
    ON DUPLICATE KEY UPDATE role_name = 'SUPER_ADMIN', password_hash = VALUES(password_hash)
  `, [uuidv4(), hash]);

  console.log('✅ Schema & company eligibility seed data updated successfully!');
}

updateSchema().then(() => process.exit(0)).catch((err) => {
  console.error('Error running updateSchema:', err);
  process.exit(1);
});
