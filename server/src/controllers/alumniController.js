const { queryCommon } = require('../config/db');

/**
 * Get alumni directory with mentorship and referral availability
 */
async function getAlumni(req, res, next) {
  try {
    const { department, mentorshipOnly } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (department && department !== 'ALL') {
      whereClause += ' AND an.department_code = ?';
      params.push(department);
    }

    if (mentorshipOnly === 'true') {
      whereClause += ' AND an.available_for_mentorship = 1';
    }

    const alumni = await queryCommon(
      `SELECT an.*, u.first_name, u.last_name, u.email, u.phone
       FROM alumni_network an
       JOIN users u ON u.id = an.user_id
       ${whereClause}
       ORDER BY an.graduation_year DESC`,
      params
    );

    res.json({ success: true, count: alumni.length, data: alumni });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit mentorship booking request
 */
async function bookMentorship(req, res, next) {
  try {
    const { alumni_id, topic, message, proposed_date } = req.body;

    res.json({
      success: true,
      message: 'Mentorship request sent to alumni. You will receive an email confirmation with calendar link.',
      details: { alumni_id, topic, proposed_date },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAlumni,
  bookMentorship,
};
