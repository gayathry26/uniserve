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
      return res.status(400).json({
        success: false,
        message: `You have already applied for this job. Current status: ${existing[0].status}.`,
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

    // 3. Insert Application
    await queryCommon(
      `INSERT INTO job_applications (job_id, student_id, register_number, department_code, resume_version_url, current_round_number, status)
       VALUES (?, ?, ?, ?, ?, 1, 'APPLIED')`,
      [job_id, studentId, req.user.register_number, req.user.department_code, resume_url || null]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'SUBMIT_JOB_APPLICATION',
      module: 'APPLICATIONS',
      details: { jobId: job_id, studentId },
      departmentCode: req.user.department_code,
      registerNumber: req.user.register_number,
    });

    res.status(201).json({
      success: true,
      message: 'Job application submitted successfully!',
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
    const { jobId, status, department } = req.query;
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

    if (status && status !== 'ALL') {
      whereClause += ' AND ja.status = ?';
      params.push(status);
    }

    if (department && department !== 'ALL' && req.user.role_name !== 'FACULTY_COORDINATOR') {
      whereClause += ' AND ja.department_code = ?';
      params.push(department);
    }

    const applications = await queryCommon(
      `SELECT ja.*, j.title AS job_title, j.ctc_lpa, c.name AS company_name, c.tier AS company_tier,
              sm.cgpa, sm.active_backlogs, sm.skills, u.first_name, u.last_name, u.email, u.phone
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       JOIN companies c ON c.id = j.company_id
       JOIN students_master sm ON sm.id = ja.student_id
       JOIN users u ON u.id = sm.user_id
       ${whereClause}
       ORDER BY ja.applied_at DESC`,
      params
    );

    res.json({ success: true, count: applications.length, data: applications });
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
    const { status, current_round_number } = req.body;

    const validStatuses = ['APPLIED', 'SHORTLISTED', 'IN_PROCESS', 'REJECTED', 'OFFERED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status '${status}'.` });
    }

    await queryCommon(
      `UPDATE job_applications 
       SET status = COALESCE(?, status), current_round_number = COALESCE(?, current_round_number)
       WHERE id = ?`,
      [status, current_round_number, applicationId]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_APPLICATION_STATUS',
      module: 'APPLICATIONS',
      details: { applicationId, newStatus: status, round: current_round_number },
    });

    res.json({ success: true, message: `Candidate application status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  applyToJob,
  getApplications,
  updateApplicationStatus,
};
