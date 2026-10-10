const { v4: uuidv4 } = require('uuid');
const { queryCommon } = require('../config/db');
const { checkStudentEligibility } = require('../services/eligibilityEngine');
const { logAuditEvent } = require('../services/auditService');

/**
 * List jobs with role-based visibility and student eligibility flags
 */
async function getAllJobs(req, res, next) {
  try {
    const { roleType, search, minCtc } = req.query;
    let whereClause = "WHERE j.status = 'PUBLISHED'";
    const params = [];

    // TPO and Admins can see all statuses (draft, closed, under review)
    if (['TPO_OFFICER', 'ADMIN', 'MANAGEMENT'].includes(req.user.role_name)) {
      whereClause = 'WHERE 1=1';
    } else if (req.user.role_name === 'RECRUITER') {
      // Recruiter sees their company's jobs
      whereClause = `WHERE j.company_id IN (SELECT company_id FROM company_recruiters WHERE user_id = ?)`;
      params.push(req.user.id);
    }

    if (roleType && roleType !== 'ALL') {
      whereClause += ' AND j.role_type = ?';
      params.push(roleType);
    }

    if (minCtc) {
      whereClause += ' AND j.ctc_lpa >= ?';
      params.push(parseFloat(minCtc));
    }

    if (search) {
      whereClause += ' AND (j.title LIKE ? OR c.name LIKE ? OR j.locations LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const jobs = await queryCommon(
      `SELECT j.*, c.name AS company_name, c.tier AS company_tier, c.logo_url AS company_logo,
              (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) AS total_applications
       FROM jobs j
       JOIN companies c ON c.id = j.company_id
       ${whereClause}
       ORDER BY j.created_at DESC`,
      params
    );

    // If requester is a student, attach their personalized eligibility check!
    if (req.user.role_name === 'STUDENT' && req.user.student_id) {
      const studentId = req.user.student_id;
      const enrichedJobs = await Promise.all(
        jobs.map(async (job) => {
          const evalRes = await checkStudentEligibility(studentId, job.id);
          // Check if student already applied
          const [appRows] = await queryCommon(
            `SELECT id, status, applied_at FROM job_applications WHERE job_id = ? AND student_id = ?`,
            [job.id, studentId]
          );

          return {
            ...job,
            eligibility: evalRes,
            applicationStatus: appRows.length > 0 ? appRows[0].status : null,
            appliedAt: appRows.length > 0 ? appRows[0].applied_at : null,
          };
        })
      );
      return res.json({ success: true, count: enrichedJobs.length, data: enrichedJobs });
    }

    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    next(err);
  }
}

/**
 * Get job details by ID with eligibility check for students
 */
async function getJobById(req, res, next) {
  try {
    const jobId = req.params.id;
    const jobs = await queryCommon(
      `SELECT j.*, c.name AS company_name, c.tier AS company_tier, c.website, c.description AS company_desc
       FROM jobs j
       JOIN companies c ON c.id = j.company_id
       WHERE j.id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Job opportunity not found.' });
    }

    const job = jobs[0];
    let eligibility = null;
    let application = null;

    if (req.user.role_name === 'STUDENT' && req.user.student_id) {
      eligibility = await checkStudentEligibility(req.user.student_id, jobId);
      const [appRows] = await queryCommon(
        `SELECT * FROM job_applications WHERE job_id = ? AND student_id = ?`,
        [jobId, req.user.student_id]
      );
      if (appRows.length > 0) application = appRows[0];
    }

    res.json({
      success: true,
      data: job,
      eligibility,
      application,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new job opportunity
 */
async function createJob(req, res, next) {
  try {
    const { company_id, title, role_type, job_description, min_cgpa, max_backlogs, ctc_lpa, stipend_monthly, locations, vacancies, deadline_date, allowed_departments } = req.body;

    if (!company_id || !title || !ctc_lpa || !deadline_date) {
      return res.status(400).json({ success: false, message: 'Missing required job parameters (company, title, CTC, deadline).' });
    }

    const criteriaObj = {
      allowed_departments: allowed_departments || ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'],
      min_tenth: 60,
      min_twelfth: 60,
    };

    const jobUuid = uuidv4();
    await queryCommon(
      `INSERT INTO jobs (uuid, company_id, title, role_type, job_description, eligibility_criteria, min_cgpa, max_backlogs, ctc_lpa, stipend_monthly, locations, vacancies, deadline_date, status, approved_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?)`,
      [
        jobUuid,
        company_id,
        title,
        role_type || 'FULL_TIME',
        job_description || title,
        JSON.stringify(criteriaObj),
        min_cgpa || 6.00,
        max_backlogs || 0,
        ctc_lpa,
        stipend_monthly || 0.00,
        locations || 'Pan-India',
        vacancies || 5,
        deadline_date,
        req.user.id,
      ]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'CREATE_JOB',
      module: 'JOB_MANAGEMENT',
      details: { title, ctc: ctc_lpa },
    });

    res.status(201).json({ success: true, message: `Job '${title}' published successfully.` });
  } catch (err) {
    next(err);
  }
}

/**
 * Update job status (e.g. CLOSED, PUBLISHED)
 */
async function updateJobStatus(req, res, next) {
  try {
    const jobId = req.params.id;
    const { status } = req.body;

    await queryCommon(
      `UPDATE jobs SET status = ? WHERE id = ?`,
      [status, jobId]
    );

    res.json({ success: true, message: `Job status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJobStatus,
};
