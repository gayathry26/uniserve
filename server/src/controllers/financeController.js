const { queryCommon } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * Get placement cell annual budget and expenditures
 */
async function getBudgetDetails(req, res, next) {
  try {
    const budget = await queryCommon(
      `SELECT * FROM placement_budget ORDER BY fiscal_year DESC`
    );

    res.json({ success: true, data: budget[0] || {} });
  } catch (err) {
    next(err);
  }
}

/**
 * Record an expense item
 */
async function recordExpense(req, res, next) {
  try {
    const { category, amount, description } = req.body;
    const colMap = {
      TRAINING: 'training_expense',
      LOGISTICS: 'logistics_expense',
      HOSPITALITY: 'hospitality_expense',
      SOFTWARE: 'software_license_expense',
    };

    const col = colMap[category] || 'training_expense';

    await queryCommon(
      `UPDATE placement_budget 
       SET ${col} = ${col} + ?, spent_amount = spent_amount + ?
       WHERE fiscal_year = '2026-2027'`,
      [parseFloat(amount), parseFloat(amount)]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'RECORD_EXPENSE',
      module: 'FINANCE',
      details: { category, amount, description },
    });

    res.json({ success: true, message: `Recorded expense of ₹${amount} under ${category}.` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBudgetDetails,
  recordExpense,
};
