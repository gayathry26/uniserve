const { queryCommon, queryDept } = require('../config/db');

// Technical assessment questions bank
const ASSESSMENT_BANKS = {
  programming: [
    {
      id: 'p1',
      question: 'What is the primary difference between `let` and `var` in modern JavaScript?',
      options: [
        'var has function scope while let has block scope',
        'let is hoisted to global scope while var is not',
        'var cannot be reassigned while let can',
        'There is no difference in ES6+'
      ],
      correctIndex: 0,
      explanation: '`var` declarations are function-scoped and hoisted with undefined, while `let` declarations are block-scoped and exist in the Temporal Dead Zone until initialized.'
    },
    {
      id: 'p2',
      question: 'What is the time complexity of searching for an element in an unsorted array of size N?',
      options: [
        'O(1)',
        'O(log N)',
        'O(N)',
        'O(N log N)'
      ],
      correctIndex: 2,
      explanation: 'In an unsorted array, we may need to examine all N elements in the worst case, giving O(N) linear time complexity.'
    },
    {
      id: 'p3',
      question: 'Which of the following creates a closure in JavaScript?',
      options: [
        'An inner function retaining access to variables in its outer enclosing lexical scope',
        'A function called with the `new` keyword',
        'A JSON object parsed with JSON.parse()',
        'A recursive function without a base case'
      ],
      correctIndex: 0,
      explanation: 'A closure is the combination of a function bundled together with references to its surrounding lexical environment.'
    },
    {
      id: 'p4',
      question: 'In Python, what is the output of `type([]) == list`?',
      options: [
        'False',
        'True',
        'TypeError',
        'SyntaxError'
      ],
      correctIndex: 1,
      explanation: '`[]` creates an empty list object whose type is the built-in `list` class, so comparing it yields True.'
    },
    {
      id: 'p5',
      question: 'What is the advantage of using immutability in state management architectures?',
      options: [
        'It allows direct mutation of object properties without cloning',
        'It makes state transitions predictable, enables shallow equality checks, and prevents side effects',
        'It reduces memory usage to zero bytes',
        'It removes the need for functions'
      ],
      correctIndex: 1,
      explanation: 'Immutability ensures pure state transitions, makes change detection fast via reference comparison (O(1)), and eliminates hidden side-effects.'
    }
  ],
  sql: [
    {
      id: 's1',
      question: 'What is the fundamental difference between `WHERE` and `HAVING` clauses in SQL?',
      options: [
        'WHERE filters rows before grouping, while HAVING filters aggregate groups after GROUP BY',
        'HAVING can only be used with primary keys, WHERE cannot',
        'WHERE is used only in PostgreSQL, HAVING is used only in MySQL',
        'There is no functional difference'
      ],
      correctIndex: 0,
      explanation: 'The WHERE clause filters individual rows before aggregation occurs, whereas HAVING filters groups created by the GROUP BY clause.'
    },
    {
      id: 's2',
      question: 'Which JOIN returns all rows from the left table and matched rows from the right table?',
      options: [
        'INNER JOIN',
        'LEFT OUTER JOIN',
        'RIGHT OUTER JOIN',
        'FULL OUTER JOIN'
      ],
      correctIndex: 1,
      explanation: 'LEFT JOIN (or LEFT OUTER JOIN) preserves all rows from the left table, displaying NULL for non-matching right table columns.'
    },
    {
      id: 's3',
      question: 'What does the "I" stand for in the ACID transaction model?',
      options: [
        'Iteration',
        'Isolation',
        'Indexation',
        'Inheritance'
      ],
      correctIndex: 1,
      explanation: 'ACID stands for Atomicity, Consistency, Isolation, and Durability.'
    },
    {
      id: 's4',
      question: 'Which index type is most commonly used by default in relational databases (MySQL InnoDB)?',
      options: [
        'B-Tree / B+Tree Index',
        'Hash Index',
        'Spatial R-Tree Index',
        'Full-text Index'
      ],
      correctIndex: 0,
      explanation: 'InnoDB uses B+Tree data structures for primary (clustered) and secondary indexes to support efficient range and point queries in O(log N).'
    },
    {
      id: 's5',
      question: 'What is the result of `SELECT COUNT(*)` on an empty table?',
      options: [
        'NULL',
        '0',
        'Runtime Error',
        '-1'
      ],
      correctIndex: 1,
      explanation: 'COUNT(*) on an empty table returns 0.'
    }
  ],
  aptitude: [
    {
      id: 'a1',
      question: 'If A can finish a job in 6 days and B can finish it in 12 days, how many days will they take working together?',
      options: [
        '3 days',
        '4 days',
        '5 days',
        '9 days'
      ],
      correctIndex: 1,
      explanation: 'Combined rate = 1/6 + 1/12 = 3/12 = 1/4 per day. Therefore, together they take 4 days.'
    },
    {
      id: 'a2',
      question: 'A train 150m long passes a pole in 15 seconds. What is the speed of the train in km/h?',
      options: [
        '36 km/h',
        '40 km/h',
        '48 km/h',
        '54 km/h'
      ],
      correctIndex: 0,
      explanation: 'Speed = 150m / 15s = 10 m/s. 10 * (18 / 5) = 36 km/h.'
    },
    {
      id: 'a3',
      question: 'What is the next number in the series: 3, 7, 15, 31, 63, ?',
      options: [
        '95',
        '127',
        '125',
        '128'
      ],
      correctIndex: 1,
      explanation: 'Each term is (previous * 2) + 1. 63 * 2 + 1 = 127 (or 2^(n+1) - 1).'
    },
    {
      id: 'a4',
      question: 'A product price is increased by 20% and then decreased by 20%. What is the net percentage change?',
      options: [
        'No change (0%)',
        '4% decrease',
        '4% increase',
        '2% decrease'
      ],
      correctIndex: 1,
      explanation: 'Let price = 100. 100 -> 120 -> 120 - 24 = 96. Net change is 4% decrease (-4%).'
    }
  ],
  'technical-fundamentals': [
    {
      id: 't1',
      question: 'Which HTTP method should be idempotent according to the RFC 7231 specification?',
      options: [
        'POST',
        'PUT',
        'PATCH (without condition)',
        'CONNECT'
      ],
      correctIndex: 1,
      explanation: 'PUT and DELETE are designed to be idempotent: calling them multiple times with identical payloads produces the same final resource state.'
    },
    {
      id: 't2',
      question: 'What HTTP status code indicates that the client request was successful and created a new resource?',
      options: [
        '200 OK',
        '201 Created',
        '204 No Content',
        '304 Not Modified'
      ],
      correctIndex: 1,
      explanation: 'HTTP 201 Created indicates the request succeeded and resulted in the creation of a new resource.'
    },
    {
      id: 't3',
      question: 'What is the purpose of CORS (Cross-Origin Resource Sharing)?',
      options: [
        'To speed up TCP handshakes',
        'A browser security mechanism allowing a server to declare which origins can access its resources',
        'To compress HTTP images',
        'To encrypt passwords in localStorage'
      ],
      correctIndex: 1,
      explanation: 'CORS is a browser security protocol that tells the browser whether requests from a different origin domain are authorized to read response data.'
    },
    {
      id: 't4',
      question: 'In Git, what does `git merge` do compared to `git rebase`?',
      options: [
        'Merge creates a new merge commit preserving branch history, while rebase rewrites commits linearly on top of the target branch',
        'Merge deletes the local branch, rebase preserves it',
        'Rebase is only used on GitHub, merge is only used locally',
        'They are exact synonyms'
      ],
      correctIndex: 0,
      explanation: 'Merge creates a distinct join commit preserving non-linear history; rebase replays your commits one by one on top of the base commit for a linear history.'
    }
  ]
};

// Skill-to-topic mapping for automatic assessment verification
const TOPIC_SKILL_MAP = {
  programming: ['problem-solving', 'javascript', 'python'],
  sql: ['sql', 'mysql', 'postgresql'],
  aptitude: ['problem-solving'],
  'technical-fundamentals': ['git', 'rest-apis', 'linux']
};

/**
 * Get all skills in catalogue
 */
async function getSkillsCatalogue(options = {}) {
  const { category, search } = options;
  let sql = 'SELECT * FROM skills_catalogue WHERE 1=1';
  const params = [];

  if (category && category !== 'All Skills' && category !== 'ALL') {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (search && search.trim()) {
    sql += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY is_popular DESC, name ASC';

  const skills = await queryCommon(sql, params);
  return skills.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    isPopular: Boolean(s.is_popular),
    description: s.description || '',
    icon: s.icon || null,
  }));
}

/**
 * Get distinct categories and skill counts
 */
async function getSkillCategories() {
  const sql = `
    SELECT category, COUNT(*) as count 
    FROM skills_catalogue 
    GROUP BY category 
    ORDER BY category ASC
  `;
  const rows = await queryCommon(sql);
  const total = rows.reduce((acc, r) => acc + parseInt(r.count, 10), 0);
  return {
    totalSkills: total,
    categories: rows.map(r => ({
      name: r.category,
      count: parseInt(r.count, 10),
    })),
  };
}

/**
 * Get student's currently selected skills
 */
async function getStudentSkills(studentId) {
  if (!studentId) return [];

  const sql = `
    SELECT 
      ss.id,
      ss.student_id,
      ss.skill_id,
      ss.proficiency_level,
      ss.evidence_type,
      ss.evidence_url,
      ss.is_verified,
      ss.verified_at,
      sc.name,
      sc.category,
      sc.is_popular,
      sc.description
    FROM student_skills ss
    JOIN skills_catalogue sc ON sc.id = ss.skill_id
    WHERE ss.student_id = ?
    ORDER BY sc.name ASC
  `;
  const rows = await queryCommon(sql, [studentId]);

  return rows.map(r => ({
    skillId: r.skill_id,
    name: r.name,
    category: r.category,
    isPopular: Boolean(r.is_popular),
    description: r.description,
    proficiencyLevel: r.proficiency_level,
    evidenceType: r.evidence_type || 'NONE',
    evidenceUrl: r.evidence_url || '',
    isVerified: Boolean(r.is_verified),
    verifiedAt: r.verified_at || null,
  }));
}

/**
 * Save / Update student's selected skills
 */
async function saveStudentSkills(studentId, skillsArray) {
  if (!studentId) {
    throw new Error('Student ID is required to save skills.');
  }

  if (!Array.isArray(skillsArray)) {
    throw new Error('Skills must be an array.');
  }

  // Deduplicate by skillId
  const uniqueSkillsMap = new Map();
  for (const s of skillsArray) {
    const sId = typeof s === 'string' ? s : s.skillId || s.id;
    if (sId && !uniqueSkillsMap.has(sId)) {
      uniqueSkillsMap.set(sId, {
        skillId: sId,
        proficiencyLevel: s.proficiencyLevel || 'INTERMEDIATE',
        evidenceType: s.evidenceType || 'NONE',
        evidenceUrl: s.evidenceUrl || null,
        isVerified: s.isVerified ? 1 : 0,
      });
    }
  }

  // Fetch existing skills to preserve verified status
  const existingRows = await queryCommon(
    'SELECT skill_id, is_verified, evidence_type, evidence_url, verified_at FROM student_skills WHERE student_id = ?',
    [studentId]
  );
  const existingMap = new Map();
  existingRows.forEach(r => existingMap.set(r.skill_id, r));

  // Remove skills that are no longer in the list
  const currentSkillIds = Array.from(uniqueSkillsMap.keys());
  if (currentSkillIds.length > 0) {
    const placeholders = currentSkillIds.map(() => '?').join(',');
    await queryCommon(
      `DELETE FROM student_skills WHERE student_id = ? AND skill_id NOT IN (${placeholders})`,
      [studentId, ...currentSkillIds]
    );
  } else {
    await queryCommon('DELETE FROM student_skills WHERE student_id = ?', [studentId]);
  }

  // Insert or update remaining skills
  for (const skill of uniqueSkillsMap.values()) {
    const existing = existingMap.get(skill.skillId);
    // If previously verified by assessment/admin, preserve verification unless student explicitly clears it
    const isVerified = existing?.is_verified ? 1 : skill.isVerified;
    const evidenceType = existing?.is_verified ? existing.evidence_type : skill.evidenceType;
    const evidenceUrl = skill.evidenceUrl || existing?.evidence_url || null;

    await queryCommon(
      `INSERT INTO student_skills (student_id, skill_id, proficiency_level, evidence_type, evidence_url, is_verified)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         proficiency_level = VALUES(proficiency_level),
         evidence_type = VALUES(evidence_type),
         evidence_url = VALUES(evidence_url),
         is_verified = VALUES(is_verified)`,
      [studentId, skill.skillId, skill.proficiencyLevel, evidenceType, evidenceUrl, isVerified]
    );
  }

  // Update students_master.skills JSON for backwards compatibility with profile
  const skillNamesRows = currentSkillIds.length > 0
    ? await queryCommon(`SELECT name FROM skills_catalogue WHERE id IN (${currentSkillIds.map(() => '?').join(',')})`, currentSkillIds)
    : [];
  const skillNames = skillNamesRows.map(r => r.name);
  await queryCommon('UPDATE students_master SET skills = ? WHERE id = ?', [JSON.stringify(skillNames), studentId]);

  return await getStudentSkills(studentId);
}

/**
 * Deterministic Role Match Calculation
 * Evaluates student skills against career role requirements
 */
async function calculateRoleMatches(studentSkills, targetRoleId = null) {
  // Load all role requirements from DB
  const roleReqs = await queryCommon(
    `SELECT crr.*, sc.name as skill_name, sc.category as skill_category
     FROM career_role_requirements crr
     JOIN skills_catalogue sc ON sc.id = crr.skill_id
     ORDER BY crr.role_id, crr.is_required DESC, crr.importance_weight DESC`
  );

  // Group requirements by role_id
  const reqsByRole = new Map();
  roleReqs.forEach(req => {
    if (!reqsByRole.has(req.role_id)) {
      reqsByRole.set(req.role_id, []);
    }
    reqsByRole.get(req.role_id).push(req);
  });

  // Map student skills for fast lookup
  const studentSkillMap = new Map();
  studentSkills.forEach(s => {
    studentSkillMap.set(s.skillId, s);
  });

  // Known role metadata lookup (matching itRoles.js)
  const roleMetadata = {
    'frontend-developer': { title: 'Frontend Developer', category: 'Software Development', shortDescription: 'Builds responsive, high-performance web user interfaces using modern web frameworks, component architectures, and browser APIs.' },
    'backend-developer': { title: 'Backend Developer', category: 'Software Development', shortDescription: 'Engineers scalable server-side systems, microservices, databases, authentication, and high-throughput APIs.' },
    'full-stack-developer': { title: 'Full Stack Developer', category: 'Software Development', shortDescription: 'Bridges frontend design systems and robust backend microservices to deliver end-to-end web applications.' },
    'data-analyst': { title: 'Data Analyst', category: 'Data Science & Analytics', shortDescription: 'Transforms structured business data into actionable dashboards, KPIs, and analytical intelligence.' },
    'data-scientist': { title: 'Data Scientist', category: 'Data Science & Analytics', shortDescription: 'Applies statistical modeling, exploratory analytics, and predictive machine learning algorithms to complex datasets.' },
    'ai-ml-engineer': { title: 'AI / Machine Learning Engineer', category: 'Artificial Intelligence & Machine Learning', shortDescription: 'Designs, trains, and deploys deep learning models, LLMs, and intelligent automation systems to production.' },
    'cybersecurity-analyst': { title: 'Cybersecurity Analyst', category: 'Cybersecurity', shortDescription: 'Defends digital infrastructure against threats, conducts vulnerability assessments, and enforces compliance.' },
    'cloud-engineer': { title: 'Cloud Engineer', category: 'Cloud Computing & DevOps', shortDescription: 'Architects, provisions, and maintains highly resilient multi-region infrastructure on AWS, Azure, or GCP.' },
    'devops-engineer': { title: 'DevOps Engineer', category: 'Cloud Computing & DevOps', shortDescription: 'Automates CI/CD delivery pipelines, manages Kubernetes clusters, and guarantees system observability.' },
    'ui-ux-designer': { title: 'UI/UX Designer', category: 'UI/UX & Design', shortDescription: 'Crafts intuitive user journeys, interactive wireframes, and design systems with Figma.' },
    'software-tester': { title: 'Software Tester / QA Engineer', category: 'Testing & Quality Assurance', shortDescription: 'Ensures software reliability through automated test suites, end-to-end regression frameworks, and API validation.' },
    'mobile-app-developer': { title: 'Mobile App Developer', category: 'Software Development', shortDescription: 'Builds fluid cross-platform or native mobile experiences on iOS and Android devices.' },
  };

  const results = [];

  for (const [roleId, reqs] of reqsByRole.entries()) {
    if (targetRoleId && roleId !== targetRoleId) {
      continue;
    }

    const meta = roleMetadata[roleId] || {
      title: roleId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      category: 'Software Development',
      shortDescription: 'Technical engineering role.'
    };

    let totalWeight = 0;
    let earnedPoints = 0;
    let missingCriticalCount = 0;

    const matchedSkills = [];
    const missingRequiredSkills = [];
    const missingOptionalSkills = [];
    const proficiencyGaps = [];
    const scoreModifiers = [];

    for (const req of reqs) {
      const weight = parseFloat(req.importance_weight) || 3.0;
      totalWeight += weight;

      const studentSkill = studentSkillMap.get(req.skill_id);

      if (studentSkill) {
        // Base proficiency factor
        let proficiencyFactor = 0.8; // INTERMEDIATE default
        if (studentSkill.proficiencyLevel === 'BEGINNER') proficiencyFactor = 0.5;
        if (studentSkill.proficiencyLevel === 'ADVANCED') proficiencyFactor = 1.0;

        // Evidence and verification multiplier
        let evidenceMultiplier = 0.92; // Self-reported baseline
        if (studentSkill.isVerified) {
          evidenceMultiplier = 1.15; // Official assessment or admin verification
        } else if (studentSkill.evidenceType === 'PROJECT' || studentSkill.evidenceType === 'GITHUB') {
          evidenceMultiplier = 1.10; // Project or repo proof
        } else if (studentSkill.evidenceType === 'CERTIFICATION') {
          evidenceMultiplier = 1.08;
        }

        const effectiveSkillScore = Math.min(1.0, proficiencyFactor * evidenceMultiplier);
        const points = effectiveSkillScore * weight;
        earnedPoints += points;

        matchedSkills.push({
          skillId: req.skill_id,
          name: req.skill_name,
          category: req.skill_category,
          proficiencyLevel: studentSkill.proficiencyLevel,
          isVerified: studentSkill.isVerified,
          evidenceType: studentSkill.evidenceType,
          weight,
          earnedPoints: parseFloat(points.toFixed(2)),
          isRequired: Boolean(req.is_required),
          impact: 'POSITIVE',
        });

        if (req.is_required && studentSkill.proficiencyLevel === 'BEGINNER') {
          proficiencyGaps.push({
            skillId: req.skill_id,
            name: req.skill_name,
            currentProficiency: 'BEGINNER',
            recommendedProficiency: 'INTERMEDIATE',
            reason: `Core required skill for ${meta.title}. Increasing from Beginner to Intermediate will significantly boost match confidence.`
          });
        }
      } else {
        if (req.is_required) {
          missingCriticalCount++;
          missingRequiredSkills.push({
            skillId: req.skill_id,
            name: req.skill_name,
            category: req.skill_category,
            weight,
            impact: 'CRITICAL_GAP',
            note: 'Essential core requirement'
          });
        } else {
          missingOptionalSkills.push({
            skillId: req.skill_id,
            name: req.skill_name,
            category: req.skill_category,
            weight,
            impact: 'RECOMMENDED',
            note: 'High-value secondary skill'
          });
        }
      }
    }

    // Deterministic match percentage calculation
    let rawPercentage = totalWeight > 0 ? (earnedPoints / totalWeight) * 100 : 0;

    // Apply structured penalty for missing core required skills
    // Each missing critical core skill reduces total confidence by 4%
    const criticalPenalty = Math.min(20, missingCriticalCount * 4);
    let finalPercentage = Math.max(5, Math.round(rawPercentage - criticalPenalty));
    if (finalPercentage > 98) finalPercentage = 98; // 99/100 reserved for 100% verified advanced match

    // Formulate transparent explanation
    let explanation = `Match score of ${finalPercentage}% calculated from ${matchedSkills.length} of ${reqs.length} evaluated skills. `;
    if (matchedSkills.length > 0) {
      explanation += `Strong alignment in ${matchedSkills.slice(0, 3).map(s => s.name).join(', ')}. `;
    }
    if (missingCriticalCount > 0) {
      explanation += `Deducted ${criticalPenalty}% due to ${missingCriticalCount} missing core prerequisite${missingCriticalCount > 1 ? 's' : ''} (${missingRequiredSkills.slice(0, 2).map(s => s.name).join(', ')}). `;
    }
    const verifiedCount = matchedSkills.filter(s => s.isVerified).length;
    if (verifiedCount > 0) {
      explanation += `+${verifiedCount * 3}% verification bonus awarded for verified assessment credentials.`;
    }

    let matchGrade = 'Emerging Fit';
    if (finalPercentage >= 80) matchGrade = 'Strong Match';
    else if (finalPercentage >= 65) matchGrade = 'Good Match';
    else if (finalPercentage >= 45) matchGrade = 'Moderate Match';

    results.push({
      roleId,
      title: meta.title,
      category: meta.category,
      shortDescription: meta.shortDescription,
      matchPercentage: finalPercentage,
      matchGrade,
      earnedPoints: parseFloat(earnedPoints.toFixed(1)),
      totalWeight: parseFloat(totalWeight.toFixed(1)),
      matchedSkillsCount: matchedSkills.length,
      totalRequiredSkillsCount: reqs.filter(r => r.is_required).length,
      matchedSkills,
      missingRequiredSkills,
      missingOptionalSkills,
      proficiencyGaps,
      scoreExplanation: explanation,
    });
  }

  // Sort descending by matchPercentage
  results.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return results;
}

/**
 * Generate comprehensive skill profile summary
 */
function generateSkillProfile(studentSkills) {
  const totalSelected = studentSkills.length;
  const proficiencyDistribution = {
    BEGINNER: 0,
    INTERMEDIATE: 0,
    ADVANCED: 0,
  };
  const categoryDistribution = {};
  const evidenceDistribution = {
    VERIFIED: 0,
    PROJECT: 0,
    GITHUB: 0,
    CERTIFICATION: 0,
    SELF_REPORTED: 0,
  };

  studentSkills.forEach(s => {
    if (proficiencyDistribution[s.proficiencyLevel] !== undefined) {
      proficiencyDistribution[s.proficiencyLevel]++;
    }
    categoryDistribution[s.category] = (categoryDistribution[s.category] || 0) + 1;

    if (s.isVerified) {
      evidenceDistribution.VERIFIED++;
    } else if (s.evidenceType === 'PROJECT') {
      evidenceDistribution.PROJECT++;
    } else if (s.evidenceType === 'GITHUB') {
      evidenceDistribution.GITHUB++;
    } else if (s.evidenceType === 'CERTIFICATION') {
      evidenceDistribution.CERTIFICATION++;
    } else {
      evidenceDistribution.SELF_REPORTED++;
    }
  });

  // Identify strongest skill areas
  const strongestSkillAreas = Object.entries(categoryDistribution)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => ({
      category: cat,
      count,
      percentage: totalSelected > 0 ? Math.round((count / totalSelected) * 100) : 0,
    }));

  // Foundational essentials check
  const skillIdSet = new Set(studentSkills.map(s => s.skillId));
  const missingFoundationalSkills = [];

  const foundationalChecks = [
    { id: 'git', name: 'Git & Version Control', reason: 'Universal prerequisite for team software development and CI/CD pipelines.' },
    { id: 'sql', name: 'SQL & Database Querying', reason: 'Critical for data persistence, backend logic, and analytics.' },
    { id: 'problem-solving', name: 'Data Structures & Problem Solving', reason: 'Standard foundation tested during technical screening and coding rounds.' },
    { id: 'rest-apis', name: 'REST APIs & Web Standards', reason: 'Essential for connecting frontend, backend, and external microservices.' },
  ];

  for (const f of foundationalChecks) {
    if (!skillIdSet.has(f.id)) {
      missingFoundationalSkills.push(f);
    }
  }

  // Skills needing improvement (Beginner level or unverified)
  const skillsNeedingImprovement = studentSkills
    .filter(s => s.proficiencyLevel === 'BEGINNER' || !s.isVerified)
    .map(s => ({
      skillId: s.skillId,
      name: s.name,
      category: s.category,
      currentLevel: s.proficiencyLevel,
      recommendation: s.proficiencyLevel === 'BEGINNER'
        ? 'Advance beyond basics with a practical project or assessment'
        : 'Verify proficiency by taking the short skill quiz or attaching GitHub evidence',
    }));

  return {
    totalSelected,
    proficiencyDistribution,
    categoryDistribution,
    evidenceDistribution,
    strongestSkillAreas,
    missingFoundationalSkills,
    skillsNeedingImprovement,
  };
}

/**
 * Generate 5-stage personalized learning roadmap for target role
 */
async function generatePersonalizedRoadmap(studentId, targetRole) {
  const roleId = targetRole.roleId;

  // Check if student has saved roadmap progress in DB
  let savedProgress = null;
  if (studentId) {
    const rows = await queryCommon(
      'SELECT stage_progress, completed_tasks FROM student_learning_roadmaps WHERE student_id = ? AND role_id = ?',
      [studentId, roleId]
    );
    if (rows.length > 0) {
      savedProgress = {
        stageProgress: typeof rows[0].stage_progress === 'string' ? JSON.parse(rows[0].stage_progress) : (rows[0].stage_progress || {}),
        completedTasks: typeof rows[0].completed_tasks === 'string' ? JSON.parse(rows[0].completed_tasks) : (rows[0].completed_tasks || []),
      };
    }
  }

  const completedTaskIds = new Set(savedProgress?.completedTasks || []);

  // Standard 5-stage roadmap customized to target role
  const stages = [
    {
      stageNumber: 1,
      title: 'Foundations & Computer Science Core',
      description: `Establish bedrock fundamentals, algorithmic thinking, and core syntax for ${targetRole.title}.`,
      learningObjectives: [
        'Master core language syntax, memory management, and asynchronous control flows.',
        'Implement fundamental data structures (Arrays, Hash Maps, Stacks, Queues, Trees) from scratch.',
        'Establish standard Git workflow (branching, commits, pull requests, semantic versioning).',
      ],
      resources: [
        { name: 'freeCodeCamp Developer Curriculum', url: 'https://www.freecodecamp.org/', type: 'Free Course' },
        { name: 'CS50: Introduction to Computer Science', url: 'https://cs50.harvard.edu/', type: 'Lecture Series' },
        { name: 'Git & GitHub Official Documentation', url: 'https://docs.github.com/', type: 'Reference' },
      ],
      tasks: [
        { id: `${roleId}_s1_t1`, title: 'Complete 25 fundamental algorithmic challenges on LeetCode/CodeSprint', completed: completedTaskIds.has(`${roleId}_s1_t1`) },
        { id: `${roleId}_s1_t2`, title: 'Setup GitHub profile with standard README and Git SSH credentials', completed: completedTaskIds.has(`${roleId}_s1_t2`) },
        { id: `${roleId}_s1_t3`, title: 'Build a command-line utility applying modular programming standards', completed: completedTaskIds.has(`${roleId}_s1_t3`) },
      ],
    },
    {
      stageNumber: 2,
      title: 'Core Technical Skills & Frameworks',
      description: `Target the essential technologies required for ${targetRole.title} (${targetRole.matchedSkills.concat(targetRole.missingRequiredSkills).slice(0, 4).map(s => s.name).join(', ')}).`,
      learningObjectives: [
        `Deep dive into primary stack tools (${targetRole.missingRequiredSkills.map(s => s.name).slice(0, 3).join(', ') || 'Core Technologies'}).`,
        'Understand application lifecycle, state management, and separation of concerns.',
        'Connect components to live databases with robust schema design and transactions.',
      ],
      resources: [
        { name: 'Official Framework Documentation & Interactive Guides', url: 'https://developer.mozilla.org/', type: 'Docs' },
        { name: 'Full Stack Open - University of Helsinki', url: 'https://fullstackopen.com/', type: 'Course' },
        { name: 'Database Design & SQL Mastery Guide', url: 'https://sqlbolt.com/', type: 'Interactive' },
      ],
      tasks: [
        { id: `${roleId}_s2_t1`, title: `Close core requirement: Learn and practice ${targetRole.missingRequiredSkills[0]?.name || 'primary framework'}`, completed: completedTaskIds.has(`${roleId}_s2_t1`) },
        { id: `${roleId}_s2_t2`, title: 'Design normalized relational schema with indexes and foreign keys', completed: completedTaskIds.has(`${roleId}_s2_t2`) },
        { id: `${roleId}_s2_t3`, title: 'Build a CRUD micro-application with end-to-end API integration', completed: completedTaskIds.has(`${roleId}_s2_t3`) },
      ],
    },
    {
      stageNumber: 3,
      title: 'Tools, Automation & Testing',
      description: 'Level up engineering hygiene with containerization, automated testing, and CI/CD pipelines.',
      learningObjectives: [
        'Containerize multi-container architectures using Docker and Docker Compose.',
        'Write unit, integration, and contract tests to achieve 80%+ code coverage.',
        'Configure GitHub Actions workflows for continuous integration and automated builds.',
      ],
      resources: [
        { name: 'Docker for Developers Hands-on Tutorial', url: 'https://docs.docker.com/get-started/', type: 'Guide' },
        { name: 'Testing JavaScript & Modern Test Suites', url: 'https://jestjs.io/', type: 'Reference' },
        { name: 'GitHub Actions CI/CD Blueprint', url: 'https://github.com/features/actions', type: 'Tutorial' },
      ],
      tasks: [
        { id: `${roleId}_s3_t1`, title: 'Dockerize application with multi-stage production Dockerfile', completed: completedTaskIds.has(`${roleId}_s3_t1`) },
        { id: `${roleId}_s3_t2`, title: 'Author automated unit and integration tests covering key endpoints', completed: completedTaskIds.has(`${roleId}_s3_t2`) },
        { id: `${roleId}_s3_t3`, title: 'Setup automated CI workflow to run linters and test suites on push', completed: completedTaskIds.has(`${roleId}_s3_t3`) },
      ],
    },
    {
      stageNumber: 4,
      title: 'Practical Capstone Projects',
      description: 'Build and deploy two portfolio-worthy projects demonstrating production architecture.',
      learningObjectives: [
        'Architect a full-featured real-world system from user requirements to cloud deployment.',
        'Implement authentication (JWT/OAuth), role-based authorization, and caching.',
        'Deploy application to cloud with HTTPS, custom domain, and automated logs.',
      ],
      resources: [
        { name: 'RealWorld Example Apps Architecture Specs', url: 'https://github.com/gothinkster/realworld', type: 'Architecture' },
        { name: 'Free Cloud Hosting Blueprint (Vercel, Render, Supabase)', url: 'https://vercel.com', type: 'Deployment' },
      ],
      tasks: [
        { id: `${roleId}_s4_t1`, title: `Build capstone project for ${targetRole.title} with complete documentation`, completed: completedTaskIds.has(`${roleId}_s4_t1`) },
        { id: `${roleId}_s4_t2`, title: 'Deploy live production build with accessible preview URL and clean Git history', completed: completedTaskIds.has(`${roleId}_s4_t2`) },
        { id: `${roleId}_s4_t3`, title: 'Record a 2-minute Loom/walkthrough video explaining technical architecture', completed: completedTaskIds.has(`${roleId}_s4_t3`) },
      ],
    },
    {
      stageNumber: 5,
      title: 'Assessment & Placement Interview Readiness',
      description: 'Prepare for technical interview loops, system design interviews, and live coding rounds.',
      learningObjectives: [
        'Master common algorithmic patterns (Two Pointers, Sliding Window, DFS/BFS, Dynamic Programming).',
        'Review standard system design questions and technical interview communication.',
        'Complete CampusCorp mock video interviews and technical assessments.',
      ],
      resources: [
        { name: 'CampusCorp Mock Video Interview Platform', url: '/videocall/interview', type: 'Internal Portal' },
        { name: 'NeetCode 150 Coding Interview Roadmap', url: 'https://neetcode.io/', type: 'Problem List' },
        { name: 'System Design Primer by Donne Martin', url: 'https://github.com/donnemartin/system-design-primer', type: 'Guide' },
      ],
      tasks: [
        { id: `${roleId}_s5_t1`, title: 'Complete 3 mock technical interviews on CampusCorp Meet Platform', completed: completedTaskIds.has(`${roleId}_s5_t1`) },
        { id: `${roleId}_s5_t2`, title: 'Score 80%+ on CampusCorp Programming & SQL Technical Assessments', completed: completedTaskIds.has(`${roleId}_s5_t2`) },
        { id: `${roleId}_s5_t3`, title: 'Refine technical resume with quantified project impact and verified skill badges', completed: completedTaskIds.has(`${roleId}_s5_t3`) },
      ],
    },
  ];

  // Calculate overall progress
  let totalTasks = 0;
  let completedCount = 0;

  stages.forEach(stage => {
    const stageTasks = stage.tasks;
    totalTasks += stageTasks.length;
    const stageCompleted = stageTasks.filter(t => t.completed).length;
    completedCount += stageCompleted;
    stage.progressPercentage = stageTasks.length > 0 ? Math.round((stageCompleted / stageTasks.length) * 100) : 0;
    stage.isCompleted = stageCompleted === stageTasks.length;
  });

  const overallProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return {
    roleId,
    roleTitle: targetRole.title,
    overallProgress,
    totalTasks,
    completedTasksCount: completedCount,
    stages,
  };
}

/**
 * Generate Top 3 Prioritized Next Actions
 */
function generateNextActions(targetRole, skillProfile) {
  const actions = [];

  // Action 1: Fill highest weight missing critical requirement
  if (targetRole.missingRequiredSkills.length > 0) {
    const topMissing = targetRole.missingRequiredSkills[0];
    actions.push({
      priority: 1,
      title: `Acquire ${topMissing.name} (${topMissing.category})`,
      category: 'Skill Gap',
      description: `This is a critical core requirement for ${targetRole.title}. Adding it will boost your role match score by up to ${Math.round(topMissing.weight * 3)}%.`,
      ctaText: 'Start Learning Module',
      actionUrl: `/domains?role=${targetRole.roleId}`,
    });
  } else if (targetRole.proficiencyGaps.length > 0) {
    const topGap = targetRole.proficiencyGaps[0];
    actions.push({
      priority: 1,
      title: `Advance ${topGap.name} to Intermediate`,
      category: 'Proficiency Gap',
      description: topGap.reason,
      ctaText: 'View Project Blueprint',
      actionUrl: `/domains?role=${targetRole.roleId}`,
    });
  } else {
    actions.push({
      priority: 1,
      title: `Review Advanced ${targetRole.title} System Architecture`,
      category: 'Mastery',
      description: 'You have solid core alignment. Dive into high-concurrency patterns and production deployment.',
      ctaText: 'Explore Deep Dives',
      actionUrl: `/domains?role=${targetRole.roleId}`,
    });
  }

  // Action 2: Verification / Evidence for unverified skills
  const unverified = targetRole.matchedSkills.filter(s => !s.isVerified);
  if (unverified.length > 0) {
    const toVerify = unverified[0];
    actions.push({
      priority: 2,
      title: `Verify Your ${toVerify.name} Skill`,
      category: 'Credential Verification',
      description: `Take a 3-minute technical assessment or link your GitHub project repository to convert this from self-reported to verified status.`,
      ctaText: 'Take Quick Assessment',
      actionUrl: '#assessment',
    });
  } else {
    actions.push({
      priority: 2,
      title: 'Practice Coding Assessment on CampusCorp',
      category: 'Assessment',
      description: 'Benchmark your programming speed and logic against company placement cutoffs.',
      ctaText: 'Go to Assessment',
      actionUrl: '/assessment',
    });
  }

  // Action 3: Next roadmap milestone or role comparison
  actions.push({
    priority: 3,
    title: `Compare ${targetRole.title} with Alternative Roles`,
    category: 'Career Discovery',
    description: `Evaluate requirements, salary benchmarks, and growth curves against related roles in the Career Explorer.`,
    ctaText: 'Open Role Comparison',
    actionUrl: `/compare?roles=${targetRole.roleId}`,
  });

  return actions;
}

/**
 * Run full analysis for student
 */
async function runSkillAnalysis({ studentId, selectedSkills, targetRoleId }) {
  // If selectedSkills provided in body, save them first if studentId present
  let currentSkills = selectedSkills;
  if (studentId && Array.isArray(selectedSkills) && selectedSkills.length > 0) {
    currentSkills = await saveStudentSkills(studentId, selectedSkills);
  } else if (studentId && (!currentSkills || currentSkills.length === 0)) {
    currentSkills = await getStudentSkills(studentId);
  }

  if (!currentSkills || currentSkills.length === 0) {
    return {
      success: true,
      hasSkills: false,
      message: 'No skills selected. Select your known technologies to run career role analysis.',
      skillProfile: { totalSelected: 0, proficiencyDistribution: {}, categoryDistribution: {} },
      recommendations: [],
      topRole: null,
      roadmap: null,
      nextActions: [],
    };
  }

  // 1. Calculate role matches across all 12 IT roles
  const recommendations = await calculateRoleMatches(currentSkills);

  // 2. Determine target role (either specified by user or top recommendation)
  let targetRole = recommendations[0];
  if (targetRoleId) {
    const found = recommendations.find(r => r.roleId === targetRoleId);
    if (found) targetRole = found;
  }

  // 3. Generate Skill Profile summary
  const skillProfile = generateSkillProfile(currentSkills);

  // 4. Generate Personalized Learning Roadmap for target role
  const roadmap = await generatePersonalizedRoadmap(studentId, targetRole);

  // 5. Generate Top 3 Prioritized Next Actions
  const nextActions = generateNextActions(targetRole, skillProfile);

  // 6. Save analysis history if student is authenticated
  if (studentId) {
    try {
      const summaryPayload = {
        totalSkills: currentSkills.length,
        topRoleTitle: targetRole.title,
        topMatchScore: targetRole.matchPercentage,
        strongestCategories: skillProfile.strongestSkillAreas.map(s => s.category).slice(0, 3),
        criticalGapsCount: targetRole.missingRequiredSkills.length,
      };

      await queryCommon(
        `INSERT INTO student_skill_analysis_history 
         (student_id, selected_skills_count, analysis_summary, top_recommended_role_id, top_match_score)
         VALUES (?, ?, ?, ?, ?)`,
        [studentId, currentSkills.length, JSON.stringify(summaryPayload), targetRole.roleId, targetRole.matchPercentage]
      );
    } catch (histErr) {
      console.warn('[Skill Analyzer History Save Warning]:', histErr.message);
    }
  }

  return {
    success: true,
    hasSkills: true,
    analyzedAt: new Date().toISOString(),
    selectedSkillsCount: currentSkills.length,
    skillProfile,
    targetRole,
    recommendations,
    gapAnalysis: {
      roleId: targetRole.roleId,
      roleTitle: targetRole.title,
      matchedSkills: targetRole.matchedSkills,
      missingRequiredSkills: targetRole.missingRequiredSkills,
      missingOptionalSkills: targetRole.missingOptionalSkills,
      proficiencyGaps: targetRole.proficiencyGaps,
    },
    roadmap,
    nextActions,
  };
}

/**
 * Get student's analysis history
 */
async function getStudentAnalysisHistory(studentId) {
  if (!studentId) return [];

  const rows = await queryCommon(
    `SELECT * FROM student_skill_analysis_history 
     WHERE student_id = ? 
     ORDER BY created_at DESC 
     LIMIT 10`,
    [studentId]
  );

  return rows.map(r => ({
    id: r.id,
    selectedSkillsCount: r.selected_skills_count,
    topRoleId: r.top_recommended_role_id,
    topMatchScore: parseFloat(r.top_match_score),
    summary: typeof r.analysis_summary === 'string' ? JSON.parse(r.analysis_summary) : r.analysis_summary,
    createdAt: r.created_at,
  }));
}

/**
 * Update roadmap task progress
 */
async function updateRoadmapProgress(studentId, roleId, taskId, isCompleted) {
  if (!studentId || !roleId || !taskId) {
    throw new Error('studentId, roleId, and taskId are required.');
  }

  // Fetch existing record
  const rows = await queryCommon(
    'SELECT completed_tasks FROM student_learning_roadmaps WHERE student_id = ? AND role_id = ?',
    [studentId, roleId]
  );

  let completedTasks = [];
  if (rows.length > 0 && rows[0].completed_tasks) {
    completedTasks = typeof rows[0].completed_tasks === 'string'
      ? JSON.parse(rows[0].completed_tasks)
      : rows[0].completed_tasks;
  }

  const taskSet = new Set(completedTasks);
  if (isCompleted) {
    taskSet.add(taskId);
  } else {
    taskSet.delete(taskId);
  }

  const updatedTasks = Array.from(taskSet);

  await queryCommon(
    `INSERT INTO student_learning_roadmaps (student_id, role_id, completed_tasks)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE completed_tasks = VALUES(completed_tasks)`,
    [studentId, roleId, JSON.stringify(updatedTasks)]
  );

  return { success: true, completedTasks: updatedTasks };
}

/**
 * Get assessment quiz for a topic
 */
function getAssessmentQuestions(topic) {
  const bank = ASSESSMENT_BANKS[topic];
  if (!bank) {
    throw new Error(`Assessment topic "${topic}" not found. Available topics: ${Object.keys(ASSESSMENT_BANKS).join(', ')}`);
  }
  // Return questions without correctIndex to prevent cheating
  return bank.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options,
  }));
}

/**
 * Submit assessment answers and record verification
 */
async function submitAssessment({ studentId, topic, answers }) {
  const bank = ASSESSMENT_BANKS[topic];
  if (!bank) {
    throw new Error(`Assessment topic "${topic}" not found.`);
  }

  let correctCount = 0;
  const review = [];

  bank.forEach(q => {
    const studentAnswer = answers[q.id];
    const isCorrect = studentAnswer !== undefined && parseInt(studentAnswer, 10) === q.correctIndex;
    if (isCorrect) correctCount++;
    review.push({
      id: q.id,
      question: q.question,
      userAnswerIndex: studentAnswer !== undefined ? parseInt(studentAnswer, 10) : null,
      correctAnswerIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
    });
  });

  const totalQuestions = bank.length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const passed = scorePercent >= 60;

  // Persist attempt into student_skill_assessments
  if (studentId) {
    const verifiedSkills = TOPIC_SKILL_MAP[topic] || [];
    const primarySkillId = verifiedSkills[0] || 'problem-solving';

    await queryCommon(
      `INSERT INTO student_skill_assessments (student_id, skill_id, assessment_topic, score, max_score, passed)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [studentId, primarySkillId, topic, correctCount, totalQuestions, passed ? 1 : 0]
    );

    // If passed, mark relevant skills as verified in student_skills
    if (passed && verifiedSkills.length > 0) {
      for (const skillId of verifiedSkills) {
        await queryCommon(
          `INSERT INTO student_skills (student_id, skill_id, proficiency_level, evidence_type, is_verified, verified_at)
           VALUES (?, ?, 'INTERMEDIATE', 'ASSESSMENT', 1, NOW())
           ON DUPLICATE KEY UPDATE
             is_verified = 1,
             evidence_type = 'ASSESSMENT',
             verified_at = NOW()`,
          [studentId, skillId]
        );
      }
    }
  }

  return {
    success: true,
    topic,
    score: correctCount,
    maxScore: totalQuestions,
    percentage: scorePercent,
    passed,
    message: passed
      ? `Congratulations! You scored ${scorePercent}% and earned verified assessment credentials for ${topic}.`
      : `You scored ${scorePercent}%. A minimum of 60% is required to earn the verified badge. You can retake the quiz anytime.`,
    review,
  };
}

module.exports = {
  getSkillsCatalogue,
  getSkillCategories,
  getStudentSkills,
  saveStudentSkills,
  runSkillAnalysis,
  getStudentAnalysisHistory,
  generatePersonalizedRoadmap,
  updateRoadmapProgress,
  getAssessmentQuestions,
  submitAssessment,
  calculateRoleMatches,
};
