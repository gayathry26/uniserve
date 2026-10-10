const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const commonDbName = process.env.DB_COMMON_NAME || 'lms';
const departmentDbs = ['lms_cse', 'lms_ece', 'lms_eee', 'lms_mech', 'lms_civil', 'lms_it'];

async function executeSqlStatements(conn, sqlBlock, contextName) {
  const statements = sqlBlock
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await conn.query(stmt);
    } catch (err) {
      console.error(`❌ [SQL ERROR in ${contextName}]:`, err.message);
      console.error(`Statement: ${stmt.substring(0, 120)}...`);
      throw err;
    }
  }
}

async function runMigrations() {
  console.log('================================================================');
  console.log('🚀 [MIGRATION] Starting College Placement LMS Database Migrations');
  console.log('================================================================');

  let rootConnection;
  try {
    rootConnection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to MySQL server at ' + dbConfig.host + ':' + dbConfig.port);

    // 1. Ensure databases exist
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${commonDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✓ Verified Common DB: \`${commonDbName}\``);

    for (const deptDb of departmentDbs) {
      await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${deptDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✓ Verified Department DB: \`${deptDb}\``);
    }
    await rootConnection.end();

    // 2. Connect to Common Database and create schema
    const commonConn = await mysql.createConnection({ ...dbConfig, database: commonDbName });
    console.log(`\n📦 Provisioning tables in central database: \`${commonDbName}\`...`);

    const commonTables = [
      `CREATE TABLE IF NOT EXISTS department_databases (
        id INT PRIMARY KEY AUTO_INCREMENT,
        dept_code VARCHAR(20) NOT NULL UNIQUE,
        dept_name VARCHAR(100) NOT NULL,
        database_name VARCHAR(64) NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        uuid VARCHAR(36) NOT NULL UNIQUE,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role_id INT NOT NULL,
        role_name VARCHAR(50) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        department_code VARCHAR(20),
        status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_role (role_name),
        INDEX idx_dept (department_code)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS students_master (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        register_number VARCHAR(50) NOT NULL UNIQUE,
        roll_number VARCHAR(50),
        department_code VARCHAR(20) NOT NULL,
        programme VARCHAR(50) DEFAULT 'B.Tech',
        batch VARCHAR(20) DEFAULT '2023-2027',
        graduation_year INT DEFAULT 2027,
        current_semester INT DEFAULT 7,
        cgpa DECIMAL(4,2) DEFAULT 0.00,
        active_backlogs INT DEFAULT 0,
        history_of_backlogs INT DEFAULT 0,
        tenth_percentage DECIMAL(5,2) DEFAULT 0.00,
        twelfth_percentage DECIMAL(5,2) DEFAULT 0.00,
        placement_status ENUM('NOT_REGISTERED', 'REGISTERED', 'OPTED_OUT', 'PLACED', 'MULTIPLE_OFFERS') DEFAULT 'REGISTERED',
        placement_readiness_score INT DEFAULT 75,
        primary_resume_id INT,
        skills JSON,
        linkedin_url VARCHAR(255),
        github_url VARCHAR(255),
        portfolio_url VARCHAR(255),
        is_verified BOOLEAN DEFAULT FALSE,
        verified_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_dept_cgpa (department_code, cgpa),
        INDEX idx_placement_status (placement_status)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS student_documents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        register_number VARCHAR(50) NOT NULL,
        doc_type ENUM('RESUME', '10TH_MARKSHEET', '12TH_MARKSHEET', 'COLLEGE_ID', 'INTERNSHIP_CERT', 'CERTIFICATE') NOT NULL,
        title VARCHAR(150) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_size_kb INT,
        version INT DEFAULT 1,
        is_primary BOOLEAN DEFAULT FALSE,
        is_verified BOOLEAN DEFAULT FALSE,
        verified_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students_master(id) ON DELETE CASCADE,
        INDEX idx_student_doc (student_id, doc_type)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS companies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        uuid VARCHAR(36) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL UNIQUE,
        industry VARCHAR(100) NOT NULL,
        website VARCHAR(255),
        headquarters VARCHAR(150),
        contact_email VARCHAR(150),
        contact_phone VARCHAR(20),
        tier ENUM('DREAM', 'SUPER_DREAM', 'REGULAR', 'MASS_RECRUITER') DEFAULT 'REGULAR',
        status ENUM('PROSPECT', 'VERIFIED', 'ACTIVE', 'INACTIVE', 'BLACKLISTED') DEFAULT 'ACTIVE',
        rating DECIMAL(3,2) DEFAULT 4.5,
        logo_url VARCHAR(255),
        description TEXT,
        verified_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tier (tier),
        INDEX idx_status (status)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS company_recruiters (
        id INT PRIMARY KEY AUTO_INCREMENT,
        company_id INT NOT NULL,
        user_id INT NOT NULL UNIQUE,
        designation VARCHAR(100),
        is_primary_contact BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS jobs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        uuid VARCHAR(36) NOT NULL UNIQUE,
        company_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        role_type ENUM('FULL_TIME', 'INTERNSHIP', 'INTERN_TO_FTE') DEFAULT 'FULL_TIME',
        job_description TEXT NOT NULL,
        eligibility_criteria JSON,
        min_cgpa DECIMAL(4,2) DEFAULT 6.00,
        max_backlogs INT DEFAULT 0,
        ctc_lpa DECIMAL(6,2) NOT NULL,
        stipend_monthly DECIMAL(10,2) DEFAULT 0.00,
        locations VARCHAR(255) DEFAULT 'Pan-India',
        vacancies INT DEFAULT 5,
        deadline_date DATETIME NOT NULL,
        status ENUM('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'CLOSED', 'CANCELLED') DEFAULT 'PUBLISHED',
        approved_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        INDEX idx_ctc (ctc_lpa),
        INDEX idx_status (status)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS placement_drives (
        id INT PRIMARY KEY AUTO_INCREMENT,
        uuid VARCHAR(36) NOT NULL UNIQUE,
        job_id INT NOT NULL,
        drive_title VARCHAR(150) NOT NULL,
        drive_type ENUM('ON_CAMPUS', 'POOLED', 'OFF_CAMPUS', 'VIRTUAL', 'HYBRID') DEFAULT 'ON_CAMPUS',
        drive_date DATE NOT NULL,
        venue VARCHAR(150) DEFAULT 'Main Campus Placement Block',
        current_stage VARCHAR(100) DEFAULT 'Online Assessment',
        total_rounds INT DEFAULT 4,
        coordinator_id INT,
        status ENUM('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED', 'CANCELLED') DEFAULT 'UPCOMING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS drive_rounds (
        id INT PRIMARY KEY AUTO_INCREMENT,
        drive_id INT NOT NULL,
        round_number INT NOT NULL,
        round_name VARCHAR(100) NOT NULL,
        round_type ENUM('SCREENING', 'APTITUDE', 'CODING', 'GD', 'TECH_INTERVIEW', 'HR_INTERVIEW', 'FINAL') DEFAULT 'TECH_INTERVIEW',
        scheduled_at DATETIME,
        venue_or_link VARCHAR(255),
        status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'PENDING',
        FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS job_applications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        job_id INT NOT NULL,
        student_id INT NOT NULL,
        register_number VARCHAR(50) NOT NULL,
        department_code VARCHAR(20) NOT NULL,
        resume_version_url VARCHAR(255),
        current_round_number INT DEFAULT 1,
        status ENUM('APPLIED', 'SHORTLISTED', 'IN_PROCESS', 'REJECTED', 'OFFERED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN') DEFAULT 'APPLIED',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students_master(id) ON DELETE CASCADE,
        UNIQUE KEY uq_job_student (job_id, student_id),
        INDEX idx_app_status (status),
        INDEX idx_app_dept (department_code)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS interviews (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_id INT NOT NULL,
        round_id INT,
        student_id INT NOT NULL,
        interviewer_name VARCHAR(100),
        scheduled_slot DATETIME NOT NULL,
        meeting_link_or_room VARCHAR(255),
        rating DECIMAL(3,1),
        feedback TEXT,
        status ENUM('SCHEDULED', 'COMPLETED', 'RESCHEDULED', 'NO_SHOW', 'CANCELLED') DEFAULT 'SCHEDULED',
        decision ENUM('RECOMMENDED', 'NOT_RECOMMENDED', 'ON_HOLD', 'PENDING') DEFAULT 'PENDING',
        FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students_master(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS coding_assessments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        duration_minutes INT DEFAULT 60,
        start_time DATETIME,
        end_time DATETIME,
        total_score INT DEFAULT 100,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS assessment_questions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        assessment_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        difficulty ENUM('EASY', 'MEDIUM', 'HARD') DEFAULT 'MEDIUM',
        problem_statement TEXT NOT NULL,
        input_format TEXT,
        output_format TEXT,
        constraints TEXT,
        points INT DEFAULT 20,
        time_limit_ms INT DEFAULT 2000,
        memory_limit_mb INT DEFAULT 256,
        sample_test_cases JSON,
        hidden_test_cases JSON,
        FOREIGN KEY (assessment_id) REFERENCES coding_assessments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS assessment_submissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        assessment_id INT NOT NULL,
        question_id INT NOT NULL,
        student_id INT NOT NULL,
        register_number VARCHAR(50) NOT NULL,
        language ENUM('python', 'c', 'cpp', 'java') NOT NULL,
        source_code MEDIUMTEXT NOT NULL,
        execution_status ENUM('ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'COMPILATION_ERROR', 'RUNTIME_ERROR', 'PENDING') NOT NULL,
        passed_test_cases INT DEFAULT 0,
        total_test_cases INT DEFAULT 0,
        score INT DEFAULT 0,
        execution_time_ms INT DEFAULT 0,
        error_message TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assessment_id) REFERENCES coding_assessments(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students_master(id) ON DELETE CASCADE,
        INDEX idx_sub_status (execution_status)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS placement_offers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_id INT NOT NULL UNIQUE,
        job_id INT NOT NULL,
        student_id INT NOT NULL,
        register_number VARCHAR(50) NOT NULL,
        department_code VARCHAR(20) NOT NULL,
        offered_ctc_lpa DECIMAL(6,2) NOT NULL,
        offer_letter_url VARCHAR(255),
        issue_date DATE NOT NULL,
        joining_date DATE,
        expiry_date DATE,
        status ENUM('OFFERED', 'ACCEPTED', 'REJECTED', 'REVOKED', 'JOINED', 'NOT_JOINED') DEFAULT 'OFFERED',
        acceptance_proof_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students_master(id) ON DELETE CASCADE,
        INDEX idx_offer_status (status),
        INDEX idx_offer_dept (department_code)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS training_programs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(150) NOT NULL,
        category ENUM('APTITUDE', 'DSA_CODING', 'COMMUNICATION', 'MOCK_INTERVIEWS', 'COMPANY_SPECIFIC') NOT NULL,
        trainer_name VARCHAR(100),
        start_date DATE,
        end_date DATE,
        duration_hours INT DEFAULT 40,
        target_departments JSON,
        status ENUM('SCHEDULED', 'ONGOING', 'COMPLETED') DEFAULT 'ONGOING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS internships (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        register_number VARCHAR(50) NOT NULL,
        department_code VARCHAR(20) NOT NULL,
        company_name VARCHAR(150) NOT NULL,
        role_title VARCHAR(100) NOT NULL,
        stipend_monthly DECIMAL(10,2) DEFAULT 0.00,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('APPLIED', 'APPROVED', 'ONGOING', 'COMPLETED', 'CONVERTED_PPO') DEFAULT 'APPROVED',
        ppo_offered BOOLEAN DEFAULT FALSE,
        mentor_faculty_id INT,
        FOREIGN KEY (student_id) REFERENCES students_master(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS placement_policies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        policy_name VARCHAR(150) NOT NULL,
        academic_year VARCHAR(20) DEFAULT '2026-2027',
        max_offers_allowed INT DEFAULT 2,
        dream_offer_threshold_lpa DECIMAL(5,2) DEFAULT 10.00,
        attendance_mandate_percent INT DEFAULT 75,
        rules_config JSON,
        is_active BOOLEAN DEFAULT TRUE,
        approved_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        target_role VARCHAR(50) DEFAULT 'ALL',
        target_dept VARCHAR(20) DEFAULT 'ALL',
        priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
        category ENUM('ANNOUNCEMENT', 'DRIVE_ALERT', 'ASSESSMENT', 'TRAINING', 'POLICY') DEFAULT 'ANNOUNCEMENT',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS alumni_network (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        graduation_year INT NOT NULL,
        department_code VARCHAR(20) NOT NULL,
        current_company VARCHAR(150) NOT NULL,
        job_role VARCHAR(100) NOT NULL,
        experience_years INT DEFAULT 3,
        available_for_mentorship BOOLEAN DEFAULT TRUE,
        referrals_available BOOLEAN DEFAULT TRUE,
        linkedin_url VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS grievances (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ticket_number VARCHAR(50) NOT NULL UNIQUE,
        student_id INT NOT NULL,
        department_code VARCHAR(20) NOT NULL,
        category ENUM('ELIGIBILITY', 'INTERVIEW_DISPUTE', 'OFFER_CONFLICT', 'ASSESSMENT_ISSUE', 'GENERAL') NOT NULL,
        subject VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        status ENUM('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED') DEFAULT 'OPEN',
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students_master(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS placement_budget (
        id INT PRIMARY KEY AUTO_INCREMENT,
        fiscal_year VARCHAR(20) NOT NULL UNIQUE,
        allocated_budget DECIMAL(12,2) NOT NULL,
        spent_amount DECIMAL(12,2) DEFAULT 0.00,
        training_expense DECIMAL(12,2) DEFAULT 0.00,
        logistics_expense DECIMAL(12,2) DEFAULT 0.00,
        hospitality_expense DECIMAL(12,2) DEFAULT 0.00,
        software_license_expense DECIMAL(12,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS audit_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        action VARCHAR(100) NOT NULL,
        module VARCHAR(50) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_module (module),
        INDEX idx_audit_time (created_at)
      ) ENGINE=InnoDB`
    ];

    for (const sql of commonTables) {
      await commonConn.query(sql);
    }
    console.log(`✓ All ${commonTables.length} tables created in common database.`);
    await commonConn.end();

    // 3. Provision Department Databases
    const deptTables = [
      `CREATE TABLE IF NOT EXISTS dept_students_academic (
        id INT PRIMARY KEY AUTO_INCREMENT,
        register_number VARCHAR(50) NOT NULL UNIQUE,
        sem1_gpa DECIMAL(4,2) DEFAULT 0.00,
        sem2_gpa DECIMAL(4,2) DEFAULT 0.00,
        sem3_gpa DECIMAL(4,2) DEFAULT 0.00,
        sem4_gpa DECIMAL(4,2) DEFAULT 0.00,
        sem5_gpa DECIMAL(4,2) DEFAULT 0.00,
        sem6_gpa DECIMAL(4,2) DEFAULT 0.00,
        sem7_gpa DECIMAL(4,2) DEFAULT 0.00,
        sem8_gpa DECIMAL(4,2) DEFAULT 0.00,
        current_cgpa DECIMAL(4,2) NOT NULL,
        active_backlogs INT DEFAULT 0,
        cleared_backlogs INT DEFAULT 0,
        department_rank INT DEFAULT 1,
        faculty_mentor_name VARCHAR(100),
        mentor_remarks TEXT,
        verification_status ENUM('PENDING', 'VERIFIED', 'NEEDS_CORRECTION') DEFAULT 'VERIFIED',
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reg (register_number)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS dept_eligibility_overrides (
        id INT PRIMARY KEY AUTO_INCREMENT,
        register_number VARCHAR(50) NOT NULL,
        job_id INT NOT NULL,
        override_type ENUM('CGPA_WAIVER', 'BACKLOG_WAIVER', 'SPECIAL_PERMISSION') NOT NULL,
        reason TEXT NOT NULL,
        approved_by VARCHAR(100) NOT NULL,
        approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_override_job (register_number, job_id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS dept_training_attendance (
        id INT PRIMARY KEY AUTO_INCREMENT,
        training_program_id INT NOT NULL,
        register_number VARCHAR(50) NOT NULL,
        sessions_attended INT DEFAULT 0,
        total_sessions INT DEFAULT 20,
        attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
        pre_assessment_score INT DEFAULT 0,
        post_assessment_score INT DEFAULT 0,
        status ENUM('ELIGIBLE', 'REMEDIAL_REQUIRED', 'COMPLETED') DEFAULT 'COMPLETED',
        INDEX idx_dept_train (training_program_id, register_number)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS dept_mock_evaluations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        register_number VARCHAR(50) NOT NULL,
        evaluator_name VARCHAR(100) NOT NULL,
        technical_rating INT DEFAULT 3,
        communication_rating INT DEFAULT 3,
        problem_solving_rating INT DEFAULT 3,
        strengths TEXT,
        improvement_areas TEXT,
        evaluation_date DATE NOT NULL,
        INDEX idx_eval_reg (register_number)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS dept_audit_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        register_number VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        performed_by VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`
    ];

    for (const deptDb of departmentDbs) {
      console.log(`📦 Provisioning department-specific tables in: \`${deptDb}\`...`);
      const deptConn = await mysql.createConnection({ ...dbConfig, database: deptDb });
      for (const sql of deptTables) {
        await deptConn.query(sql);
      }
      console.log(`✓ Tables provisioned in \`${deptDb}\``);
      await deptConn.end();
    }

    console.log('\n================================================================');
    console.log('✅ [MIGRATION COMPLETE] All Common and Department databases ready!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ [MIGRATION ERROR]', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
