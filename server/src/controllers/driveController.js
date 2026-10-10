const { v4: uuidv4 } = require('uuid');
const { queryCommon } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * Get all placement drives with their rounds and company details
 */
async function getAllDrives(req, res, next) {
  try {
    const drives = await queryCommon(
      `SELECT pd.*, j.title AS job_title, j.ctc_lpa, c.name AS company_name, c.tier AS company_tier,
              (SELECT COUNT(*) FROM job_applications WHERE job_id = pd.job_id) AS total_applicants
       FROM placement_drives pd
       JOIN jobs j ON j.id = pd.job_id
       JOIN companies c ON c.id = j.company_id
       ORDER BY pd.drive_date ASC`
    );

    // Fetch rounds for each drive
    const enrichedDrives = await Promise.all(
      drives.map(async (d) => {
        const rounds = await queryCommon(
          `SELECT * FROM drive_rounds WHERE drive_id = ? ORDER BY round_number ASC`,
          [d.id]
        );
        return { ...d, rounds };
      })
    );

    res.json({ success: true, count: enrichedDrives.length, data: enrichedDrives });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new placement drive with recruitment rounds
 */
async function createDrive(req, res, next) {
  try {
    const { job_id, drive_title, drive_type, drive_date, venue, total_rounds, rounds } = req.body;

    if (!job_id || !drive_title || !drive_date) {
      return res.status(400).json({ success: false, message: 'Missing required parameters (job_id, drive_title, drive_date).' });
    }

    const driveUuid = uuidv4();
    await queryCommon(
      `INSERT INTO placement_drives (uuid, job_id, drive_title, drive_type, drive_date, venue, current_stage, total_rounds, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Registration Stage', ?, 'UPCOMING')`,
      [driveUuid, job_id, drive_title, drive_type || 'ON_CAMPUS', drive_date, venue || 'Main Campus Placement Cell', total_rounds || 3]
    );

    const [dRow] = await queryCommon(`SELECT id FROM placement_drives WHERE uuid = ?`, [driveUuid]);
    const driveId = dRow.id;

    // Insert rounds
    if (rounds && Array.isArray(rounds)) {
      for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i];
        await queryCommon(
          `INSERT INTO drive_rounds (drive_id, round_number, round_name, round_type, venue_or_link, status)
           VALUES (?, ?, ?, ?, ?, 'PENDING')`,
          [driveId, i + 1, r.name || `Round ${i + 1}`, r.type || 'TECH_INTERVIEW', r.venue_or_link || null]
        );
      }
    }

    await logAuditEvent({
      userId: req.user.id,
      action: 'CREATE_DRIVE',
      module: 'DRIVE_MANAGEMENT',
      details: { driveTitle: drive_title },
    });

    res.status(201).json({ success: true, message: `Placement drive '${drive_title}' created successfully.` });
  } catch (err) {
    next(err);
  }
}

/**
 * Update drive round status or current stage
 */
async function updateDriveStage(req, res, next) {
  try {
    const driveId = req.params.id;
    const { current_stage, status } = req.body;

    await queryCommon(
      `UPDATE placement_drives 
       SET current_stage = COALESCE(?, current_stage), status = COALESCE(?, status)
       WHERE id = ?`,
      [current_stage, status, driveId]
    );

    res.json({ success: true, message: 'Drive stage updated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllDrives,
  createDrive,
  updateDriveStage,
};
