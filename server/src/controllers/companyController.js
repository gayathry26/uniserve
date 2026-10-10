const { v4: uuidv4 } = require('uuid');
const { queryCommon } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * List companies with search, tier, and status filtering
 */
async function getAllCompanies(req, res, next) {
  try {
    const { tier, status, search } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (tier && tier !== 'ALL') {
      whereClause += ' AND tier = ?';
      params.push(tier);
    }

    if (status && status !== 'ALL') {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += ' AND (name LIKE ? OR industry LIKE ? OR headquarters LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const companies = await queryCommon(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM jobs WHERE company_id = c.id) AS active_jobs_count
       FROM companies c
       ${whereClause}
       ORDER BY c.tier = 'SUPER_DREAM' DESC, c.tier = 'DREAM' DESC, c.name ASC`,
      params
    );

    res.json({ success: true, count: companies.length, data: companies });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new company profile
 */
async function createCompany(req, res, next) {
  try {
    const { name, industry, website, headquarters, contact_email, contact_phone, tier, description } = req.body;

    if (!name || !industry) {
      return res.status(400).json({ success: false, message: 'Company name and industry are required.' });
    }

    const companyUuid = uuidv4();
    await queryCommon(
      `INSERT INTO companies (uuid, name, industry, website, headquarters, contact_email, contact_phone, tier, status, description, verified_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
      [companyUuid, name, industry, website || null, headquarters || null, contact_email || null, contact_phone || null, tier || 'REGULAR', description || null, req.user.id]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'CREATE_COMPANY',
      module: 'COMPANY_MANAGEMENT',
      details: { companyName: name, tier },
    });

    res.status(201).json({ success: true, message: `Company '${name}' registered successfully.` });
  } catch (err) {
    next(err);
  }
}

/**
 * Update company tier / status
 */
async function updateCompany(req, res, next) {
  try {
    const companyId = req.params.id;
    const { tier, status, description, rating } = req.body;

    await queryCommon(
      `UPDATE companies 
       SET tier = COALESCE(?, tier), status = COALESCE(?, status), description = COALESCE(?, description), rating = COALESCE(?, rating)
       WHERE id = ?`,
      [tier, status, description, rating, companyId]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'UPDATE_COMPANY',
      module: 'COMPANY_MANAGEMENT',
      details: { companyId, tier, status },
    });

    res.json({ success: true, message: 'Company details updated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllCompanies,
  createCompany,
  updateCompany,
};
