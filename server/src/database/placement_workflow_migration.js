const { queryCommon } = require('../config/db');

async function runMigration() {
  console.log('--- Applying Schema Enhancements for Placement Workflow ---');

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

  // 1. Enhance job_applications
  await addCol('ALTER TABLE job_applications ADD COLUMN drive_id INT');
  await addCol("ALTER TABLE job_applications ADD COLUMN eligibility_status ENUM('ELIGIBLE', 'INELIGIBLE', 'PENDING_REVIEW', 'FLAGGED') DEFAULT 'ELIGIBLE'");
  await addCol('ALTER TABLE job_applications ADD COLUMN ineligibility_reason TEXT');
  await addCol("ALTER TABLE job_applications ADD COLUMN final_result ENUM('PENDING', 'SELECTED', 'WAITLISTED', 'REJECTED') DEFAULT 'PENDING'");
  await addCol('ALTER TABLE job_applications ADD COLUMN interview_scheduled_at DATETIME');
  await addCol('ALTER TABLE job_applications ADD COLUMN interview_venue_or_link VARCHAR(255)');
  await addCol('ALTER TABLE job_applications ADD COLUMN feedback TEXT');

  // 2. Create drive_announcements table
  await queryCommon(`
    CREATE TABLE IF NOT EXISTS drive_announcements (
      id INT PRIMARY KEY AUTO_INCREMENT,
      company_id INT NOT NULL,
      drive_id INT,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      published_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_comp_ann (company_id)
    ) ENGINE=InnoDB
  `);
  console.log('✓ Created/verified drive_announcements table');

  // 3. Link drive_id in job_applications for existing records
  await queryCommon(`
    UPDATE job_applications ja
    JOIN jobs j ON j.id = ja.job_id
    JOIN placement_drives pd ON pd.job_id = j.id
    SET ja.drive_id = pd.id
    WHERE ja.drive_id IS NULL
  `);
  console.log('✓ Linked drive_id in job_applications');

  // 4. Ensure each company has a job and a placement drive with drive_rounds
  const companies = await queryCommon('SELECT id, name, description, package_ctc, drive_date, drive_venue, drive_mode, selection_rounds, eligible_departments, min_cgpa, eligible_student_count FROM companies');
  const { v4: uuidv4 } = require('uuid');

  for (const c of companies) {
    // Check job
    let [job] = await queryCommon('SELECT id FROM jobs WHERE company_id = ? LIMIT 1', [c.id]);
    if (!job) {
      const jobUuid = uuidv4();
      await queryCommon(`
        INSERT INTO jobs (uuid, company_id, title, role_type, job_description, ctc_lpa, deadline_date, status)
        VALUES (?, ?, ?, 'FULL_TIME', ?, ?, '2026-12-31 23:59:59', 'PUBLISHED')
      `, [jobUuid, c.id, `${c.name} - Campus Recruitment Drive`, c.description || 'Full-time campus drive', c.package_ctc || 10.0]);
      const [newJob] = await queryCommon('SELECT id FROM jobs WHERE uuid = ?', [jobUuid]);
      job = newJob;
    }

    // Check drive
    let [drive] = await queryCommon('SELECT id FROM placement_drives WHERE job_id = ? LIMIT 1', [job.id]);
    if (!drive) {
      const driveUuid = uuidv4();
      await queryCommon(`
        INSERT INTO placement_drives (uuid, job_id, drive_title, drive_type, drive_date, venue, current_stage, total_rounds, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Registration Stage', 4, 'UPCOMING')
      `, [
        driveUuid,
        job.id,
        `${c.name} Campus Drive 2026-27`,
        c.drive_mode || 'ON_CAMPUS',
        c.drive_date || '2026-11-25',
        c.drive_venue || 'Main Campus Placement Block'
      ]);
      const [newDrive] = await queryCommon('SELECT id FROM placement_drives WHERE uuid = ?', [driveUuid]);
      drive = newDrive;
    }

    // Check drive rounds
    const rounds = await queryCommon('SELECT id FROM drive_rounds WHERE drive_id = ?', [drive.id]);
    if (rounds.length === 0) {
      let roundNames = ['Resume Screening & Eligibility Shortlist', 'Online Coding & Aptitude Assessment', 'Technical System Design Interview', 'Leadership & HR Discussion'];
      try {
        if (typeof c.selection_rounds === 'string') {
          const parsed = JSON.parse(c.selection_rounds);
          if (Array.isArray(parsed) && parsed.length > 0) roundNames = parsed;
        } else if (Array.isArray(c.selection_rounds)) {
          roundNames = c.selection_rounds;
        }
      } catch (e) {}

      for (let i = 0; i < roundNames.length; i++) {
        await queryCommon(`
          INSERT INTO drive_rounds (drive_id, round_number, round_name, round_type, status)
          VALUES (?, ?, ?, 'TECH_INTERVIEW', 'PENDING')
        `, [drive.id, i + 1, roundNames[i]]);
      }
      console.log(`✓ Seeded ${roundNames.length} rounds for drive ${drive.id} (${c.name})`);
    }
  }

  // 5. Seed some initial announcements for existing companies if empty
  const annCount = await queryCommon('SELECT COUNT(*) as cnt FROM drive_announcements');
  if (annCount[0].cnt === 0) {
    await queryCommon(`
      INSERT INTO drive_announcements (company_id, drive_id, title, content, published_by)
      VALUES 
      (1, 1, 'Google India Campus Drive Guidelines', 'All applicants must ensure their HackerRank/GitHub profiles are updated before Round 2 Coding Assessment.', 1),
      (2, 2, 'Microsoft Technical Interview Pre-briefing', 'Virtual interviews will be held via UniServe Mock Video Meet platform. Ensure webcam and microphone permissions are tested.', 1),
      (3, 3, 'TCS National Qualifier Test (NQT) Schedule', 'NQT Slot 1 begins at 10:00 AM in the Campus Computing Lab 3. Carry your College ID and hall ticket.', 1)
    `);
    console.log('✓ Seeded sample drive announcements');
  }

  console.log('🎉 Migration completed successfully!');
}

runMigration().then(() => process.exit(0)).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
