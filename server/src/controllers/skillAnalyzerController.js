const skillService = require('../services/skillAnalyzerService');
const { queryCommon } = require('../config/db');
const { logAuditEvent } = require('../services/auditService');

/**
 * Helper to resolve studentId from req.user
 * If user is a student, returns user.student_id.
 * If user is an admin/staff without a student_id, returns default demo student ID 1 for testing.
 */
function resolveStudentId(req) {
  if (req.user?.student_id) {
    return req.user.student_id;
  }
  // If role is student but student_id missing, check if user.id maps to students_master
  return req.user?.id ? 1 : null;
}

/**
 * 1. Get skills catalogue
 * GET /api/v1/skills
 */
async function getSkills(req, res, next) {
  try {
    const { category, search } = req.query;
    const skills = await skillService.getSkillsCatalogue({ category, search });
    res.json({
      success: true,
      count: skills.length,
      data: skills,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. Get skill categories
 * GET /api/v1/skills/categories
 */
async function getCategories(req, res, next) {
  try {
    const data = await skillService.getSkillCategories();
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 3. Get student's selected skills
 * GET /api/v1/student/skills
 */
async function getStudentSkills(req, res, next) {
  try {
    const studentId = resolveStudentId(req);
    const skills = await skillService.getStudentSkills(studentId);
    res.json({
      success: true,
      studentId,
      count: skills.length,
      data: skills,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 4. Save/update student's selected skills
 * PUT /api/v1/student/skills
 */
async function saveStudentSkills(req, res, next) {
  try {
    const studentId = resolveStudentId(req);
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain a "skills" array.',
      });
    }

    const savedSkills = await skillService.saveStudentSkills(studentId, skills);

    await logAuditEvent({
      userId: req.user?.id,
      action: 'UPDATE_STUDENT_SKILLS',
      module: 'SKILL_ANALYZER',
      details: { studentId, skillCount: savedSkills.length },
    });

    res.json({
      success: true,
      message: 'Student skills updated successfully.',
      count: savedSkills.length,
      data: savedSkills,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 5. Run Skill Analysis & Role Recommendations
 * POST /api/v1/skill-analyzer/analyze
 */
async function analyzeSkills(req, res, next) {
  try {
    const studentId = resolveStudentId(req);
    const { selectedSkills, targetRoleId } = req.body;

    const analysis = await skillService.runSkillAnalysis({
      studentId,
      selectedSkills,
      targetRoleId,
    });

    await logAuditEvent({
      userId: req.user?.id,
      action: 'RUN_SKILL_ANALYSIS',
      module: 'SKILL_ANALYZER',
      details: {
        studentId,
        topRole: analysis.targetRole?.title,
        topScore: analysis.targetRole?.matchPercentage,
      },
    });

    res.json(analysis);
  } catch (err) {
    next(err);
  }
}

/**
 * 6. Get analysis history
 * GET /api/v1/skill-analyzer/history
 */
async function getAnalysisHistory(req, res, next) {
  try {
    const studentId = resolveStudentId(req);
    const history = await skillService.getStudentAnalysisHistory(studentId);
    res.json({
      success: true,
      studentId,
      count: history.length,
      data: history,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 7. Get roadmap for specific role
 * GET /api/v1/skill-analyzer/roadmap/:roleId
 */
async function getRoadmap(req, res, next) {
  try {
    const studentId = resolveStudentId(req);
    const { roleId } = req.params;

    // Fetch role matches or synthesize target role
    const currentSkills = await skillService.getStudentSkills(studentId);
    const matches = await skillService.calculateRoleMatches(currentSkills, roleId);
    const targetRole = matches[0] || {
      roleId,
      title: roleId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      matchedSkills: [],
      missingRequiredSkills: [],
    };

    const roadmap = await skillService.generatePersonalizedRoadmap(studentId, targetRole);
    res.json({
      success: true,
      data: roadmap,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 8. Update roadmap task completion
 * PATCH /api/v1/skill-analyzer/roadmap/progress
 */
async function updateRoadmapProgress(req, res, next) {
  try {
    const studentId = resolveStudentId(req);
    const { roleId, taskId, isCompleted } = req.body;

    if (!roleId || !taskId) {
      return res.status(400).json({
        success: false,
        message: 'roleId and taskId are required.',
      });
    }

    const result = await skillService.updateRoadmapProgress(
      studentId,
      roleId,
      taskId,
      Boolean(isCompleted)
    );

    res.json({
      success: true,
      message: 'Roadmap progress updated.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 9. Get quick assessment questions
 * GET /api/v1/skill-analyzer/assessment/quiz/:topic
 */
async function getAssessmentQuiz(req, res, next) {
  try {
    const { topic } = req.params;
    const questions = skillService.getAssessmentQuestions(topic);
    res.json({
      success: true,
      topic,
      totalQuestions: questions.length,
      questions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 10. Submit assessment quiz answers
 * POST /api/v1/skill-analyzer/assessment/submit
 */
async function submitAssessment(req, res, next) {
  try {
    const studentId = resolveStudentId(req);
    const { topic, answers } = req.body;

    if (!topic || !answers) {
      return res.status(400).json({
        success: false,
        message: 'topic and answers object are required.',
      });
    }

    const result = await skillService.submitAssessment({
      studentId,
      topic,
      answers,
    });

    await logAuditEvent({
      userId: req.user?.id,
      action: 'SUBMIT_SKILL_ASSESSMENT',
      module: 'SKILL_ANALYZER',
      details: {
        studentId,
        topic,
        score: result.score,
        passed: result.passed,
      },
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * 11. Admin: View skill catalogue & role requirements
 * GET /api/v1/admin/skill-catalogue
 */
async function getAdminCatalogue(req, res, next) {
  try {
    const skills = await queryCommon('SELECT * FROM skills_catalogue ORDER BY category, name ASC');
    const requirements = await queryCommon(
      `SELECT crr.*, sc.name as skill_name, sc.category as skill_category
       FROM career_role_requirements crr
       JOIN skills_catalogue sc ON sc.id = crr.skill_id
       ORDER BY crr.role_id, crr.importance_weight DESC`
    );

    res.json({
      success: true,
      skills,
      requirements,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 12. Admin: Update skill catalogue item
 * PUT /api/v1/admin/skill-catalogue/:id
 */
async function updateAdminSkill(req, res, next) {
  try {
    const skillId = req.params.id;
    const { name, category, is_popular, description } = req.body;

    await queryCommon(
      `UPDATE skills_catalogue 
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           is_popular = COALESCE(?, is_popular),
           description = COALESCE(?, description)
       WHERE id = ?`,
      [name, category, is_popular !== undefined ? (is_popular ? 1 : 0) : null, description, skillId]
    );

    res.json({
      success: true,
      message: 'Skill updated in catalogue.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 13. Admin: Add skill to catalogue
 * POST /api/v1/admin/skill-catalogue
 */
async function createAdminSkill(req, res, next) {
  try {
    const { id, name, category, is_popular, description } = req.body;
    if (!id || !name || !category) {
      return res.status(400).json({ success: false, message: 'id, name, and category are required.' });
    }

    await queryCommon(
      `INSERT INTO skills_catalogue (id, name, category, is_popular, description)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         category = VALUES(category),
         is_popular = VALUES(is_popular),
         description = VALUES(description)`,
      [id.toLowerCase().trim(), name, category, is_popular ? 1 : 0, description || '']
    );

    res.json({
      success: true,
      message: 'Skill added to catalogue.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 14. Admin: Update role requirement and importance weight
 * PUT /api/v1/admin/role-requirements
 */
async function updateRoleRequirement(req, res, next) {
  try {
    const { roleId, skillId, isRequired, importanceWeight } = req.body;

    if (!roleId || !skillId) {
      return res.status(400).json({ success: false, message: 'roleId and skillId are required.' });
    }

    await queryCommon(
      `INSERT INTO career_role_requirements (role_id, skill_id, is_required, importance_weight)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_required = VALUES(is_required),
         importance_weight = VALUES(importance_weight)`,
      [roleId, skillId, isRequired ? 1 : 0, parseFloat(importanceWeight) || 3.0]
    );

    res.json({
      success: true,
      message: 'Role requirement updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 15. Admin / Placement Officer: Manually verify a student's skill evidence
 * POST /api/v1/admin/verify-skill
 */
async function verifyStudentSkill(req, res, next) {
  try {
    const { studentId, skillId, isVerified } = req.body;
    if (!studentId || !skillId) {
      return res.status(400).json({ success: false, message: 'studentId and skillId are required.' });
    }

    await queryCommon(
      `UPDATE student_skills 
       SET is_verified = ?, 
           verified_by = ?,
           verified_at = ?
       WHERE student_id = ? AND skill_id = ?`,
      [isVerified ? 1 : 0, req.user?.id || 1, isVerified ? new Date() : null, studentId, skillId]
    );

    res.json({
      success: true,
      message: isVerified ? 'Student skill verified successfully.' : 'Student skill verification revoked.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSkills,
  getCategories,
  getStudentSkills,
  saveStudentSkills,
  analyzeSkills,
  getAnalysisHistory,
  getRoadmap,
  updateRoadmapProgress,
  getAssessmentQuiz,
  submitAssessment,
  getAdminCatalogue,
  updateAdminSkill,
  createAdminSkill,
  updateRoleRequirement,
  verifyStudentSkill,
};
