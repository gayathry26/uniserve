const { v4: uuidv4 } = require('uuid');
const { queryCommon } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * List companies with search, tier, status, department, and academic year filtering.
 * Role-Based Access:
 * - STUDENT: Automatically filtered strictly to companies eligible for their department & academic year.
 * - ADMIN / TPO_OFFICER / SUPER_ADMIN: Views all companies with administrative filters, plus enrolled eligible student metrics.
 */
async function getAllCompanies(req, res, next) {
  try {
    const {
      tier,
      status,
      search,
      department,
      academic_year,
      viewAsRole,
      viewAsDept,
      viewAsYear,
    } = req.query;

    const user = req.user;
    const isStudent = user.role_name === 'STUDENT' || viewAsRole === 'STUDENT';
    const activeDept = (isStudent && user.department_code) || viewAsDept || department;
    const activeYear = (isStudent && user.academic_year) || viewAsYear || academic_year || '2026-2027';

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (tier && tier !== 'ALL') {
      whereClause += ' AND c.tier = ?';
      params.push(tier);
    }

    if (status && status !== 'ALL') {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += ' AND (c.name LIKE ? OR c.industry LIKE ? OR c.headquarters LIKE ? OR c.drive_venue LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    // Fetch all companies from DB
    const companies = await queryCommon(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM jobs WHERE company_id = c.id) AS active_jobs_count,
              (SELECT COUNT(*) FROM job_applications ja JOIN jobs j ON j.id = ja.job_id WHERE j.company_id = c.id) AS total_applications
       FROM companies c
       ${whereClause}
       ORDER BY c.tier = 'SUPER_DREAM' DESC, c.tier = 'DREAM' DESC, c.name ASC`,
      params
    );

    // Fetch students list to compute exact enrolled eligible candidate numbers
    const allStudents = await queryCommon(
      `SELECT id, department_code, academic_year, cgpa, active_backlogs FROM students_master`
    );

    // If student user is logged in, check their existing applications
    let studentApplications = [];
    if (user.student_id) {
      studentApplications = await queryCommon(
        `SELECT ja.id AS app_id, ja.status AS app_status, ja.current_round_number, j.company_id
         FROM job_applications ja
         JOIN jobs j ON j.id = ja.job_id
         WHERE ja.student_id = ?`,
        [user.student_id]
      );
    }
    const studentAppMap = {};
    for (const app of studentApplications) {
      studentAppMap[app.company_id] = app;
    }

    // Enrich and filter companies
    const enrichedCompanies = [];

    for (const comp of companies) {
      // Parse eligible departments
      let eligibleDepts = [];
      try {
        if (Array.isArray(comp.eligible_departments)) {
          eligibleDepts = comp.eligible_departments;
        } else if (typeof comp.eligible_departments === 'string') {
          eligibleDepts = JSON.parse(comp.eligible_departments);
        }
      } catch (e) {
        eligibleDepts = comp.eligible_departments ? comp.eligible_departments.split(',').map((d) => d.trim()) : [];
      }
      if (!eligibleDepts || eligibleDepts.length === 0) {
        eligibleDepts = ['CSE', 'ECE', 'MECH', 'EEE', 'CIVIL', 'IT'];
      }

      // Parse selection rounds
      let rounds = [];
      try {
        if (Array.isArray(comp.selection_rounds)) {
          rounds = comp.selection_rounds;
        } else if (typeof comp.selection_rounds === 'string') {
          rounds = JSON.parse(comp.selection_rounds);
        }
      } catch (e) {
        rounds = ['Online Assessment', 'Technical Interview', 'HR Discussion'];
      }
      if (!rounds || rounds.length === 0) {
        rounds = ['Online Assessment', 'Technical Interview', 'HR Discussion'];
      }

      const compAcademicYear = comp.academic_year || '2026-2027';

      // Calculate actual enrolled students who meet department and CGPA criteria
      const matchingEnrolledStudents = allStudents.filter((st) => {
        const matchesDept = eligibleDepts.includes(st.department_code);
        const matchesYear = !compAcademicYear || st.academic_year === compAcademicYear || compAcademicYear === 'ALL';
        const matchesCgpa = parseFloat(st.cgpa || 0) >= parseFloat(comp.min_cgpa || 0);
        return matchesDept && matchesYear && matchesCgpa;
      });

      // Role-Based Filtering
      if (isStudent) {
        // Must match student's department
        if (!eligibleDepts.includes(user.department_code)) {
          continue; // Student's department is not eligible
        }
        // Must match student's academic year (if specified)
        if (compAcademicYear && compAcademicYear !== 'ALL' && compAcademicYear !== user.academic_year) {
          continue; // Academic year does not match
        }
      } else {
        // Admin / TPO filter options
        if (department && department !== 'ALL' && !eligibleDepts.includes(department)) {
          continue;
        }
        if (academic_year && academic_year !== 'ALL' && compAcademicYear !== academic_year) {
          continue;
        }
      }

      // Check student's individual eligibility and application status
      let userQualifies = true;
      let userDisqualificationReason = null;
      if (isStudent) {
        if (parseFloat(user.cgpa || 0) < parseFloat(comp.min_cgpa || 0)) {
          userQualifies = false;
          userDisqualificationReason = `CGPA requirement not met (Required: ${comp.min_cgpa}, Yours: ${user.cgpa})`;
        }
      }

      const userApp = studentAppMap[comp.id] || null;

      enrichedCompanies.push({
        ...comp,
        eligible_departments: eligibleDepts,
        selection_rounds: rounds,
        academic_year: compAcademicYear,
        enrolled_matching_students_count: matchingEnrolledStudents.length,
        configured_eligible_quota: comp.eligible_student_count || 60,
        has_applied: !!userApp,
        application_status: userApp ? userApp.app_status : null,
        application_id: userApp ? userApp.app_id : null,
        user_qualifies: userQualifies,
        disqualification_reason: userDisqualificationReason,
      });
    }

    res.json({
      success: true,
      role: user.role_name,
      filterApplied: {
        isStudent,
        studentDepartment: isStudent ? user.department_code : null,
        studentAcademicYear: isStudent ? user.academic_year : null,
        department: department || 'ALL',
        academic_year: academic_year || 'ALL',
      },
      count: enrichedCompanies.length,
      data: enrichedCompanies,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single company by ID
 */
async function getCompanyById(req, res, next) {
  try {
    const companyId = req.params.id;
    const [comp] = await queryCommon(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM jobs WHERE company_id = c.id) AS active_jobs_count
       FROM companies c
       WHERE c.id = ?`,
      [companyId]
    );

    if (!comp) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    try {
      if (typeof comp.eligible_departments === 'string') {
        comp.eligible_departments = JSON.parse(comp.eligible_departments);
      }
      if (typeof comp.selection_rounds === 'string') {
        comp.selection_rounds = JSON.parse(comp.selection_rounds);
      }
    } catch (e) {}

    res.json({ success: true, data: comp });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new company profile with eligible departments, academic year, and student capacity
 */
async function createCompany(req, res, next) {
  try {
    const {
      name,
      industry,
      website,
      headquarters,
      contact_email,
      contact_phone,
      tier,
      status,
      rating,
      logo_url,
      description,
      eligible_departments,
      academic_year,
      eligible_student_count,
      min_cgpa,
      package_ctc,
      drive_date,
      drive_venue,
      drive_mode,
      selection_stage,
      selection_rounds,
      application_deadline,
    } = req.body;

    if (!name || !industry) {
      return res.status(400).json({ success: false, message: 'Company name and industry are required.' });
    }

    const trimmedName = name.trim();
    const [existing] = await queryCommon('SELECT id FROM companies WHERE LOWER(name) = LOWER(?)', [trimmedName]);
    if (existing) {
      return res.status(409).json({ success: false, message: `Company '${trimmedName}' is already registered.` });
    }

    let formattedDeadline = application_deadline && String(application_deadline).trim() ? String(application_deadline).replace('T', ' ') : null;
    if (formattedDeadline && formattedDeadline.length === 16) {
      formattedDeadline += ':00';
    }

    let driveType = (drive_mode || 'ON_CAMPUS').toUpperCase().replace(/\s+/g, '_');
    if (!['ON_CAMPUS', 'POOLED', 'OFF_CAMPUS', 'VIRTUAL', 'HYBRID'].includes(driveType)) {
      driveType = 'ON_CAMPUS';
    }

    const companyUuid = uuidv4();
    const deptsJson = JSON.stringify(
      Array.isArray(eligible_departments) && eligible_departments.length > 0
        ? eligible_departments
        : ['CSE', 'ECE', 'MECH', 'EEE', 'CIVIL', 'IT']
    );
    const roundsJson = JSON.stringify(
      Array.isArray(selection_rounds) && selection_rounds.length > 0
        ? selection_rounds
        : ['Resume Screening', 'Online Coding Assessment', 'Technical Interview', 'HR Discussion']
    );

    await queryCommon(
      `INSERT INTO companies (
        uuid, name, industry, website, headquarters, contact_email, contact_phone, 
        tier, status, rating, logo_url, description, eligible_departments, academic_year, 
        eligible_student_count, min_cgpa, package_ctc, drive_date, drive_venue, drive_mode, 
        selection_stage, selection_rounds, application_deadline, verified_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyUuid,
        trimmedName,
        industry.trim(),
        website || null,
        headquarters || null,
        contact_email || null,
        contact_phone || null,
        tier || 'REGULAR',
        status || 'ACTIVE',
        rating || 4.5,
        logo_url || null,
        description || null,
        deptsJson,
        academic_year || '2026-2027',
        parseInt(eligible_student_count) || 60,
        parseFloat(min_cgpa) || 6.5,
        parseFloat(package_ctc) || 12.0,
        drive_date || '2026-11-25',
        drive_venue || 'Main Campus Placement Block',
        driveType,
        selection_stage || 'Registration Stage',
        roundsJson,
        formattedDeadline,
        req.user.id,
      ]
    );

    // Retrieve created company ID
    const [createdRow] = await queryCommon(`SELECT id FROM companies WHERE uuid = ?`, [companyUuid]);
    const companyId = createdRow.id;

    // Automatically sync a master job and placement drive for this company
    const jobUuid = uuidv4();
    const jobTitle = `${trimmedName} - Campus Recruitment Drive (${academic_year || '2026-2027'})`;
    const criteriaObj = {
      allowed_departments: Array.isArray(eligible_departments) ? eligible_departments : ['CSE', 'ECE', 'IT'],
      min_cgpa: parseFloat(min_cgpa) || 6.5,
    };

    await queryCommon(
      `INSERT INTO jobs (uuid, company_id, title, role_type, job_description, eligibility_criteria, min_cgpa, ctc_lpa, locations, vacancies, deadline_date, status)
       VALUES (?, ?, ?, 'FULL_TIME', ?, ?, ?, ?, ?, ?, COALESCE(?, '2026-12-31 23:59:59'), 'PUBLISHED')`,
      [
        jobUuid,
        companyId,
        jobTitle,
        description || `${trimmedName} campus placement opportunity.`,
        JSON.stringify(criteriaObj),
        parseFloat(min_cgpa) || 6.5,
        parseFloat(package_ctc) || 12.0,
        headquarters || 'Pan-India',
        parseInt(eligible_student_count) || 60,
        formattedDeadline,
      ]
    );

    const [jobRow] = await queryCommon(`SELECT id FROM jobs WHERE uuid = ?`, [jobUuid]);
    if (jobRow) {
      const driveUuid = uuidv4();
      await queryCommon(
        `INSERT INTO placement_drives (uuid, job_id, drive_title, drive_type, drive_date, venue, current_stage, total_rounds, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UPCOMING')`,
        [
          driveUuid,
          jobRow.id,
          `${trimmedName} Placement Drive ${academic_year || '2026-2027'}`,
          driveType,
          drive_date || '2026-11-25',
          drive_venue || 'Main Campus Placement Block',
          selection_stage || 'Online Assessment',
          Array.isArray(selection_rounds) ? selection_rounds.length : 4,
        ]
      );
    }

    await logAuditEvent({
      userId: req.user.id,
      action: 'CREATE_COMPANY',
      module: 'COMPANY_MANAGEMENT',
      details: {
        companyName: name,
        tier,
        academic_year,
        eligible_departments,
        eligible_student_count,
      },
    });

    res.status(201).json({
      success: true,
      message: `Placement company '${name}' registered successfully with eligible departments and student quota.`,
      companyId,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update company details (eligible departments, academic year, eligible student quota, etc.)
 */
async function updateCompany(req, res, next) {
  try {
    const companyId = req.params.id;
    const {
      name,
      industry,
      website,
      headquarters,
      contact_email,
      contact_phone,
      tier,
      status,
      rating,
      logo_url,
      description,
      eligible_departments,
      academic_year,
      eligible_student_count,
      min_cgpa,
      package_ctc,
      drive_date,
      drive_venue,
      drive_mode,
      selection_stage,
      selection_rounds,
      application_deadline,
    } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      const trimmedName = name.trim();
      const [existing] = await queryCommon('SELECT id FROM companies WHERE LOWER(name) = LOWER(?) AND id != ?', [trimmedName, companyId]);
      if (existing) {
        return res.status(409).json({ success: false, message: `Another company is already registered with name '${trimmedName}'.` });
      }
      updates.push('name = ?');
      params.push(trimmedName);
    }
    if (industry !== undefined) { updates.push('industry = ?'); params.push(industry.trim()); }
    if (website !== undefined) { updates.push('website = ?'); params.push(website || null); }
    if (headquarters !== undefined) { updates.push('headquarters = ?'); params.push(headquarters || null); }
    if (contact_email !== undefined) { updates.push('contact_email = ?'); params.push(contact_email || null); }
    if (contact_phone !== undefined) { updates.push('contact_phone = ?'); params.push(contact_phone || null); }
    if (tier !== undefined) { updates.push('tier = ?'); params.push(tier); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (rating !== undefined) { updates.push('rating = ?'); params.push(rating); }
    if (logo_url !== undefined) { updates.push('logo_url = ?'); params.push(logo_url || null); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description || null); }
    if (eligible_departments !== undefined) {
      updates.push('eligible_departments = ?');
      params.push(JSON.stringify(eligible_departments));
    }
    if (academic_year !== undefined) { updates.push('academic_year = ?'); params.push(academic_year); }
    if (eligible_student_count !== undefined) { updates.push('eligible_student_count = ?'); params.push(parseInt(eligible_student_count)); }
    if (min_cgpa !== undefined) { updates.push('min_cgpa = ?'); params.push(parseFloat(min_cgpa)); }
    if (package_ctc !== undefined) { updates.push('package_ctc = ?'); params.push(parseFloat(package_ctc)); }
    if (drive_date !== undefined) { updates.push('drive_date = ?'); params.push(drive_date); }
    if (drive_venue !== undefined) { updates.push('drive_venue = ?'); params.push(drive_venue); }
    
    let normalizedDriveMode = drive_mode;
    if (drive_mode !== undefined) {
      normalizedDriveMode = (drive_mode || 'ON_CAMPUS').toUpperCase().replace(/\s+/g, '_');
      if (!['ON_CAMPUS', 'POOLED', 'OFF_CAMPUS', 'VIRTUAL', 'HYBRID'].includes(normalizedDriveMode)) {
        normalizedDriveMode = 'ON_CAMPUS';
      }
      updates.push('drive_mode = ?');
      params.push(normalizedDriveMode);
    }

    if (selection_stage !== undefined) { updates.push('selection_stage = ?'); params.push(selection_stage); }
    if (selection_rounds !== undefined) {
      updates.push('selection_rounds = ?');
      params.push(JSON.stringify(selection_rounds));
    }
    if (application_deadline !== undefined) {
      let formattedDeadline = application_deadline && String(application_deadline).trim() ? String(application_deadline).replace('T', ' ') : null;
      if (formattedDeadline && formattedDeadline.length === 16) {
        formattedDeadline += ':00';
      }
      updates.push('application_deadline = ?');
      params.push(formattedDeadline);
    }

    if (updates.length > 0) {
      params.push(companyId);
      await queryCommon(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Sync corresponding jobs & drives if updated
    if (package_ctc !== undefined || min_cgpa !== undefined || eligible_departments !== undefined) {
      await queryCommon(
        `UPDATE jobs 
         SET ctc_lpa = COALESCE(?, ctc_lpa), 
             min_cgpa = COALESCE(?, min_cgpa),
             eligibility_criteria = COALESCE(?, eligibility_criteria)
         WHERE company_id = ?`,
        [
          package_ctc !== undefined ? parseFloat(package_ctc) : null,
          min_cgpa !== undefined ? parseFloat(min_cgpa) : null,
          eligible_departments !== undefined ? JSON.stringify({ allowed_departments: eligible_departments }) : null,
          companyId,
        ]
      );
    }

    if (drive_date !== undefined || drive_venue !== undefined || drive_mode !== undefined || selection_stage !== undefined) {
      await queryCommon(
        `UPDATE placement_drives pd
         JOIN jobs j ON j.id = pd.job_id
         SET pd.drive_date = COALESCE(?, pd.drive_date),
             pd.venue = COALESCE(?, pd.venue),
             pd.drive_type = COALESCE(?, pd.drive_type),
             pd.current_stage = COALESCE(?, pd.current_stage)
         WHERE j.company_id = ?`,
        [drive_date || null, drive_venue || null, normalizedDriveMode || null, selection_stage || null, companyId]
      );
    }

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_COMPANY',
      module: 'COMPANY_MANAGEMENT',
      details: { companyId, name, tier, academic_year, eligible_departments, eligible_student_count },
    });

    res.json({ success: true, message: 'Placement company details and eligibility criteria updated successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete company
 */
async function deleteCompany(req, res, next) {
  try {
    const companyId = req.params.id;
    const [comp] = await queryCommon('SELECT name FROM companies WHERE id = ?', [companyId]);
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    await queryCommon('DELETE FROM companies WHERE id = ?', [companyId]);

    await logAuditEvent({
      userId: req.user.id,
      action: 'DELETE_COMPANY',
      module: 'COMPANY_MANAGEMENT',
      details: { companyId, name: comp.name },
    });

    res.json({ success: true, message: `Company '${comp.name}' deleted successfully.` });
  } catch (err) {
    next(err);
  }
}

/**
 * Student applies / registers directly for a company's placement drive
 */
async function applyCompanyDrive(req, res, next) {
  try {
    const companyId = req.params.id;
    const user = req.user;

    if (!user.student_id) {
      return res.status(400).json({ success: false, message: 'Only registered students can apply for placement drives.' });
    }

    // Verify company eligibility
    const [comp] = await queryCommon('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Placement company not found.' });
    }

    let eligibleDepts = [];
    try {
      eligibleDepts = Array.isArray(comp.eligible_departments)
        ? comp.eligible_departments
        : JSON.parse(comp.eligible_departments);
    } catch (e) {
      eligibleDepts = comp.eligible_departments ? comp.eligible_departments.split(',') : [];
    }

    if (eligibleDepts.length > 0 && !eligibleDepts.includes(user.department_code)) {
      return res.status(403).json({
        success: false,
        message: `Your department (${user.department_code}) is not eligible for ${comp.name}.`,
      });
    }

    if (parseFloat(user.cgpa || 0) < parseFloat(comp.min_cgpa || 0)) {
      return res.status(403).json({
        success: false,
        message: `Minimum CGPA of ${comp.min_cgpa} is required to apply. Your CGPA is ${user.cgpa}.`,
      });
    }

    // Find or create associated job
    let [job] = await queryCommon('SELECT id FROM jobs WHERE company_id = ? LIMIT 1', [companyId]);
    if (!job) {
      const jobUuid = uuidv4();
      await queryCommon(
        `INSERT INTO jobs (uuid, company_id, title, role_type, job_description, ctc_lpa, deadline_date, status)
         VALUES (?, ?, ?, 'FULL_TIME', ?, ?, '2026-12-31 23:59:59', 'PUBLISHED')`,
        [jobUuid, companyId, `${comp.name} Campus Drive`, comp.description || 'Full-time campus drive', comp.package_ctc || 10.0]
      );
      const [newJob] = await queryCommon('SELECT id FROM jobs WHERE uuid = ?', [jobUuid]);
      job = newJob;
    }

    // Check existing application
    const existing = await queryCommon(
      'SELECT id, status FROM job_applications WHERE job_id = ? AND student_id = ?',
      [job.id, user.student_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `You have already applied for ${comp.name}. Current status: ${existing[0].status}`,
      });
    }

    // Insert new application
    await queryCommon(
      `INSERT INTO job_applications (job_id, student_id, register_number, department_code, current_round_number, status)
       VALUES (?, ?, ?, ?, 1, 'APPLIED')`,
      [job.id, user.student_id, user.register_number, user.department_code]
    );

    await logAuditEvent({
      userId: user.id,
      action: 'STUDENT_APPLIED_DRIVE',
      module: 'APPLICATIONS',
      details: { companyId, companyName: comp.name, studentId: user.student_id },
      departmentCode: user.department_code,
    });

    res.status(201).json({
      success: true,
      message: `Application submitted successfully for ${comp.name}! Good luck with the recruitment drive.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Return system metadata for departments & academic years
 */
async function getMetadata(req, res, next) {
  try {
    const departments = [
      { code: 'CSE', name: 'Computer Science & Engineering' },
      { code: 'ECE', name: 'Electronics & Communication Engineering' },
      { code: 'EEE', name: 'Electrical & Electronics Engineering' },
      { code: 'MECH', name: 'Mechanical Engineering' },
      { code: 'CIVIL', name: 'Civil Engineering' },
      { code: 'IT', name: 'Information Technology' },
      { code: 'AIDS', name: 'Artificial Intelligence & Data Science' },
    ];

    const academicYears = ['2026-2027', '2025-2026', '2024-2025', '2027-2028'];
    const tiers = ['SUPER_DREAM', 'DREAM', 'REGULAR', 'MASS_RECRUITER'];

    res.json({
      success: true,
      departments,
      academicYears,
      tiers,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  applyCompanyDrive,
  getMetadata,
};
