const { queryCommon } = require('../config/db');

/**
 * List announcements and circulars filtered by target role and department
 */
async function getNotifications(req, res, next) {
  try {
    const userRole = req.user.role_name;
    const userDept = req.user.department_code || 'ALL';

    const notifications = await queryCommon(
      `SELECT * FROM notifications
       WHERE (target_role = 'ALL' OR target_role = ?)
         AND (target_dept = 'ALL' OR target_dept = ?)
       ORDER BY created_at DESC
       LIMIT 30`,
      [userRole, userDept]
    );

    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    next(err);
  }
}

/**
 * Broadcast an announcement or circular
 */
async function createNotification(req, res, next) {
  try {
    const { title, message, target_role, target_dept, priority, category } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    await queryCommon(
      `INSERT INTO notifications (title, message, target_role, target_dept, priority, category, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        message,
        target_role || 'ALL',
        target_dept || 'ALL',
        priority || 'MEDIUM',
        category || 'ANNOUNCEMENT',
        req.user.id,
      ]
    );

    res.status(201).json({ success: true, message: 'Notification broadcasted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  createNotification,
};
