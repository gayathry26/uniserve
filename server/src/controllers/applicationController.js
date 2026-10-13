const { queryCommon } = require('../config/db');
const { checkStudentEligibility } = require('../services/eligibilityEngine');
const { logAuditEvent } = require('../services/auditService');

/**
 * Submit application for a job opportunity (with strict backend eligibility verification)
 */
async function applyToJob(req, res, next) {
  try {
    const { job_id, resume_url } = req.body;
    const studentId = req.user.student_id;

    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Only registered student accounts can apply.' });
    }

    if (!job_id) {
      return res.status(400).json({ success: false, message: 'job_id is required.' });
    }

    // 1. Check if already applied
    const existing = await queryCommon(
      `SELECT id, status FROM job_applications WHERE job_id = ? AND student_id = ?`,
      [job_id, studentId]
    );

    if (existing.length > 0) {
      const ex = existing[0];
      if (ex.status === 'WITHDRAWN') {
        await queryCommon(
          `UPDATE job_applications SET status = 'APPLIED', eligibility_status = 'ELIGIBLE', applied_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [ex.id]
        );
        return res.json({
          success: true,
          message: 'Job application reactivated successfully!',
          applicationId: ex.id,
        });
      }

      return res.status(400).json({
        success: false,
        message: `You have already applied for this job. Current status: ${ex.status}.`,
      });
    }

    // 2. Strict Eligibility Evaluation
    const evalRes = await checkStudentEligibility(studentId, job_id);
    if (!evalRes.eligible) {
      return res.status(400).json({
        success: false,
        message: 'Application rejected: You do not meet the eligibility requirements for this opportunity.',
        ineligibilityReasons: evalRes.reasons,
      });
    }

    // Link drive_id
    const [drive] = await queryCommon('SELECT id FROM placement_drives WHERE job_id = ? LIMIT 1', [job_id]);

    // 3. Insert Application
    const insertRes = await queryCommon(
      `INSERT INTO job_applications (job_id, drive_id, student_id, register_number, department_code, resume_version_url, current_round_number, status, eligibility_status)
       VALUES (?, ?, ?, ?, ?, ?, 1, 'APPLIED', 'ELIGIBLE')`,
      [job_id, drive ? drive.id : null, studentId, req.user.register_number, req.user.department_code, resume_url || null]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'SUBMIT_JOB_APPLICATION',
      module: 'APPLICATIONS',
      details: { jobId: job_id, studentId, applicationId: insertRes.insertId },
      departmentCode: req.user.department_code,
      registerNumber: req.user.register_number,
    });

    res.status(201).json({
      success: true,
      message: 'Job application submitted successfully!',
      applicationId: insertRes.insertId,
      appliedAt: new Date().toISOString(),
      warnings: evalRes.warnings,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get applications with multi-role filters
 */
async function getApplications(req, res, next) {
  try {
    const { jobId, status, department, driveId } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (req.user.role_name === 'STUDENT') {
      whereClause += ' AND ja.student_id = ?';
      params.push(req.user.student_id);
    } else if (req.user.role_name === 'FACULTY_COORDINATOR') {
      whereClause += ' AND ja.department_code = ?';
      params.push(req.user.department_code);
    } else if (req.user.role_name === 'RECRUITER') {
      whereClause += ' AND j.company_id IN (SELECT company_id FROM company_recruiters WHERE user_id = ?)';
      params.push(req.user.id);
    }

    if (jobId) {
      whereClause += ' AND ja.job_id = ?';
      params.push(jobId);
    }

    if (driveId) {
      whereClause += ' AND ja.drive_id = ?';
      params.push(driveId);
    }

    if (status && status !== 'ALL') {
      whereClause += ' AND ja.status = ?';
      params.push(status);
    }

    if (department && department !== 'ALL' && req.user.role_name !== 'FACULTY_COORDINATOR') {
      whereClause += ' AND ja.department_code = ?';
      params.push(department);
    }

    const applications = await queryCommon(
      `SELECT ja.*, 
              j.title AS job_title, j.ctc_lpa, j.locations, j.role_type,
              c.id AS company_id, c.name AS company_name, c.tier AS company_tier, c.logo_url, c.industry,
              pd.id AS drive_id, pd.drive_title, pd.drive_type, pd.drive_date, pd.venue AS drive_venue, pd.current_stage AS drive_stage,
              dr.round_name AS current_round_name,
              sm.cgpa, sm.active_backlogs, sm.skills, sm.batch, sm.academic_year,
              u.first_name, u.last_name, u.email, u.phone
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       JOIN companies c ON c.id = j.company_id
       LEFT JOIN placement_drives pd ON pd.job_id = j.id
       LEFT JOIN drive_rounds dr ON dr.drive_id = pd.id AND dr.round_number = ja.current_round_number
       JOIN students_master sm ON sm.id = ja.student_id
       JOIN users u ON u.id = sm.user_id
       ${whereClause}
       ORDER BY ja.applied_at DESC`,
      params
    );

    // If student, enrich with each drive's configurable selection rounds
    if (req.user.role_name === 'STUDENT' && applications.length > 0) {
      const driveIds = [...new Set(applications.map((a) => a.drive_id).filter(Boolean))];
      let roundsMap = {};
      if (driveIds.length > 0) {
        const roundsRows = await queryCommon(
          `SELECT * FROM drive_rounds WHERE drive_id IN (${driveIds.join(',')}) ORDER BY round_number ASC`
        );
        for (const r of roundsRows) {
          if (!roundsMap[r.drive_id]) roundsMap[r.drive_id] = [];
          roundsMap[r.drive_id].push(r);
        }
      }

      for (const app of applications) {
        app.selection_rounds = roundsMap[app.drive_id] || [];
      }
    }

    res.json({ success: true, count: applications.length, data: applications });
  } catch (err) {
    next(err);
  }
}

/**
 * Dedicated endpoint for Student's "My Applications" tracking dashboard
 */
async function getMyApplications(req, res, next) {
  try {
    const studentId = req.user.student_id;
    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Only registered students have applications to track.' });
    }

    const applications = await queryCommon(
      `SELECT ja.*, 
              j.title AS job_title, j.ctc_lpa, j.locations, j.role_type,
              c.id AS company_id, c.name AS company_name, c.tier AS company_tier, c.logo_url, c.industry,
              c.drive_date, c.drive_venue, c.drive_mode, c.application_deadline,
              pd.id AS drive_id, pd.drive_title, pd.drive_type, pd.current_stage AS drive_stage,
              dr.round_name AS current_round_name,
              sm.register_number, sm.department_code, sm.cgpa
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       JOIN companies c ON c.id = j.company_id
       LEFT JOIN placement_drives pd ON pd.job_id = j.id
       LEFT JOIN drive_rounds dr ON dr.drive_id = pd.id AND dr.round_number = ja.current_round_number
       JOIN students_master sm ON sm.id = ja.student_id
       WHERE ja.student_id = ?
       ORDER BY ja.applied_at DESC`,
      [studentId]
    );

    // Fetch selection rounds and announcements for each application
    const driveIds = [...new Set(applications.map((a) => a.drive_id).filter(Boolean))];
    const companyIds = [...new Set(applications.map((a) => a.company_id).filter(Boolean))];

    let roundsMap = {};
    if (driveIds.length > 0) {
      const roundsRows = await queryCommon(
        `SELECT * FROM drive_rounds WHERE drive_id IN (${driveIds.join(',')}) ORDER BY round_number ASC`
      );
      for (const r of roundsRows) {
        if (!roundsMap[r.drive_id]) roundsMap[r.drive_id] = [];
        roundsMap[r.drive_id].push(r);
      }
    }

    let announcementsMap = {};
    if (companyIds.length > 0) {
      const annRows = await queryCommon(
        `SELECT da.*, u.first_name, u.last_name 
         FROM drive_announcements da
         LEFT JOIN users u ON u.id = da.published_by
         WHERE da.company_id IN (${companyIds.join(',')})
         ORDER BY da.created_at DESC`
      );
      for (const ann of annRows) {
        if (!announcementsMap[ann.company_id]) announcementsMap[ann.company_id] = [];
        announcementsMap[ann.company_id].push(ann);
      }
    }

    const enriched = applications.map((app) => ({
      ...app,
      selection_rounds: roundsMap[app.drive_id] || [],
      announcements: announcementsMap[app.company_id] || [],
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    next(err);
  }
}

/**
 * Student withdraws an application
 */
async function withdrawApplication(req, res, next) {
  try {
    const applicationId = req.params.id;
    const studentId = req.user.student_id;

    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Only students can withdraw applications.' });
    }

    const [app] = await queryCommon(
      `SELECT ja.*, c.name AS company_name, c.application_deadline
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       JOIN companies c ON c.id = j.company_id
       WHERE ja.id = ? AND ja.student_id = ?`,
      [applicationId, studentId]
    );

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (app.status === 'WITHDRAWN') {
      return res.status(400).json({ success: false, message: 'Application is already withdrawn.' });
    }

    if (['ACCEPTED', 'REJECTED'].includes(app.status)) {
      return res.status(400).json({ success: false, message: `Cannot withdraw once application is ${app.status.toLowerCase()}.` });
    }

    if (app.application_deadline && new Date() > new Date(app.application_deadline)) {
      return res.status(400).json({ success: false, message: 'Cannot withdraw after the application deadline has passed.' });
    }

    await queryCommon(`UPDATE job_applications SET status = 'WITHDRAWN', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [applicationId]);

    await logAuditEvent({
      userId: req.user.id,
      action: 'WITHDRAW_APPLICATION',
      module: 'APPLICATIONS',
      details: { applicationId, companyName: app.company_name },
    });

    res.json({ success: true, message: `Application for ${app.company_name} has been withdrawn.` });
  } catch (err) {
    next(err);
  }
}

/**
 * Update application status / round progression (e.g. SHORTLISTED, REJECTED, OFFERED)
 */
async function updateApplicationStatus(req, res, next) {
  try {
    const applicationId = req.params.id;
    const {
      status,
      current_round_number,
      eligibility_status,
      ineligibility_reason,
      final_result,
      interview_scheduled_at,
      interview_venue_or_link,
      feedback,
    } = req.body;

    const validStatuses = ['APPLIED', 'SHORTLISTED', 'IN_PROCESS', 'REJECTED', 'OFFERED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status '${status}'.` });
    }

    const updates = [];
    const params = [];

    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (current_round_number !== undefined) { updates.push('current_round_number = ?'); params.push(parseInt(current_round_number, 10)); }
    if (eligibility_status !== undefined) { updates.push('eligibility_status = ?'); params.push(eligibility_status); }
    if (ineligibility_reason !== undefined) { updates.push('ineligibility_reason = ?'); params.push(ineligibility_reason); }
    if (final_result !== undefined) { updates.push('final_result = ?'); params.push(final_result); }
    if (interview_scheduled_at !== undefined) {
      let formatted = interview_scheduled_at ? String(interview_scheduled_at).replace('T', ' ') : null;
      if (formatted && formatted.length === 16) formatted += ':00';
      updates.push('interview_scheduled_at = ?');
      params.push(formatted);
    }
    if (interview_venue_or_link !== undefined) { updates.push('interview_venue_or_link = ?'); params.push(interview_venue_or_link); }
    if (feedback !== undefined) { updates.push('feedback = ?'); params.push(feedback); }

    if (updates.length > 0) {
      params.push(applicationId);
      await queryCommon(`UPDATE job_applications SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_APPLICATION_STATUS',
      module: 'APPLICATIONS',
      details: { applicationId, newStatus: status, round: current_round_number, finalResult: final_result },
    });

    res.json({ success: true, message: `Candidate application updated successfully.` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  applyToJob,
  getApplications,
  getMyApplications,
  withdrawApplication,
  updateApplicationStatus,
};
