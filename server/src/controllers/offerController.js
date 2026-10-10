const { queryCommon } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * Get all placement offers
 */
async function getAllOffers(req, res, next) {
  try {
    const { department, status } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (req.user.role_name === 'STUDENT') {
      whereClause += ' AND po.student_id = ?';
      params.push(req.user.student_id);
    } else if (req.user.role_name === 'FACULTY_COORDINATOR') {
      whereClause += ' AND po.department_code = ?';
      params.push(req.user.department_code);
    } else if (department && department !== 'ALL') {
      whereClause += ' AND po.department_code = ?';
      params.push(department);
    }

    if (status && status !== 'ALL') {
      whereClause += ' AND po.status = ?';
      params.push(status);
    }

    const offers = await queryCommon(
      `SELECT po.*, j.title AS job_title, c.name AS company_name, c.tier AS company_tier,
              u.first_name, u.last_name, u.email, sm.cgpa
       FROM placement_offers po
       JOIN jobs j ON j.id = po.job_id
       JOIN companies c ON c.id = j.company_id
       JOIN students_master sm ON sm.id = po.student_id
       JOIN users u ON u.id = sm.user_id
       ${whereClause}
       ORDER BY po.offered_ctc_lpa DESC`,
      params
    );

    res.json({ success: true, count: offers.length, data: offers });
  } catch (err) {
    next(err);
  }
}

/**
 * Issue new placement offer to candidate
 */
async function issueOffer(req, res, next) {
  try {
    const { application_id, offered_ctc_lpa, issue_date, joining_date, expiry_date, offer_letter_url } = req.body;

    const [app] = await queryCommon(
      `SELECT * FROM job_applications WHERE id = ?`,
      [application_id]
    );

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    await queryCommon(
      `INSERT INTO placement_offers (application_id, job_id, student_id, register_number, department_code, offered_ctc_lpa, issue_date, joining_date, expiry_date, offer_letter_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OFFERED')
       ON DUPLICATE KEY UPDATE offered_ctc_lpa = VALUES(offered_ctc_lpa), status = 'OFFERED'`,
      [
        application_id,
        app.job_id,
        app.student_id,
        app.register_number,
        app.department_code,
        offered_ctc_lpa,
        issue_date || new Date().toISOString().split('T')[0],
        joining_date || null,
        expiry_date || null,
        offer_letter_url || null,
      ]
    );

    // Update application status
    await queryCommon(`UPDATE job_applications SET status = 'OFFERED' WHERE id = ?`, [application_id]);

    // Update student placement status in master table
    await queryCommon(
      `UPDATE students_master SET placement_status = 'PLACED' WHERE id = ?`,
      [app.student_id]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'ISSUE_OFFER',
      module: 'OFFERS',
      details: { applicationId: application_id, ctc: offered_ctc_lpa },
      departmentCode: app.department_code,
      registerNumber: app.register_number,
    });

    res.status(201).json({ success: true, message: 'Offer letter issued successfully!' });
  } catch (err) {
    next(err);
  }
}

/**
 * Respond to offer (ACCEPT / DECLINE)
 */
async function respondToOffer(req, res, next) {
  try {
    const offerId = req.params.id;
    const { decision } = req.body; // 'ACCEPTED' or 'REJECTED'

    if (!['ACCEPTED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'ACCEPTED' or 'REJECTED'." });
    }

    const [offer] = await queryCommon(`SELECT * FROM placement_offers WHERE id = ?`, [offerId]);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer record not found.' });
    }

    if (req.user.role_name === 'STUDENT' && offer.student_id !== req.user.student_id) {
      return res.status(403).json({ success: false, message: 'You can only respond to your own offers.' });
    }

    await queryCommon(
      `UPDATE placement_offers SET status = ? WHERE id = ?`,
      [decision, offerId]
    );

    await queryCommon(
      `UPDATE job_applications SET status = ? WHERE id = ?`,
      [decision, offer.application_id]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: `OFFER_${decision}`,
      module: 'OFFERS',
      details: { offerId, decision },
      departmentCode: offer.department_code,
      registerNumber: offer.register_number,
    });

    res.json({ success: true, message: `Offer has been ${decision.toLowerCase()}.` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllOffers,
  issueOffer,
  respondToOffer,
};
