const { queryCommon, queryDept } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * Get active institutional placement policy
 */
async function getPolicies(req, res, next) {
  try {
    const policies = await queryCommon(
      `SELECT * FROM placement_policies ORDER BY created_at DESC`
    );

    res.json({ success: true, data: policies });
  } catch (err) {
    next(err);
  }
}

/**
 * Update institutional placement policy
 */
async function updatePolicy(req, res, next) {
  try {
    const policyId = req.params.id;
    const { max_offers_allowed, dream_offer_threshold_lpa, attendance_mandate_percent, rules_config } = req.body;

    await queryCommon(
      `UPDATE placement_policies 
       SET max_offers_allowed = COALESCE(?, max_offers_allowed),
           dream_offer_threshold_lpa = COALESCE(?, dream_offer_threshold_lpa),
           attendance_mandate_percent = COALESCE(?, attendance_mandate_percent),
           rules_config = COALESCE(?, rules_config)
       WHERE id = ?`,
      [max_offers_allowed, dream_offer_threshold_lpa, attendance_mandate_percent, rules_config ? JSON.stringify(rules_config) : null, policyId]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_POLICY',
      module: 'POLICY_ENGINE',
      details: { policyId, maxOffers: max_offers_allowed, dreamThreshold: dream_offer_threshold_lpa },
    });

    res.json({ success: true, message: 'Institutional placement policy updated.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Get department-specific eligibility overrides / exceptions
 */
async function getDeptOverrides(req, res, next) {
  try {
    const deptCode = req.params.departmentCode || req.user.department_code || 'CSE';
    const overrides = await queryDept(
      deptCode,
      `SELECT deo.*, j.title AS job_title, c.name AS company_name
       FROM dept_eligibility_overrides deo
       LEFT JOIN lms.jobs j ON j.id = deo.job_id
       LEFT JOIN lms.companies c ON c.id = j.company_id
       ORDER BY deo.approved_at DESC`
    );

    res.json({ success: true, departmentCode: deptCode, data: overrides });
  } catch (err) {
    next(err);
  }
}

/**
 * Grant coordinator exception / waiver into Department DB
 */
async function grantCoordinatorOverride(req, res, next) {
  try {
    const deptCode = req.user.department_code || 'CSE';
    const { register_number, job_id, override_type, reason } = req.body;

    if (!register_number || !job_id || !override_type || !reason) {
      return res.status(400).json({ success: false, message: 'Missing required override fields (reg_no, job_id, type, reason).' });
    }

    const approverName = `${req.user.first_name} ${req.user.last_name}`;

    await queryDept(
      deptCode,
      `INSERT INTO dept_eligibility_overrides (register_number, job_id, override_type, reason, approved_by)
       VALUES (?, ?, ?, ?, ?)`,
      [register_number, job_id, override_type, reason, approverName]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'GRANT_DEPT_OVERRIDE',
      module: 'POLICY_ENGINE',
      details: { registerNumber: register_number, jobId: job_id, type: override_type },
      departmentCode: deptCode,
      registerNumber: register_number,
    });

    res.status(201).json({
      success: true,
      message: `Exception override granted in ${deptCode} department database. Candidate is now marked eligible for this job drive.`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPolicies,
  updatePolicy,
  getDeptOverrides,
  grantCoordinatorOverride,
};
