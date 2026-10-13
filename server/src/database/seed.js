const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
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

async function seedDatabase() {
  console.log('================================================================');
  console.log('🌱 [SEEDING] Starting Initial Seed Data Population');
  console.log('================================================================');

  let commonConn;
  try {
    commonConn = await mysql.createConnection({ ...dbConfig, database: commonDbName });

    // 1. Department Registry
    console.log('Inserting Department Registry...');
    const departments = [
      { code: 'CSE', name: 'Computer Science and Engineering', db: 'lms_cse' },
      { code: 'ECE', name: 'Electronics and Communication Engineering', db: 'lms_ece' },
      { code: 'EEE', name: 'Electrical and Electronics Engineering', db: 'lms_eee' },
      { code: 'MECH', name: 'Mechanical Engineering', db: 'lms_mech' },
      { code: 'CIVIL', name: 'Civil Engineering', db: 'lms_civil' },
      { code: 'IT', name: 'Information Technology', db: 'lms_it' },
    ];

    for (const d of departments) {
      await commonConn.query(
        `INSERT INTO department_databases (dept_code, dept_name, database_name, is_active)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE dept_name = VALUES(dept_name), database_name = VALUES(database_name)`,
        [d.code, d.name, d.db]
      );
    }

    // 2. Roles
    console.log('Inserting Roles...');
    const roles = [
      { id: 1, name: 'STUDENT', desc: 'Enrolled university student participating in placements' },
      { id: 2, name: 'TPO_OFFICER', desc: 'Training and Placement Officer orchestrating drives' },
      { id: 3, name: 'RECRUITER', desc: 'Corporate hiring manager or campus recruiter' },
      { id: 4, name: 'FACULTY_COORDINATOR', desc: 'Department placement coordinator & academic mentor' },
      { id: 5, name: 'MANAGEMENT', desc: 'Dean, Principal, and University Board Leadership' },
      { id: 6, name: 'ALUMNI', desc: 'Graduated alumni providing mentorship and referrals' },
      { id: 7, name: 'ADMIN', desc: 'Institutional system and security administrator' },
    ];

    for (const r of roles) {
      await commonConn.query(
        `INSERT INTO roles (id, role_name, description) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description)`,
        [r.id, r.name, r.desc]
      );
    }

    // Standard Passwords
    const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

    // 3. Users Master
    console.log('Inserting Institutional Users...');
    const users = [
      {
        uuid: uuidv4(),
        email: 'admin@college.edu',
        role_id: 7,
        role_name: 'ADMIN',
        first_name: 'System',
        last_name: 'Administrator',
        phone: '+91 9876543210',
        dept: null,
      },
      {
        uuid: uuidv4(),
        email: 'tpo@college.edu',
        role_id: 2,
        role_name: 'TPO_OFFICER',
        first_name: 'Dr. Rajesh',
        last_name: 'Sharma',
        phone: '+91 9876543211',
        dept: null,
      },
      {
        uuid: uuidv4(),
        email: 'principal@college.edu',
        role_id: 5,
        role_name: 'MANAGEMENT',
        first_name: 'Dr. Anita',
        last_name: 'Deshmukh',
        phone: '+91 9876543212',
        dept: null,
      },
      {
        uuid: uuidv4(),
        email: 'hod.cse@college.edu',
        role_id: 4,
        role_name: 'FACULTY_COORDINATOR',
        first_name: 'Prof. Suresh',
        last_name: 'Venkatesh',
        phone: '+91 9876543213',
        dept: 'CSE',
      },
      {
        uuid: uuidv4(),
        email: 'hod.ece@college.edu',
        role_id: 4,
        role_name: 'FACULTY_COORDINATOR',
        first_name: 'Dr. Meenakshi',
        last_name: 'Sundaram',
        phone: '+91 9876543214',
        dept: 'ECE',
      },
      {
        uuid: uuidv4(),
        email: 'recruiter.google@example.com',
        role_id: 3,
        role_name: 'RECRUITER',
        first_name: 'Vikram',
        last_name: 'Kapoor',
        phone: '+91 9876543215',
        dept: null,
      },
      {
        uuid: uuidv4(),
        email: 'recruiter.microsoft@example.com',
        role_id: 3,
        role_name: 'RECRUITER',
        first_name: 'Pooja',
        last_name: 'Nair',
        phone: '+91 9876543216',
        dept: null,
      },
      {
        uuid: uuidv4(),
        email: 'student.cse1@college.edu',
        role_id: 1,
        role_name: 'STUDENT',
        first_name: 'Aditya',
        last_name: 'Varma',
        phone: '+91 9876543220',
        dept: 'CSE',
      },
      {
        uuid: uuidv4(),
        email: 'student.cse2@college.edu',
        role_id: 1,
        role_name: 'STUDENT',
        first_name: 'Sneha',
        last_name: 'Patil',
        phone: '+91 9876543221',
        dept: 'CSE',
      },
      {
        uuid: uuidv4(),
        email: 'student.ece1@college.edu',
        role_id: 1,
        role_name: 'STUDENT',
        first_name: 'Rohan',
        last_name: 'Gupta',
        phone: '+91 9876543222',
        dept: 'ECE',
      },
      {
        uuid: uuidv4(),
        email: 'student.mech1@college.edu',
        role_id: 1,
        role_name: 'STUDENT',
        first_name: 'Karthik',
        last_name: 'Reddy',
        phone: '+91 9876543223',
        dept: 'MECH',
      },
      {
        uuid: uuidv4(),
        email: 'alumni.alex@example.com',
        role_id: 6,
        role_name: 'ALUMNI',
        first_name: 'Alex',
        last_name: 'Fernandes',
        phone: '+91 9876543224',
        dept: 'CSE',
      },
    ];

    const userIdMap = {};
    for (const u of users) {
      await commonConn.query(
        `INSERT INTO users (uuid, email, password_hash, role_id, role_name, first_name, last_name, phone, department_code, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
         ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), department_code = VALUES(department_code)`,
        [u.uuid, u.email, defaultPasswordHash, u.role_id, u.role_name, u.first_name, u.last_name, u.phone, u.dept]
      );
      const [[userRow]] = await commonConn.query('SELECT id FROM users WHERE email = ?', [u.email]);
      userIdMap[u.email] = userRow.id;
    }

    // 4. Students Master
    console.log('Inserting Students Master records...');
    const studentsMasterData = [
      {
        email: 'student.cse1@college.edu',
        reg: '2023CSE001',
        roll: '23CS101',
        dept: 'CSE',
        cgpa: 9.35,
        backlogs: 0,
        tenth: 94.5,
        twelfth: 92.0,
        status: 'PLACED',
        skills: ['React', 'Node.js', 'Python', 'Data Structures', 'SQL', 'Docker'],
      },
      {
        email: 'student.cse2@college.edu',
        reg: '2023CSE002',
        roll: '23CS102',
        dept: 'CSE',
        cgpa: 8.42,
        backlogs: 0,
        tenth: 89.0,
        twelfth: 88.5,
        status: 'REGISTERED',
        skills: ['Java', 'Spring Boot', 'MySQL', 'C++', 'System Design'],
      },
      {
        email: 'student.ece1@college.edu',
        reg: '2023ECE001',
        roll: '23EC101',
        dept: 'ECE',
        cgpa: 7.95,
        backlogs: 0,
        tenth: 86.0,
        twelfth: 84.0,
        status: 'REGISTERED',
        skills: ['Embedded C', 'Verilog', 'Python', 'MATLAB', 'VLSI Design'],
      },
      {
        email: 'student.mech1@college.edu',
        reg: '2023MECH001',
        roll: '23ME101',
        dept: 'MECH',
        cgpa: 7.15,
        backlogs: 1,
        tenth: 82.0,
        twelfth: 80.0,
        status: 'REGISTERED',
        skills: ['AutoCAD', 'SolidWorks', 'ANSYS', 'Python Basics', 'Thermodynamics'],
      },
    ];

    const studentIdMap = {};
    for (const sm of studentsMasterData) {
      const uId = userIdMap[sm.email];
      await commonConn.query(
        `INSERT INTO students_master (user_id, register_number, roll_number, department_code, programme, batch, graduation_year, current_semester, cgpa, active_backlogs, tenth_percentage, twelfth_percentage, placement_status, skills, is_verified)
         VALUES (?, ?, ?, ?, 'B.Tech', '2023-2027', 2027, 7, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE cgpa = VALUES(cgpa), active_backlogs = VALUES(active_backlogs), placement_status = VALUES(placement_status)`,
        [uId, sm.reg, sm.roll, sm.dept, sm.cgpa, sm.backlogs, sm.tenth, sm.twelfth, sm.status, JSON.stringify(sm.skills)]
      );
      const [[sRow]] = await commonConn.query('SELECT id FROM students_master WHERE register_number = ?', [sm.reg]);
      studentIdMap[sm.reg] = sRow.id;
    }

    // 5. Companies
    console.log('Inserting Verified Companies...');
    const companies = [
      {
        name: 'Google India',
        industry: 'Information Technology & Software',
        website: 'https://careers.google.com',
        headquarters: 'Mountain View, CA / Hyderabad, India',
        email: 'campus-india@google.com',
        tier: 'SUPER_DREAM',
        rating: 4.9,
        desc: 'World leader in search, cloud systems, artificial intelligence, and operating systems.',
        eligible_departments: ['CSE', 'ECE', 'IT'],
        academic_year: '2026-2027',
        eligible_student_count: 50,
        min_cgpa: 8.00,
        package_ctc: 32.50,
        drive_date: '2026-11-25',
        drive_venue: 'Auditorium & Virtual Coding Labs',
        drive_mode: 'HYBRID',
        selection_stage: 'Online Assessment',
        selection_rounds: ['Resume Screening', 'Online Coding Assessment', 'Tech System Design Interview', 'HR Discussion'],
        application_deadline: '2026-11-20 23:59:59',
      },
      {
        name: 'Microsoft India',
        industry: 'Software & Enterprise Cloud Services',
        website: 'https://careers.microsoft.com',
        headquarters: 'Redmond, WA / Bengaluru, India',
        email: 'university-india@microsoft.com',
        tier: 'SUPER_DREAM',
        rating: 4.8,
        desc: 'Global developer of Windows, Azure Cloud, developer platforms, and enterprise solutions.',
        eligible_departments: ['CSE', 'ECE', 'EEE', 'IT'],
        academic_year: '2026-2027',
        eligible_student_count: 60,
        min_cgpa: 7.50,
        package_ctc: 28.00,
        drive_date: '2026-12-05',
        drive_venue: 'Main Placement Seminar Hall',
        drive_mode: 'ON_CAMPUS',
        selection_stage: 'Online Assessment',
        selection_rounds: ['Eligibility Filter', 'Online Aptitude & Coding', 'Technical Round 1 & 2', 'AA & Leadership Interview'],
        application_deadline: '2026-11-28 23:59:59',
      },
      {
        name: 'Tata Consultancy Services (TCS)',
        industry: 'Information Technology & Consulting',
        website: 'https://www.tcs.com/careers',
        headquarters: 'Mumbai, India',
        email: 'campus.recruit@tcs.com',
        tier: 'REGULAR',
        rating: 4.2,
        desc: 'Global leader in IT services, consulting, and business solutions with mass campus drives.',
        eligible_departments: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'],
        academic_year: '2026-2027',
        eligible_student_count: 150,
        min_cgpa: 6.50,
        package_ctc: 9.00,
        drive_date: '2026-11-18',
        drive_venue: 'Campus Placement Block',
        drive_mode: 'ON_CAMPUS',
        selection_stage: 'Online Assessment',
        selection_rounds: ['National Qualifier Test (NQT)', 'Technical Interview', 'Managerial Interview', 'HR Final'],
        application_deadline: '2026-11-15 23:59:59',
      },
      {
        name: 'Larsen & Toubro (L&T)',
        industry: 'Heavy Engineering & Technology',
        website: 'https://www.larsentoubro.com',
        headquarters: 'Mumbai, India',
        email: 'talent@larsentoubro.com',
        tier: 'DREAM',
        rating: 4.5,
        desc: 'Premier Indian multinational engaged in EPC projects, manufacturing, defence, and high-tech.',
        eligible_departments: ['MECH', 'CIVIL', 'EEE', 'ECE'],
        academic_year: '2026-2027',
        eligible_student_count: 40,
        min_cgpa: 7.00,
        package_ctc: 8.50,
        drive_date: '2026-12-10',
        drive_venue: 'Mechanical Block & Auditorium',
        drive_mode: 'ON_CAMPUS',
        selection_stage: 'Registration Stage',
        selection_rounds: ['Core Engineering Aptitude', 'Technical Interview', 'Group Discussion', 'Final HR'],
        application_deadline: '2026-12-01 23:59:59',
      },
    ];

    const companyIdMap = {};
    for (const c of companies) {
      await commonConn.query(
        `INSERT INTO companies (uuid, name, industry, website, headquarters, contact_email, tier, status, rating, description, eligible_departments, academic_year, eligible_student_count, min_cgpa, package_ctc, drive_date, drive_venue, drive_mode, selection_stage, selection_rounds, application_deadline)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE tier = VALUES(tier), description = VALUES(description), eligible_departments = VALUES(eligible_departments), academic_year = VALUES(academic_year), eligible_student_count = VALUES(eligible_student_count), min_cgpa = VALUES(min_cgpa), package_ctc = VALUES(package_ctc), drive_date = VALUES(drive_date), drive_venue = VALUES(drive_venue), drive_mode = VALUES(drive_mode), selection_stage = VALUES(selection_stage), selection_rounds = VALUES(selection_rounds), application_deadline = VALUES(application_deadline)`,
        [
          uuidv4(),
          c.name,
          c.industry,
          c.website,
          c.headquarters,
          c.email,
          c.tier,
          c.rating,
          c.desc,
          JSON.stringify(c.eligible_departments),
          c.academic_year,
          c.eligible_student_count,
          c.min_cgpa,
          c.package_ctc,
          c.drive_date,
          c.drive_venue,
          c.drive_mode,
          c.selection_stage,
          JSON.stringify(c.selection_rounds),
          c.application_deadline,
        ]
      );
      const [[cRow]] = await commonConn.query('SELECT id FROM companies WHERE name = ?', [c.name]);
      companyIdMap[c.name] = cRow.id;
    }

    // Recruiter linkage
    await commonConn.query(
      `INSERT INTO company_recruiters (company_id, user_id, designation, is_primary_contact)
       VALUES (?, ?, 'Lead Campus Recruiter', 1)
       ON DUPLICATE KEY UPDATE designation = VALUES(designation)`,
      [companyIdMap['Google India'], userIdMap['recruiter.google@example.com']]
    );

    await commonConn.query(
      `INSERT INTO company_recruiters (company_id, user_id, designation, is_primary_contact)
       VALUES (?, ?, 'Talent Acquisition Manager', 1)
       ON DUPLICATE KEY UPDATE designation = VALUES(designation)`,
      [companyIdMap['Microsoft India'], userIdMap['recruiter.microsoft@example.com']]
    );

    // 6. Master Jobs
    console.log('Inserting Master Job Opportunities...');
    const jobs = [
      {
        company: 'Google India',
        title: 'Software Development Engineer - Campus 2027',
        role_type: 'FULL_TIME',
        ctc: 32.50,
        stipend: 120000.00,
        min_cgpa: 8.00,
        max_backlogs: 0,
        locations: 'Bengaluru, Hyderabad',
        vacancies: 6,
        deadline: '2026-11-30 23:59:59',
        desc: 'Core software engineer role working on distributed systems, large language models, cloud infrastructure, and search optimization.',
        criteria: { allowed_departments: ['CSE', 'ECE', 'IT'], min_tenth: 80, min_twelfth: 80 },
      },
      {
        company: 'Microsoft India',
        title: 'Cloud Solutions & Systems Software Engineer',
        role_type: 'FULL_TIME',
        ctc: 28.00,
        stipend: 100000.00,
        min_cgpa: 7.50,
        max_backlogs: 0,
        locations: 'Bengaluru, Noida, Hyderabad',
        vacancies: 8,
        deadline: '2026-12-15 23:59:59',
        desc: 'Design and deploy resilient Azure Cloud hyper-scale microservices, distributed caching, and backend APIs.',
        criteria: { allowed_departments: ['CSE', 'ECE', 'EEE', 'IT'], min_tenth: 75, min_twelfth: 75 },
      },
      {
        company: 'Tata Consultancy Services (TCS)',
        title: 'TCS Prime & Digital Systems Innovator',
        role_type: 'FULL_TIME',
        ctc: 9.00,
        stipend: 35000.00,
        min_cgpa: 6.50,
        max_backlogs: 0,
        locations: 'Pan-India',
        vacancies: 45,
        deadline: '2026-11-20 23:59:59',
        desc: 'Advanced software development, cloud computing, cybersecurity, and enterprise automation.',
        criteria: { allowed_departments: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'], min_tenth: 60, min_twelfth: 60 },
      },
      {
        company: 'Larsen & Toubro (L&T)',
        title: 'Graduate Engineer Trainee (GET) - Core Engineering',
        role_type: 'FULL_TIME',
        ctc: 8.50,
        stipend: 30000.00,
        min_cgpa: 7.00,
        max_backlogs: 0,
        locations: 'Chennai, Vadodara, Mumbai',
        vacancies: 15,
        deadline: '2026-12-05 23:59:59',
        desc: 'Specialized engineering design, structural analysis, industrial automation, and smart plant engineering.',
        criteria: { allowed_departments: ['MECH', 'CIVIL', 'EEE', 'ECE'], min_tenth: 65, min_twelfth: 65 },
      },
    ];

    const jobIdMap = {};
    for (const j of jobs) {
      const cId = companyIdMap[j.company];
      await commonConn.query(
        `INSERT INTO jobs (uuid, company_id, title, role_type, job_description, eligibility_criteria, min_cgpa, max_backlogs, ctc_lpa, stipend_monthly, locations, vacancies, deadline_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')
         ON DUPLICATE KEY UPDATE ctc_lpa = VALUES(ctc_lpa), min_cgpa = VALUES(min_cgpa)`,
        [uuidv4(), cId, j.title, j.role_type, j.desc, JSON.stringify(j.criteria), j.min_cgpa, j.max_backlogs, j.ctc, j.stipend, j.locations, j.vacancies, j.deadline]
      );
      const [[jRow]] = await commonConn.query('SELECT id FROM jobs WHERE title = ?', [j.title]);
      jobIdMap[j.title] = jRow.id;
    }

    // 7. Placement Drives & Rounds
    console.log('Creating Placement Drives & Selection Rounds...');
    for (const [title, jId] of Object.entries(jobIdMap)) {
      await commonConn.query(
        `INSERT INTO placement_drives (uuid, job_id, drive_title, drive_type, drive_date, venue, current_stage, total_rounds, status)
         VALUES (?, ?, ?, 'ON_CAMPUS', '2026-11-25', 'Campus Placement Block & Labs', 'Online Assessment', 4, 'UPCOMING')
         ON DUPLICATE KEY UPDATE drive_title = VALUES(drive_title)`,
        [uuidv4(), jId, `${title} - Campus Drive 2026-27`]
      );
      const [[dRow]] = await commonConn.query('SELECT id FROM placement_drives WHERE job_id = ?', [jId]);
      const driveId = dRow.id;

      // Add rounds
      const rounds = [
        { num: 1, name: 'Resume Screening & Eligibility Shortlist', type: 'SCREENING' },
        { num: 2, name: 'Online Coding & Aptitude Assessment', type: 'CODING' },
        { num: 3, name: 'Technical System Design Interview', type: 'TECH_INTERVIEW' },
        { num: 4, name: 'Leadership & HR Discussion', type: 'HR_INTERVIEW' },
      ];
      for (const rnd of rounds) {
        await commonConn.query(
          `INSERT INTO drive_rounds (drive_id, round_number, round_name, round_type, status)
           VALUES (?, ?, ?, ?, 'IN_PROGRESS')
           ON DUPLICATE KEY UPDATE round_name = VALUES(round_name)`,
          [driveId, rnd.num, rnd.name, rnd.type]
        );
      }
    }

    // 8. Sample Applications & Offers
    console.log('Inserting Student Applications and Offers...');
    const googleJobId = jobIdMap['Software Development Engineer - Campus 2027'];
    const msJobId = jobIdMap['Cloud Solutions & Systems Software Engineer'];
    const tcsJobId = jobIdMap['TCS Prime & Digital Systems Innovator'];

    const studentCse1Id = studentIdMap['2023CSE001'];
    const studentCse2Id = studentIdMap['2023CSE002'];
    const studentEce1Id = studentIdMap['2023ECE001'];

    // CSE1 applied to Google and Microsoft, offered at Google
    await commonConn.query(
      `INSERT INTO job_applications (job_id, student_id, register_number, department_code, current_round_number, status)
       VALUES (?, ?, '2023CSE001', 'CSE', 4, 'ACCEPTED')
       ON DUPLICATE KEY UPDATE status = 'ACCEPTED'`,
      [googleJobId, studentCse1Id]
    );
    const [[googleApp]] = await commonConn.query('SELECT id FROM job_applications WHERE job_id = ? AND student_id = ?', [googleJobId, studentCse1Id]);

    await commonConn.query(
      `INSERT INTO placement_offers (application_id, job_id, student_id, register_number, department_code, offered_ctc_lpa, issue_date, status)
       VALUES (?, ?, ?, '2023CSE001', 'CSE', 32.50, '2026-10-01', 'ACCEPTED')
       ON DUPLICATE KEY UPDATE status = 'ACCEPTED'`,
      [googleApp.id, googleJobId, studentCse1Id]
    );

    // CSE2 applied to Microsoft and TCS
    await commonConn.query(
      `INSERT INTO job_applications (job_id, student_id, register_number, department_code, current_round_number, status)
       VALUES (?, ?, '2023CSE002', 'CSE', 2, 'SHORTLISTED')
       ON DUPLICATE KEY UPDATE status = 'SHORTLISTED'`,
      [msJobId, studentCse2Id]
    );
    await commonConn.query(
      `INSERT INTO job_applications (job_id, student_id, register_number, department_code, current_round_number, status)
       VALUES (?, ?, '2023CSE002', 'CSE', 1, 'APPLIED')
       ON DUPLICATE KEY UPDATE status = 'APPLIED'`,
      [tcsJobId, studentCse2Id]
    );

    // ECE1 applied to TCS
    await commonConn.query(
      `INSERT INTO job_applications (job_id, student_id, register_number, department_code, current_round_number, status)
       VALUES (?, ?, '2023ECE001', 'ECE', 2, 'IN_PROCESS')
       ON DUPLICATE KEY UPDATE status = 'IN_PROCESS'`,
      [tcsJobId, studentEce1Id]
    );

    // 9. Coding Assessment & Questions
    console.log('Inserting Online Coding Assessment & Test Cases...');
    await commonConn.query(
      `INSERT INTO coding_assessments (id, title, description, duration_minutes, start_time, end_time, total_score, is_active)
       VALUES (1, 'National Campus Technical CodeSprint 2026', 'Comprehensive data structures, algorithmic problem solving, and optimization challenge.', 90, '2026-10-01 00:00:00', '2026-12-31 23:59:59', 100, 1)
       ON DUPLICATE KEY UPDATE title = VALUES(title)`
    );

    const questions = [
      {
        id: 1,
        title: 'Two Sum Target Problem',
        difficulty: 'EASY',
        points: 25,
        statement: 'Given an array of integers and an integer target, return the two distinct indices such that the numbers sum up to target.\nInput format: First line contains integer N and target separated by space. Second line contains N integers.\nOutput format: Print the two zero-based indices separated by space.',
        samples: [{ input: '4 9\n2 7 11 15', output: '0 1', explanation: '2 + 7 equals 9' }],
        hidden: [
          { input: '3 6\n3 2 4', output: '1 2' },
          { input: '5 100\n10 20 30 70 90', output: '2 3' },
          { input: '4 0\n-3 4 3 90', output: '0 2' }
        ],
      },
      {
        id: 2,
        title: 'Valid Palindrome String Check',
        difficulty: 'EASY',
        points: 25,
        statement: 'Given a single word or sentence, check if it reads the same backwards and forwards ignoring casing and non-alphanumeric characters.\nInput format: A single line string.\nOutput format: Print TRUE or FALSE.',
        samples: [{ input: 'racecar', output: 'TRUE', explanation: 'racecar is a valid palindrome' }],
        hidden: [
          { input: 'hello', output: 'FALSE' },
          { input: 'A man, a plan, a canal: Panama', output: 'TRUE' },
          { input: 'madam', output: 'TRUE' }
        ],
      },
      {
        id: 3,
        title: 'Maximum Subarray Sum (Kadane Algorithm)',
        difficulty: 'MEDIUM',
        points: 50,
        statement: 'Given an integer array nums, find the subarray with the largest sum, and print its sum.\nInput format: First line integer N. Second line N space-separated integers.\nOutput format: Print single integer representing maximum subarray sum.',
        samples: [{ input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6', explanation: 'Subarray [4, -1, 2, 1] has largest sum 6' }],
        hidden: [
          { input: '1\n1', output: '1' },
          { input: '5\n5 4 -1 7 8', output: '23' },
          { input: '3\n-5 -2 -1', output: '-1' }
        ],
      },
    ];

    for (const q of questions) {
      await commonConn.query(
        `INSERT INTO assessment_questions (id, assessment_id, title, difficulty, problem_statement, points, time_limit_ms, memory_limit_mb, sample_test_cases, hidden_test_cases)
         VALUES (?, 1, ?, ?, ?, ?, 2000, 256, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), problem_statement = VALUES(problem_statement)`,
        [q.id, q.title, q.difficulty, q.statement, q.points, JSON.stringify(q.samples), JSON.stringify(q.hidden)]
      );
    }

    // 10. Placement Policy
    console.log('Inserting Institutional Placement Policy...');
    await commonConn.query(
      `INSERT INTO placement_policies (policy_name, academic_year, max_offers_allowed, dream_offer_threshold_lpa, attendance_mandate_percent, rules_config, is_active)
       VALUES ('Institutional Placement Code of Conduct 2026-27', '2026-2027', 2, 10.00, 75, '{"allow_dream_override": true, "mandatory_mock_cleared": true, "max_active_backlogs": 0}', 1)
       ON DUPLICATE KEY UPDATE policy_name = VALUES(policy_name)`
    );

    // 11. Training Programs
    console.log('Inserting Training Programs...');
    const trainings = [
      {
        title: 'Advanced DSA & Graph Algorithms Accelerator',
        category: 'DSA_CODING',
        trainer: 'Dr. Arun Kumar (Ex-Amazon Senior Staff)',
        hours: 60,
        depts: ['CSE', 'IT', 'ECE'],
      },
      {
        title: 'Quant, Logical & Verbal Aptitude Masterclass',
        category: 'APTITUDE',
        trainer: 'Campus Career Edge Partners',
        hours: 45,
        depts: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'],
      },
      {
        title: 'Executive Communication & Mock HR Simulation',
        category: 'MOCK_INTERVIEWS',
        trainer: 'Ms. Shalini Iyer (Corporate HR Consultant)',
        hours: 30,
        depts: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'],
      },
    ];

    for (const tr of trainings) {
      await commonConn.query(
        `INSERT INTO training_programs (title, category, trainer_name, start_date, end_date, duration_hours, target_departments, status)
         VALUES (?, ?, ?, '2026-08-01', '2026-11-15', ?, ?, 'ONGOING')
         ON DUPLICATE KEY UPDATE trainer_name = VALUES(trainer_name)`,
        [tr.title, tr.category, tr.trainer, tr.hours, JSON.stringify(tr.depts)]
      );
    }

    // 12. Placement Cell Budget
    console.log('Inserting Placement Cell Budget...');
    await commonConn.query(
      `INSERT INTO placement_budget (fiscal_year, allocated_budget, spent_amount, training_expense, logistics_expense, hospitality_expense, software_license_expense)
       VALUES ('2026-2027', 2500000.00, 1420000.00, 750000.00, 280000.00, 150000.00, 240000.00)
       ON DUPLICATE KEY UPDATE allocated_budget = VALUES(allocated_budget), spent_amount = VALUES(spent_amount)`
    );

    // 13. Notifications
    console.log('Inserting Announcements & Notifications...');
    const notices = [
      {
        title: 'Google Campus Recruitment Drive 2026-27 - Application Portal Live',
        msg: 'Eligible B.Tech CSE, ECE & IT students with CGPA >= 8.00 and no active backlogs must verify their resumes before deadline.',
        role: 'STUDENT',
        dept: 'ALL',
        priority: 'HIGH',
        category: 'DRIVE_ALERT',
      },
      {
        title: 'Mandatory Online Coding Mock Assessment Round 1 Scheduled',
        msg: 'Online coding assessment on Data Structures and Algorithms is scheduled for this Saturday 10:00 AM on the LMS platform.',
        role: 'STUDENT',
        dept: 'ALL',
        priority: 'URGENT',
        category: 'ASSESSMENT',
      },
      {
        title: 'NIRF & NAAC Placement Verification Report Cycle Opened',
        msg: 'All department coordinators are requested to verify semester marks and offer acceptance letters for 2026-27 batch.',
        role: 'FACULTY_COORDINATOR',
        dept: 'ALL',
        priority: 'MEDIUM',
        category: 'POLICY',
      },
    ];

    for (const n of notices) {
      await commonConn.query(
        `INSERT INTO notifications (title, message, target_role, target_dept, priority, category)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE message = VALUES(message)`,
        [n.title, n.msg, n.role, n.dept, n.priority, n.category]
      );
    }

    // 14. Alumni Network
    console.log('Inserting Alumni Profiles...');
    await commonConn.query(
      `INSERT INTO alumni_network (user_id, graduation_year, department_code, current_company, job_role, experience_years, available_for_mentorship, referrals_available, linkedin_url)
       VALUES (?, 2024, 'CSE', 'Amazon Web Services', 'Senior Cloud Software Engineer', 3, 1, 1, 'https://linkedin.com/in/alex-fernandes-sample')
       ON DUPLICATE KEY UPDATE current_company = VALUES(current_company)`,
      [userIdMap['alumni.alex@example.com']]
    );

    await commonConn.end();

    // 15. Seed Department Databases (Isolated records)
    console.log('\nPopulating Department-Specific Isolated Academic Databases...');

    // CSE Department Database: lms_cse
    const cseConn = await mysql.createConnection({ ...dbConfig, database: 'lms_cse' });
    await cseConn.query(
      `INSERT INTO dept_students_academic (register_number, sem1_gpa, sem2_gpa, sem3_gpa, sem4_gpa, sem5_gpa, sem6_gpa, current_cgpa, active_backlogs, department_rank, faculty_mentor_name, mentor_remarks, verification_status)
       VALUES 
       ('2023CSE001', 9.20, 9.40, 9.50, 9.30, 9.40, 9.30, 9.35, 0, 1, 'Prof. Suresh Venkatesh', 'Exceptional coding and system design skills. Highly motivated.', 'VERIFIED'),
       ('2023CSE002', 8.20, 8.30, 8.50, 8.60, 8.40, 8.50, 8.42, 0, 8, 'Prof. Suresh Venkatesh', 'Strong full-stack skills and consistent academic performer.', 'VERIFIED')
       ON DUPLICATE KEY UPDATE current_cgpa = VALUES(current_cgpa)`
    );
    await cseConn.query(
      `INSERT INTO dept_training_attendance (training_program_id, register_number, sessions_attended, total_sessions, attendance_percentage, pre_assessment_score, post_assessment_score, status)
       VALUES 
       (1, '2023CSE001', 20, 20, 100.00, 85, 98, 'COMPLETED'),
       (1, '2023CSE002', 18, 20, 90.00, 72, 88, 'COMPLETED')
       ON DUPLICATE KEY UPDATE sessions_attended = VALUES(sessions_attended)`
    );
    await cseConn.query(
      `INSERT INTO dept_mock_evaluations (register_number, evaluator_name, technical_rating, communication_rating, problem_solving_rating, strengths, improvement_areas, evaluation_date)
       VALUES 
       ('2023CSE001', 'Prof. Suresh Venkatesh', 5, 5, 5, 'Superior algorithms intuition and confident communication', 'Keep practicing high-concurrency architecture', '2026-09-15'),
       ('2023CSE002', 'Prof. Suresh Venkatesh', 4, 4, 4, 'Good grasp of OOP, Spring Boot, and database tuning', 'Brush up on dynamic programming graphs', '2026-09-18')
       ON DUPLICATE KEY UPDATE technical_rating = VALUES(technical_rating)`
    );
    await cseConn.end();
    console.log('✓ Seeded CSE department records in `lms_cse`');

    // ECE Department Database: lms_ece
    const eceConn = await mysql.createConnection({ ...dbConfig, database: 'lms_ece' });
    await eceConn.query(
      `INSERT INTO dept_students_academic (register_number, sem1_gpa, sem2_gpa, sem3_gpa, sem4_gpa, sem5_gpa, sem6_gpa, current_cgpa, active_backlogs, department_rank, faculty_mentor_name, mentor_remarks, verification_status)
       VALUES 
       ('2023ECE001', 7.80, 8.00, 7.90, 8.10, 7.90, 8.00, 7.95, 0, 4, 'Dr. Meenakshi Sundaram', 'Good embedded systems aptitude. Preparing for TCS & core drives.', 'VERIFIED')
       ON DUPLICATE KEY UPDATE current_cgpa = VALUES(current_cgpa)`
    );
    await eceConn.end();
    console.log('✓ Seeded ECE department records in `lms_ece`');

    // MECH Department Database: lms_mech
    const mechConn = await mysql.createConnection({ ...dbConfig, database: 'lms_mech' });
    await mechConn.query(
      `INSERT INTO dept_students_academic (register_number, sem1_gpa, sem2_gpa, sem3_gpa, sem4_gpa, sem5_gpa, sem6_gpa, current_cgpa, active_backlogs, department_rank, faculty_mentor_name, mentor_remarks, verification_status)
       VALUES 
       ('2023MECH001', 7.00, 7.20, 6.80, 7.10, 7.30, 7.50, 7.15, 1, 14, 'Dr. Ramesh Kumar', 'Cleared 1 backlog. Eligible for L&T subject to waiver approval.', 'VERIFIED')
       ON DUPLICATE KEY UPDATE current_cgpa = VALUES(current_cgpa)`
    );
    // Add sample coordinator override for MECH student
    await mechConn.query(
      `INSERT INTO dept_eligibility_overrides (register_number, job_id, override_type, reason, approved_by)
       VALUES ('2023MECH001', ${jobIdMap['Graduate Engineer Trainee (GET) - Core Engineering']}, 'BACKLOG_WAIVER', 'Completed remedial training with 80% attendance. Backlog cleared in revaluation.', 'Dr. Ramesh Kumar')
       ON DUPLICATE KEY UPDATE reason = VALUES(reason)`
    );
    await mechConn.end();
    console.log('✓ Seeded MECH department records & waiver override in `lms_mech`');

    console.log('\n================================================================');
    console.log('✅ [SEEDING COMPLETE] Institutional & Department data populated!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ [SEEDING ERROR]', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
