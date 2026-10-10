const { queryCommon, queryDept } = require('../config/db');

/**
 * Check student eligibility for a specific job opportunity
 * Evaluates academic thresholds, department permissions, and coordinator waivers.
 */
async function checkStudentEligibility(studentId, jobId) {
  // Fetch student details from common database
  const students = await queryCommon(
    `SELECT sm.*, u.email, u.first_name, u.last_name
     FROM students_master sm
     JOIN users u ON u.id = sm.user_id
     WHERE sm.id = ?`,
    [studentId]
  );

  if (students.length === 0) {
    return { eligible: false, reasons: ['Student profile not found.'] };
  }
  const student = students[0];

  // Fetch job details
  const jobs = await queryCommon(
    `SELECT j.*, c.name AS company_name, c.tier AS company_tier
     FROM jobs j
     JOIN companies c ON c.id = j.company_id
     WHERE j.id = ?`,
    [jobId]
  );

  if (jobs.length === 0) {
    return { eligible: false, reasons: ['Job posting not found.'] };
  }
  const job = jobs[0];

  const reasons = [];
  const warnings = [];
  let hasWaiver = false;

  // Check Department Coordinator Overrides in Department DB
  try {
    const overrides = await queryDept(
      student.department_code,
      `SELECT * FROM dept_eligibility_overrides 
       WHERE register_number = ? AND job_id = ?`,
      [student.register_number, jobId]
    );

    if (overrides.length > 0) {
      hasWaiver = true;
      warnings.push(`Department Exception Granted: ${overrides[0].override_type} by ${overrides[0].approved_by} (${overrides[0].reason})`);
    }
  } catch (err) {
    console.warn('[Eligibility Engine] Dept override lookup warning:', err.message);
  }

  // 1. Minimum CGPA
  if (parseFloat(student.cgpa) < parseFloat(job.min_cgpa)) {
    if (!hasWaiver) {
      reasons.push(`CGPA is ${student.cgpa}, which is below the required ${job.min_cgpa}.`);
    }
  }

  // 2. Active Backlogs
  if (parseInt(student.active_backlogs, 10) > parseInt(job.max_backlogs, 10)) {
    if (!hasWaiver) {
      reasons.push(`Student has ${student.active_backlogs} active backlog(s); company allows max ${job.max_backlogs}.`);
    }
  }

  // 3. Department Whitelist
  if (job.eligibility_criteria) {
    let criteria = job.eligibility_criteria;
    if (typeof criteria === 'string') {
      try { criteria = JSON.parse(criteria); } catch (e) {}
    }

    if (criteria.allowed_departments && Array.isArray(criteria.allowed_departments)) {
      if (!criteria.allowed_departments.includes(student.department_code)) {
        reasons.push(`Department ${student.department_code} is not eligible for this role. Allowed: ${criteria.allowed_departments.join(', ')}.`);
      }
    }

    // 10th / 12th percentage
    if (criteria.min_tenth && parseFloat(student.tenth_percentage) < parseFloat(criteria.min_tenth)) {
      reasons.push(`10th standard percentage (${student.tenth_percentage}%) is below required ${criteria.min_tenth}%.`);
    }
    if (criteria.min_twelfth && parseFloat(student.twelfth_percentage) < parseFloat(criteria.min_twelfth)) {
      reasons.push(`12th standard percentage (${student.twelfth_percentage}%) is below required ${criteria.min_twelfth}%.`);
    }
  }

  // 4. Institutional Placement Policy (Max offers allowed)
  const offers = await queryCommon(
    `SELECT COUNT(*) AS offer_count FROM placement_offers 
     WHERE student_id = ? AND status IN ('ACCEPTED', 'OFFERED')`,
    [studentId]
  );

  const activeOfferCount = offers[0].offer_count || 0;
  if (activeOfferCount >= 2 && job.ctc_lpa < 15.00) {
    reasons.push(`Institutional policy limit reached: You already hold ${activeOfferCount} offer(s). Only Dream roles (>= 15 LPA) permitted.`);
  }

  return {
    eligible: reasons.length === 0,
    studentRegisterNumber: student.register_number,
    studentName: `${student.first_name} ${student.last_name}`,
    reasons,
    warnings,
    hasCoordinatorWaiver: hasWaiver,
  };
}

module.exports = {
  checkStudentEligibility,
};
