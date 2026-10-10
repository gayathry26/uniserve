const { queryCommon, queryDept } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * List all training programs
 */
async function getAllTrainings(req, res, next) {
  try {
    const trainings = await queryCommon(
      `SELECT * FROM training_programs ORDER BY start_date DESC`
    );

    res.json({ success: true, count: trainings.length, data: trainings });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new training program
 */
async function createTraining(req, res, next) {
  try {
    const { title, category, trainer_name, start_date, end_date, duration_hours, target_departments } = req.body;

    await queryCommon(
      `INSERT INTO training_programs (title, category, trainer_name, start_date, end_date, duration_hours, target_departments, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ONGOING')`,
      [
        title,
        category || 'DSA_CODING',
        trainer_name || 'Expert Placement Trainer',
        start_date || '2026-10-15',
        end_date || '2026-12-15',
        duration_hours || 40,
        JSON.stringify(target_departments || ['CSE', 'ECE', 'IT']),
      ]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'CREATE_TRAINING',
      module: 'TRAINING',
      details: { title },
    });

    res.status(201).json({ success: true, message: `Training program '${title}' created.` });
  } catch (err) {
    next(err);
  }
}

/**
 * Get department training attendance from Department DB (department-isolated table)
 */
async function getDeptTrainingAttendance(req, res, next) {
  try {
    const deptCode = req.params.departmentCode || req.user.department_code || 'CSE';
    const trainingId = req.query.trainingId;

    let sql = `SELECT * FROM dept_training_attendance`;
    const params = [];
    if (trainingId) {
      sql += ` WHERE training_program_id = ?`;
      params.push(trainingId);
    }

    const attendanceRecords = await queryDept(deptCode, sql, params);

    res.json({
      success: true,
      departmentCode: deptCode,
      data: attendanceRecords,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Record training attendance into Department DB
 */
async function recordDeptAttendance(req, res, next) {
  try {
    const deptCode = req.user.department_code || 'CSE';
    const { training_program_id, register_number, sessions_attended, total_sessions, pre_score, post_score } = req.body;

    const total = total_sessions || 20;
    const attended = sessions_attended || 0;
    const pct = Math.round((attended / total) * 100);
    const status = pct >= 75 ? 'COMPLETED' : 'REMEDIAL_REQUIRED';

    await queryDept(
      deptCode,
      `INSERT INTO dept_training_attendance (training_program_id, register_number, sessions_attended, total_sessions, attendance_percentage, pre_assessment_score, post_assessment_score, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE sessions_attended = VALUES(sessions_attended), attendance_percentage = VALUES(attendance_percentage), status = VALUES(status)`,
      [training_program_id, register_number, attended, total, pct, pre_score || 0, post_score || 0, status]
    );

    res.json({ success: true, message: `Attendance updated in ${deptCode} department database.` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllTrainings,
  createTraining,
  getDeptTrainingAttendance,
  recordDeptAttendance,
};
