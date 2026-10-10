const { queryCommon } = require('../config/db');

async function setupMockInterviews() {
  try {
    await queryCommon(`
      CREATE TABLE IF NOT EXISTS mock_interviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        room_code VARCHAR(50) NOT NULL UNIQUE,
        interviewer_id INT,
        interviewer_name VARCHAR(150) NOT NULL,
        interviewer_role VARCHAR(50) DEFAULT 'FACULTY_COORDINATOR',
        student_id INT,
        student_name VARCHAR(150),
        student_roll VARCHAR(50),
        scheduled_at DATETIME,
        topic VARCHAR(100) DEFAULT 'Technical Interview',
        status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
        rating DECIMAL(3,1),
        feedback TEXT,
        decision ENUM('RECOMMENDED', 'NOT_RECOMMENDED', 'ON_HOLD', 'PENDING') DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ [DATABASE] mock_interviews table is ready.');

    const [check] = await queryCommon('SELECT COUNT(*) as count FROM mock_interviews');
    if (check.count === 0) {
      await queryCommon(`
        INSERT INTO mock_interviews (title, room_code, interviewer_name, interviewer_role, student_name, student_roll, scheduled_at, topic)
        VALUES 
        ('Google Cloud Placement Mock Interview', 'gen-meet-x94', 'Chris Hoffman (Lead Evaluator)', 'FACULTY_COORDINATOR', 'Varun Murugesh', '2023CSE045', NOW() + INTERVAL 2 HOUR, 'Cloud Architecture & DSA'),
        ('Amazon SDE-1 Technical Mock Round', 'amazon-sde-88', 'Prof. K. Ramesh (TPO Lead)', 'TPO_OFFICER', 'Gayathri S', '2023CSE012', NOW() + INTERVAL 1 DAY, 'Data Structures & Algorithms')
      `);
      console.log('✅ [DATABASE] Seeded initial mock interviews.');
    }
  } catch (err) {
    console.error('❌ [DATABASE] Error setting up mock_interviews:', err);
  }
}

if (require.main === module) {
  setupMockInterviews().then(() => process.exit(0));
}

module.exports = { setupMockInterviews };
