const { v4: uuidv4 } = require('uuid');
const { queryCommon } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * List companies with search, tier, status, department, and academic year filtering.
 * Role-Based Categories for Students:
 * - ELIGIBLE: Student meets dept, year, CGPA, and backlog criteria.
 * - APPLIED: Student has an active application.
 * - INELIGIBLE: Reason for ineligibility attached (CGPA cutoff, dept not whitelisted, deadline passed).
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

    // Fetch all companies from DB with their linked job and drive
    const companies = await queryCommon(
      `SELECT c.*, 
              j.id AS job_id, j.title AS job_title, j.max_backlogs, j.vacancies,
              pd.id AS drive_id, pd.drive_title, pd.drive_type, pd.current_stage AS drive_stage, pd.status AS drive_status,
              (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status != 'WITHDRAWN') AS applied_count,
              (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'SHORTLISTED') AS shortlisted_count,
              (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND (ja.status = 'ACCEPTED' OR ja.final_result = 'SELECTED')) AS selected_count,
              (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND (ja.status = 'REJECTED' OR ja.final_result = 'REJECTED')) AS rejected_count
       FROM companies c
       LEFT JOIN jobs j ON j.company_id = c.id
       LEFT JOIN placement_drives pd ON pd.job_id = j.id
       ${whereClause}
       ORDER BY c.tier = 'SUPER_DREAM' DESC, c.tier = 'DREAM' DESC, c.name ASC`,
      params
    );

    // Fetch all students to compute exact enrolled eligible candidate numbers for admin views
    const allStudents = await queryCommon(
      `SELECT id, department_code, academic_year, cgpa, active_backlogs FROM students_master`
    );

    // Fetch all rounds per drive
    const driveIds = companies.map((c) => c.drive_id).filter(Boolean);
    let allRoundsMap = {};
    if (driveIds.length > 0) {
      const roundsRows = await queryCommon(
        `SELECT * FROM drive_rounds WHERE drive_id IN (${driveIds.join(',')}) ORDER BY round_number ASC`
      );
      for (const r of roundsRows) {
        if (!allRoundsMap[r.drive_id]) allRoundsMap[r.drive_id] = [];
        allRoundsMap[r.drive_id].push(r);
      }
    }

    // If student user is logged in, check their existing applications
    let studentApplications = [];
    if (user.student_id) {
      studentApplications = await queryCommon(
        `SELECT ja.id AS app_id, ja.status AS app_status, ja.eligibility_status, ja.final_result,
                ja.current_round_number, ja.applied_at, ja.interview_scheduled_at, ja.interview_venue_or_link, ja.feedback,
                j.company_id, ja.drive_id
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

    // Fetch logged in student's master academic profile if student
    let studentProfile = null;
    if (user.student_id) {
      const [st] = await queryCommon(
        `SELECT id, department_code, academic_year, cgpa, active_backlogs, current_semester FROM students_master WHERE id = ?`,
        [user.student_id]
      );
      studentProfile = st;
    }

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

      // Selection rounds
      let rounds = allRoundsMap[comp.drive_id] || [];
      if (rounds.length === 0) {
        let parsedRounds = [];
        try {
          if (Array.isArray(comp.selection_rounds)) parsedRounds = comp.selection_rounds;
          else if (typeof comp.selection_rounds === 'string') parsedRounds = JSON.parse(comp.selection_rounds);
        } catch (e) {
          parsedRounds = ['Resume Screening', 'Online Assessment', 'Technical Interview', 'HR Discussion'];
        }
        rounds = (parsedRounds || []).map((name, idx) => ({
          round_number: idx + 1,
          round_name: name,
          round_type: 'TECH_INTERVIEW',
          status: 'PENDING',
        }));
      }

      const compAcademicYear = comp.academic_year || '2026-2027';

      // Calculate matching enrolled students
      const matchingEnrolledStudents = allStudents.filter((st) => {
        const matchesDept = eligibleDepts.includes(st.department_code);
        const matchesYear = !compAcademicYear || st.academic_year === compAcademicYear || compAcademicYear === 'ALL';
        const matchesCgpa = parseFloat(st.cgpa || 0) >= parseFloat(comp.min_cgpa || 0);
        return matchesDept && matchesYear && matchesCgpa;
      });

      // Admin / TPO filtering (by department or batch/year dropdown)
      if (!isStudent) {
        if (department && department !== 'ALL' && !eligibleDepts.includes(department)) {
          continue;
        }
        if (academic_year && academic_year !== 'ALL' && compAcademicYear !== academic_year) {
          continue;
        }
      }

      // Student detailed eligibility check
      const userApp = studentAppMap[comp.id] || null;
      let isEligible = true;
      const ineligibilityReasons = [];

      const targetDept = (studentProfile && studentProfile.department_code) || user.department_code;
      const targetYear = (studentProfile && studentProfile.academic_year) || user.academic_year;
      const targetCgpa = studentProfile ? parseFloat(studentProfile.cgpa || 0) : parseFloat(user.cgpa || 0);
      const targetBacklogs = studentProfile ? parseInt(studentProfile.active_backlogs || 0, 10) : 0;

      if (!eligibleDepts.includes(targetDept)) {
        isEligible = false;
        ineligibilityReasons.push(`Branch '${targetDept}' is not included in eligible departments [${eligibleDepts.join(', ')}].`);
      }

      if (compAcademicYear && compAcademicYear !== 'ALL' && targetYear && compAcademicYear !== targetYear) {
        isEligible = false;
        ineligibilityReasons.push(`Academic Batch (${targetYear}) does not match required cohort (${compAcademicYear}).`);
      }

      if (targetCgpa < parseFloat(comp.min_cgpa || 0)) {
        isEligible = false;
        ineligibilityReasons.push(`Minimum CGPA requirement is ${comp.min_cgpa} (Your CGPA: ${targetCgpa.toFixed(2)}).`);
      }

      const maxAllowedBacklogs = comp.max_backlogs !== null && comp.max_backlogs !== undefined ? parseInt(comp.max_backlogs, 10) : 0;
      if (targetBacklogs > maxAllowedBacklogs) {
        isEligible = false;
        ineligibilityReasons.push(`Active backlogs (${targetBacklogs}) exceed maximum allowed (${maxAllowedBacklogs}).`);
      }

      if (comp.application_deadline) {
        const deadlineDate = new Date(comp.application_deadline);
        if (new Date() > deadlineDate) {
          isEligible = false;
          ineligibilityReasons.push(`Application deadline expired on ${comp.application_deadline}.`);
        }
      }

      // Category for Student Portal: 'APPLIED', 'ELIGIBLE', or 'INELIGIBLE'
      let category = 'ELIGIBLE';
      if (userApp && userApp.app_status !== 'WITHDRAWN') {
        category = 'APPLIED';
      } else if (!isEligible) {
        category = 'INELIGIBLE';
      }

      enrichedCompanies.push({
        ...comp,
        eligible_departments: eligibleDepts,
        selection_rounds: rounds,
        academic_year: compAcademicYear,
        enrolled_matching_students_count: matchingEnrolledStudents.length,
        configured_eligible_quota: comp.eligible_student_count || 60,
        registered_count: comp.applied_count || 0,
        // Student status info
        is_eligible: isEligible,
        ineligibility_reasons: ineligibilityReasons,
        category,
        has_applied: !!(userApp && userApp.app_status !== 'WITHDRAWN'),
        application_id: userApp ? userApp.app_id : null,
        application_status: userApp ? userApp.app_status : null,
        eligibility_status: userApp ? userApp.eligibility_status : null,
        final_result: userApp ? userApp.final_result : null,
        current_round_number: userApp ? userApp.current_round_number : 1,
        applied_at: userApp ? userApp.applied_at : null,
        interview_scheduled_at: userApp ? userApp.interview_scheduled_at : null,
        interview_venue_or_link: userApp ? userApp.interview_venue_or_link : null,
        feedback: userApp ? userApp.feedback : null,
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
 * Get detailed company by ID with its recruitment drive, rounds, announcements, and metrics
 */
async function getCompanyById(req, res, next) {
  try {
    const companyId = req.params.id;
    const [comp] = await queryCommon(
      `SELECT c.*, 
              j.id AS job_id, j.title AS job_title, j.max_backlogs, j.vacancies,
              pd.id AS drive_id, pd.drive_title, pd.drive_type, pd.current_stage AS drive_stage, pd.status AS drive_status,
              (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status != 'WITHDRAWN') AS applied_count,
              (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'SHORTLISTED') AS shortlisted_count,
              (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND (ja.status = 'ACCEPTED' OR ja.final_result = 'SELECTED')) AS selected_count,
              (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND (ja.status = 'REJECTED' OR ja.final_result = 'REJECTED')) AS rejected_count
       FROM companies c
       LEFT JOIN jobs j ON j.company_id = c.id
       LEFT JOIN placement_drives pd ON pd.job_id = j.id
       WHERE c.id = ?`,
      [companyId]
    );

    if (!comp) {
      return res.status(404).json({ success: false, message: 'Placement Company not found.' });
    }

    // Rounds
    let rounds = [];
    if (comp.drive_id) {
      rounds = await queryCommon(
        `SELECT * FROM drive_rounds WHERE drive_id = ? ORDER BY round_number ASC`,
        [comp.drive_id]
      );
    }

    // Eligible Departments
    let eligibleDepts = [];
    try {
      if (typeof comp.eligible_departments === 'string') {
        eligibleDepts = JSON.parse(comp.eligible_departments);
      } else if (Array.isArray(comp.eligible_departments)) {
        eligibleDepts = comp.eligible_departments;
      }
    } catch (e) {
      eligibleDepts = comp.eligible_departments ? comp.eligible_departments.split(',') : [];
    }

    // Announcements
    const announcements = await queryCommon(
      `SELECT da.*, u.first_name, u.last_name, u.email 
       FROM drive_announcements da
       LEFT JOIN users u ON u.id = da.published_by
       WHERE da.company_id = ?
       ORDER BY da.created_at DESC`,
      [companyId]
    );

    // If student, attach their specific application
    let studentApplication = null;
    if (req.user.student_id) {
      const [app] = await queryCommon(
        `SELECT ja.*, dr.round_name AS current_round_name
         FROM job_applications ja
         JOIN jobs j ON j.id = ja.job_id
         LEFT JOIN placement_drives pd ON pd.job_id = j.id
         LEFT JOIN drive_rounds dr ON dr.drive_id = pd.id AND dr.round_number = ja.current_round_number
         WHERE j.company_id = ? AND ja.student_id = ?`,
        [companyId, req.user.student_id]
      );
      studentApplication = app || null;
    }

    res.json({
      success: true,
      data: {
        ...comp,
        eligible_departments: eligibleDepts,
        selection_rounds: rounds,
        announcements,
        student_application: studentApplication,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get registered students / applicants for a specific placement company (Placement Officer / Admin view)
 * Supports search, filters by dept, batch, eligibility, application status, and selection round.
 */
async function getCompanyApplicants(req, res, next) {
  try {
    const companyId = req.params.id;
    const {
      search,
      department,
      batch,
      eligibility_status,
      status,
      round_number,
    } = req.query;

    const [comp] = await queryCommon('SELECT id, name FROM companies WHERE id = ?', [companyId]);
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    let whereClause = 'WHERE j.company_id = ?';
    const params = [companyId];

    if (search) {
      whereClause += ' AND (sm.register_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (department && department !== 'ALL') {
      whereClause += ' AND sm.department_code = ?';
      params.push(department);
    }

    if (batch && batch !== 'ALL') {
      whereClause += ' AND sm.academic_year = ?';
      params.push(batch);
    }

    if (eligibility_status && eligibility_status !== 'ALL') {
      whereClause += ' AND ja.eligibility_status = ?';
      params.push(eligibility_status);
    }

    if (status && status !== 'ALL') {
      whereClause += ' AND ja.status = ?';
      params.push(status);
    }

    if (round_number && round_number !== 'ALL') {
      whereClause += ' AND ja.current_round_number = ?';
      params.push(parseInt(round_number, 10));
    }

    const applicants = await queryCommon(
      `SELECT ja.id AS application_id, ja.student_id, ja.job_id, ja.drive_id,
              ja.status AS application_status, ja.eligibility_status, ja.ineligibility_reason,
              ja.current_round_number, ja.final_result, ja.applied_at, ja.updated_at,
              ja.interview_scheduled_at, ja.interview_venue_or_link, ja.feedback,
              sm.register_number, sm.roll_number, sm.department_code, sm.programme,
              sm.batch, sm.academic_year, sm.cgpa, sm.active_backlogs, sm.placement_status,
              sm.tenth_percentage, sm.twelfth_percentage, sm.skills, sm.linkedin_url, sm.github_url,
              u.first_name, u.last_name, u.email, u.phone,
              dr.round_name AS current_round_name
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       LEFT JOIN placement_drives pd ON pd.job_id = j.id
       LEFT JOIN drive_rounds dr ON dr.drive_id = pd.id AND dr.round_number = ja.current_round_number
       JOIN students_master sm ON sm.id = ja.student_id
       JOIN users u ON u.id = sm.user_id
       ${whereClause}
       ORDER BY ja.applied_at DESC`,
      params
    );

    // Compute department-wise and status statistics
    const allApplicantsForComp = await queryCommon(
      `SELECT sm.department_code, ja.status, ja.eligibility_status, ja.final_result
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       JOIN students_master sm ON sm.id = ja.student_id
       WHERE j.company_id = ?`,
      [companyId]
    );

    const departmentCounts = {};
    const statusCounts = {};
    const eligibilityCounts = {};

    for (const app of allApplicantsForComp) {
      departmentCounts[app.department_code] = (departmentCounts[app.department_code] || 0) + 1;
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      const elig = app.eligibility_status || 'ELIGIBLE';
      eligibilityCounts[elig] = (eligibilityCounts[elig] || 0) + 1;
    }

    res.json({
      success: true,
      companyId: parseInt(companyId, 10),
      companyName: comp.name,
      total_registered: allApplicantsForComp.length,
      filtered_count: applicants.length,
      department_counts: departmentCounts,
      status_counts: statusCounts,
      eligibility_counts: eligibilityCounts,
      data: applicants,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update candidate application status, eligibility, round, schedule, or final result
 */
async function updateCompanyApplicant(req, res, next) {
  try {
    const { id: companyId, applicationId } = req.params;
    const {
      status,
      eligibility_status,
      ineligibility_reason,
      current_round_number,
      final_result,
      interview_scheduled_at,
      interview_venue_or_link,
      feedback,
    } = req.body;

    const [currentApp] = await queryCommon(
      `SELECT ja.*, sm.user_id, sm.register_number, u.first_name, u.email, c.name AS company_name
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       JOIN companies c ON c.id = j.company_id
       JOIN students_master sm ON sm.id = ja.student_id
       JOIN users u ON u.id = sm.user_id
       WHERE ja.id = ? AND j.company_id = ?`,
      [applicationId, companyId]
    );

    if (!currentApp) {
      return res.status(404).json({ success: false, message: 'Applicant record not found for this company.' });
    }

    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (eligibility_status !== undefined) {
      updates.push('eligibility_status = ?');
      params.push(eligibility_status);
    }
    if (ineligibility_reason !== undefined) {
      updates.push('ineligibility_reason = ?');
      params.push(ineligibility_reason);
    }
    if (current_round_number !== undefined) {
      updates.push('current_round_number = ?');
      params.push(parseInt(current_round_number, 10));
    }
    if (final_result !== undefined) {
      updates.push('final_result = ?');
      params.push(final_result);
    }
    if (interview_scheduled_at !== undefined) {
      let formatted = interview_scheduled_at ? String(interview_scheduled_at).replace('T', ' ') : null;
      if (formatted && formatted.length === 16) formatted += ':00';
      updates.push('interview_scheduled_at = ?');
      params.push(formatted);
    }
    if (interview_venue_or_link !== undefined) {
      updates.push('interview_venue_or_link = ?');
      params.push(interview_venue_or_link);
    }
    if (feedback !== undefined) {
      updates.push('feedback = ?');
      params.push(feedback);
    }

    if (updates.length > 0) {
      params.push(applicationId);
      await queryCommon(`UPDATE job_applications SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Disptach in-app notification to affected student
    try {
      let notifTitle = `${currentApp.company_name} Drive Update`;
      let notifMsg = `Your application status for ${currentApp.company_name} has been updated.`;

      if (status === 'SHORTLISTED') {
        notifTitle = `🎉 Shortlisted: ${currentApp.company_name}`;
        notifMsg = `Congratulations! You have been shortlisted for ${currentApp.company_name}. Current round: Round ${current_round_number || currentApp.current_round_number}.`;
      } else if (final_result === 'SELECTED' || status === 'ACCEPTED') {
        notifTitle = `🌟 Selected: ${currentApp.company_name}`;
        notifMsg = `Congratulations ${currentApp.first_name}! You have been selected in the campus recruitment drive for ${currentApp.company_name}!`;
      } else if (status === 'REJECTED' || final_result === 'REJECTED') {
        notifTitle = `Application Result: ${currentApp.company_name}`;
        notifMsg = `Thank you for participating in the ${currentApp.company_name} campus drive. Your application has concluded for this cycle.`;
      } else if (interview_scheduled_at) {
        notifTitle = `📅 Interview Scheduled: ${currentApp.company_name}`;
        notifMsg = `Your assessment/interview round for ${currentApp.company_name} has been scheduled for ${interview_scheduled_at} at ${interview_venue_or_link || 'Virtual Meet'}.`;
      }

      await queryCommon(
        `INSERT INTO notifications (title, message, target_role, target_dept, priority, category, created_by)
         VALUES (?, ?, 'STUDENT', ?, 'HIGH', 'DRIVE_ALERT', ?)`,
        [notifTitle, notifMsg, currentApp.department_code, req.user.id]
      );
    } catch (notifErr) {
      console.warn('[Notification Error]', notifErr.message);
    }

    // Log Audit Event
    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_APPLICANT_STATUS',
      module: 'COMPANY_MANAGEMENT',
      details: {
        companyId,
        applicationId,
        studentId: currentApp.student_id,
        previousStatus: currentApp.status,
        newStatus: status || currentApp.status,
        round: current_round_number || currentApp.current_round_number,
        finalResult: final_result || currentApp.final_result,
      },
    });

    res.json({
      success: true,
      message: `Applicant ${currentApp.first_name} (${currentApp.register_number}) updated successfully.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk status updates on multiple selected applicants (Shortlist, Advance Round, Reject, etc.)
 */
async function bulkUpdateCompanyApplicants(req, res, next) {
  try {
    const companyId = req.params.id;
    const { application_ids, action, target_round, remarks } = req.body;

    if (!Array.isArray(application_ids) || application_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'application_ids must be a non-empty array.' });
    }

    const [comp] = await queryCommon('SELECT id, name FROM companies WHERE id = ?', [companyId]);
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    let updateSql = '';
    const params = [];

    switch (action) {
      case 'SHORTLIST':
        updateSql = "status = 'SHORTLISTED', eligibility_status = 'ELIGIBLE'";
        break;
      case 'ADVANCE_ROUND':
        updateSql = "status = 'IN_PROCESS', current_round_number = current_round_number + 1";
        break;
      case 'SET_ROUND':
        updateSql = 'current_round_number = ?';
        params.push(parseInt(target_round, 10) || 1);
        break;
      case 'MARK_ELIGIBLE':
        updateSql = "eligibility_status = 'ELIGIBLE'";
        break;
      case 'MARK_INELIGIBLE':
        updateSql = "eligibility_status = 'INELIGIBLE', ineligibility_reason = COALESCE(?, ineligibility_reason)";
        params.push(remarks || 'Eligibility criteria unverified');
        break;
      case 'SELECT':
        updateSql = "final_result = 'SELECTED', status = 'ACCEPTED'";
        break;
      case 'WAITLIST':
        updateSql = "final_result = 'WAITLISTED', status = 'IN_PROCESS'";
        break;
      case 'REJECT':
        updateSql = "final_result = 'REJECTED', status = 'REJECTED'";
        break;
      default:
        return res.status(400).json({ success: false, message: `Unknown bulk action '${action}'.` });
    }

    const placeholders = application_ids.map(() => '?').join(',');
    await queryCommon(
      `UPDATE job_applications 
       SET ${updateSql} 
       WHERE id IN (${placeholders})`,
      [...params, ...application_ids]
    );

    // Notify affected students
    try {
      await queryCommon(
        `INSERT INTO notifications (title, message, target_role, priority, category, created_by)
         VALUES (?, ?, 'STUDENT', 'HIGH', 'DRIVE_ALERT', ?)`,
        [
          `${comp.name} Drive Status Updated`,
          `Your applicant record for ${comp.name} recruitment drive has been updated (${action.replace('_', ' ')}). Check My Applications for details.`,
          req.user.id,
        ]
      );
    } catch (e) {}

    await logAuditEvent({
      userId: req.user.id,
      action: 'BULK_UPDATE_APPLICANTS',
      module: 'COMPANY_MANAGEMENT',
      details: { companyId, action, count: application_ids.length, application_ids },
    });

    res.json({
      success: true,
      message: `Bulk update '${action}' successfully applied to ${application_ids.length} candidates.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Student applies / registers directly for a company's placement drive with full eligibility validation
 */
async function applyCompanyDrive(req, res, next) {
  try {
    const companyId = req.params.id;
    const user = req.user;

    if (!user.student_id) {
      return res.status(403).json({ success: false, message: 'Only registered students can apply for placement drives.' });
    }

    // Verify company
    const [comp] = await queryCommon(
      `SELECT c.*, j.id AS job_id, j.max_backlogs, pd.id AS drive_id
       FROM companies c
       LEFT JOIN jobs j ON j.company_id = c.id
       LEFT JOIN placement_drives pd ON pd.job_id = j.id
       WHERE c.id = ?`,
      [companyId]
    );

    if (!comp) {
      return res.status(404).json({ success: false, message: 'Placement company not found.' });
    }

    // Fetch student's live academic profile
    const [student] = await queryCommon(
      `SELECT sm.*, u.first_name, u.last_name, u.email 
       FROM students_master sm
       JOIN users u ON u.id = sm.user_id
       WHERE sm.id = ?`,
      [user.student_id]
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student academic master record not found.' });
    }

    // Parse eligible departments
    let eligibleDepts = [];
    try {
      eligibleDepts = Array.isArray(comp.eligible_departments)
        ? comp.eligible_departments
        : JSON.parse(comp.eligible_departments);
    } catch (e) {
      eligibleDepts = comp.eligible_departments ? comp.eligible_departments.split(',').map((d) => d.trim()) : [];
    }

    // Comprehensive Eligibility Validation Rules
    const reasons = [];

    // 1. Department Rule
    if (eligibleDepts.length > 0 && !eligibleDepts.includes(student.department_code)) {
      reasons.push(`Department ${student.department_code} is not eligible for ${comp.name} (Eligible: ${eligibleDepts.join(', ')}).`);
    }

    // 2. Academic Year / Cohort Rule
    const compYear = comp.academic_year || '2026-2027';
    if (compYear !== 'ALL' && student.academic_year && compYear !== student.academic_year) {
      reasons.push(`Your Academic Batch (${student.academic_year}) does not match the company target cohort (${compYear}).`);
    }

    // 3. Minimum CGPA Rule
    if (parseFloat(student.cgpa || 0) < parseFloat(comp.min_cgpa || 0)) {
      reasons.push(`Minimum CGPA cutoff is ${comp.min_cgpa}. Your recorded CGPA is ${student.cgpa}.`);
    }

    // 4. Maximum Active Backlogs Rule
    const allowedBacklogs = comp.max_backlogs !== null && comp.max_backlogs !== undefined ? parseInt(comp.max_backlogs, 10) : 0;
    if (parseInt(student.active_backlogs || 0, 10) > allowedBacklogs) {
      reasons.push(`Active backlogs (${student.active_backlogs}) exceed the maximum allowable limit (${allowedBacklogs}).`);
    }

    // 5. Application Deadline Rule
    if (comp.application_deadline) {
      const deadline = new Date(comp.application_deadline);
      if (new Date() > deadline) {
        reasons.push(`Application deadline has expired (${comp.application_deadline}).`);
      }
    }

    if (reasons.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Eligibility criteria not met for ${comp.name}.`,
        ineligibilityReasons: reasons,
      });
    }

    // Ensure corresponding job and drive exist
    let jobId = comp.job_id;
    let driveId = comp.drive_id;

    if (!jobId) {
      const jobUuid = uuidv4();
      await queryCommon(
        `INSERT INTO jobs (uuid, company_id, title, role_type, job_description, ctc_lpa, deadline_date, status)
         VALUES (?, ?, ?, 'FULL_TIME', ?, ?, '2026-12-31 23:59:59', 'PUBLISHED')`,
        [jobUuid, companyId, `${comp.name} Campus Drive`, comp.description || 'Full-time campus drive', comp.package_ctc || 10.0]
      );
      const [newJob] = await queryCommon('SELECT id FROM jobs WHERE uuid = ?', [jobUuid]);
      jobId = newJob.id;
    }

    if (!driveId) {
      const driveUuid = uuidv4();
      await queryCommon(
        `INSERT INTO placement_drives (uuid, job_id, drive_title, drive_type, drive_date, venue, current_stage, total_rounds, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Registration Stage', 4, 'UPCOMING')`,
        [driveUuid, jobId, `${comp.name} Campus Drive 2026-27`, comp.drive_mode || 'ON_CAMPUS', comp.drive_date || '2026-11-25', comp.drive_venue || 'Main Campus Placement Block']
      );
      const [newDrive] = await queryCommon('SELECT id FROM placement_drives WHERE uuid = ?', [driveUuid]);
      driveId = newDrive.id;
    }

    // Check existing application
    const existing = await queryCommon(
      'SELECT id, status FROM job_applications WHERE job_id = ? AND student_id = ?',
      [jobId, user.student_id]
    );

    if (existing.length > 0) {
      const ex = existing[0];
      if (ex.status === 'WITHDRAWN') {
        // Re-apply if previously withdrawn
        await queryCommon(
          `UPDATE job_applications 
           SET status = 'APPLIED', eligibility_status = 'ELIGIBLE', applied_at = CURRENT_TIMESTAMP, drive_id = ?
           WHERE id = ?`,
          [driveId, ex.id]
        );

        return res.json({
          success: true,
          applicationId: ex.id,
          appliedAt: new Date().toISOString(),
          message: `Application reactivated successfully for ${comp.name}!`,
        });
      }

      return res.status(400).json({
        success: false,
        message: `You have already applied for ${comp.name}. Current status: ${ex.status}`,
      });
    }

    // Insert new application
    const insertRes = await queryCommon(
      `INSERT INTO job_applications (job_id, drive_id, student_id, register_number, department_code, current_round_number, status, eligibility_status)
       VALUES (?, ?, ?, ?, ?, 1, 'APPLIED', 'ELIGIBLE')`,
      [jobId, driveId, user.student_id, student.register_number, student.department_code]
    );

    const applicationId = insertRes.insertId;

    // Dispatch confirmation notification to student
    try {
      await queryCommon(
        `INSERT INTO notifications (title, message, target_role, target_dept, priority, category, created_by)
         VALUES (?, ?, 'STUDENT', ?, 'MEDIUM', 'DRIVE_ALERT', ?)`,
        [
          `Application Submitted: ${comp.name}`,
          `Your application (ID: #APP-${applicationId}) for ${comp.name} has been received. Your profile has cleared initial eligibility verification.`,
          student.department_code,
          user.id,
        ]
      );
    } catch (e) {}

    await logAuditEvent({
      userId: user.id,
      action: 'STUDENT_APPLIED_DRIVE',
      module: 'APPLICATIONS',
      details: { companyId, companyName: comp.name, studentId: user.student_id, applicationId },
      departmentCode: student.department_code,
      registerNumber: student.register_number,
    });

    res.status(201).json({
      success: true,
      applicationId,
      appliedAt: new Date().toISOString(),
      message: `Application submitted successfully for ${comp.name}! Application Reference: #APP-${applicationId}.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Student withdraws their application before deadline
 */
async function withdrawCompanyApplication(req, res, next) {
  try {
    const companyId = req.params.id;
    const user = req.user;

    if (!user.student_id) {
      return res.status(403).json({ success: false, message: 'Only registered students can withdraw applications.' });
    }

    const [app] = await queryCommon(
      `SELECT ja.id, ja.status, c.name AS company_name, c.application_deadline
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       JOIN companies c ON c.id = j.company_id
       WHERE j.company_id = ? AND ja.student_id = ?`,
      [companyId, user.student_id]
    );

    if (!app) {
      return res.status(404).json({ success: false, message: 'No active application found for this company.' });
    }

    if (app.status === 'WITHDRAWN') {
      return res.status(400).json({ success: false, message: 'Application is already withdrawn.' });
    }

    if (['ACCEPTED', 'REJECTED'].includes(app.status)) {
      return res.status(400).json({ success: false, message: `Cannot withdraw application once ${app.status.toLowerCase()}.` });
    }

    // Check application deadline
    if (app.application_deadline) {
      const deadline = new Date(app.application_deadline);
      if (new Date() > deadline) {
        return res.status(400).json({ success: false, message: 'Withdrawals are not permitted after the application deadline.' });
      }
    }

    await queryCommon(`UPDATE job_applications SET status = 'WITHDRAWN', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [app.id]);

    await logAuditEvent({
      userId: user.id,
      action: 'WITHDRAW_APPLICATION',
      module: 'APPLICATIONS',
      details: { companyId, applicationId: app.id, companyName: app.company_name },
    });

    res.json({
      success: true,
      message: `Your application for ${app.company_name} has been withdrawn successfully.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get drive announcements
 */
async function getCompanyAnnouncements(req, res, next) {
  try {
    const companyId = req.params.id;
    const announcements = await queryCommon(
      `SELECT da.*, u.first_name, u.last_name, u.email
       FROM drive_announcements da
       LEFT JOIN users u ON u.id = da.published_by
       WHERE da.company_id = ?
       ORDER BY da.created_at DESC`,
      [companyId]
    );

    res.json({ success: true, data: announcements });
  } catch (err) {
    next(err);
  }
}

/**
 * Publish an announcement to all applicants of a company's placement drive
 */
async function createCompanyAnnouncement(req, res, next) {
  try {
    const companyId = req.params.id;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const [comp] = await queryCommon(
      `SELECT c.id, c.name, pd.id AS drive_id 
       FROM companies c 
       LEFT JOIN jobs j ON j.company_id = c.id 
       LEFT JOIN placement_drives pd ON pd.job_id = j.id 
       WHERE c.id = ?`,
      [companyId]
    );

    if (!comp) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const insertRes = await queryCommon(
      `INSERT INTO drive_announcements (company_id, drive_id, title, content, published_by)
       VALUES (?, ?, ?, ?, ?)`,
      [companyId, comp.drive_id || null, title, content, req.user.id]
    );

    // Notify registered students
    try {
      await queryCommon(
        `INSERT INTO notifications (title, message, target_role, priority, category, created_by)
         VALUES (?, ?, 'STUDENT', 'HIGH', 'ANNOUNCEMENT', ?)`,
        [`${comp.name} Announcement: ${title}`, content, req.user.id]
      );
    } catch (e) {}

    await logAuditEvent({
      userId: req.user.id,
      action: 'PUBLISH_DRIVE_ANNOUNCEMENT',
      module: 'COMPANY_MANAGEMENT',
      details: { companyId, title },
    });

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully to registered candidates.',
      announcementId: insertRes.insertId,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update drive round schedule and status
 */
async function updateDriveRound(req, res, next) {
  try {
    const { id: companyId, roundId } = req.params;
    const { round_name, scheduled_at, venue_or_link, status } = req.body;

    let formattedDate = scheduled_at ? String(scheduled_at).replace('T', ' ') : null;
    if (formattedDate && formattedDate.length === 16) formattedDate += ':00';

    await queryCommon(
      `UPDATE drive_rounds 
       SET round_name = COALESCE(?, round_name),
           scheduled_at = COALESCE(?, scheduled_at),
           venue_or_link = COALESCE(?, venue_or_link),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [round_name || null, formattedDate || null, venue_or_link || null, status || null, roundId]
    );

    res.json({ success: true, message: 'Selection round updated successfully.' });
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
    const roundsList = Array.isArray(selection_rounds) && selection_rounds.length > 0
      ? selection_rounds
      : ['Resume Screening & Eligibility Shortlist', 'Online Coding & Aptitude Assessment', 'Technical System Design Interview', 'Leadership & HR Discussion'];
    const roundsJson = JSON.stringify(roundsList);

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
          selection_stage || 'Registration Stage',
          roundsList.length,
        ]
      );

      const [driveRow] = await queryCommon(`SELECT id FROM placement_drives WHERE uuid = ?`, [driveUuid]);
      if (driveRow) {
        for (let i = 0; i < roundsList.length; i++) {
          await queryCommon(
            `INSERT INTO drive_rounds (drive_id, round_number, round_name, round_type, status)
             VALUES (?, ?, ?, 'TECH_INTERVIEW', 'PENDING')`,
            [driveRow.id, i + 1, roundsList[i]]
          );
        }
      }
    }

    await logAuditEvent({
      userId: req.user.id,
      action: 'CREATE_COMPANY',
      module: 'COMPANY_MANAGEMENT',
      details: {
        companyName: trimmedName,
        tier,
        academic_year,
        eligible_departments,
        eligible_student_count,
      },
    });

    res.status(201).json({
      success: true,
      message: `Placement company '${trimmedName}' registered successfully with eligible departments and student quota.`,
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
  withdrawCompanyApplication,
  getCompanyApplicants,
  updateCompanyApplicant,
  bulkUpdateCompanyApplicants,
  getCompanyAnnouncements,
  createCompanyAnnouncement,
  updateDriveRound,
  getMetadata,
};
