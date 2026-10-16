const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_COMMON_NAME || 'lms',
};

// Skill catalogue data matching UI specifications and screenshot
const SKILL_CATALOGUE = [
  // FRONTEND
  { id: 'react', name: 'React', category: 'Frontend', is_popular: true, description: 'Component-based library for building interactive user interfaces' },
  { id: 'angular', name: 'Angular', category: 'Frontend', is_popular: false, description: 'Enterprise-grade TypeScript web application framework' },
  { id: 'vue-js', name: 'Vue.js', category: 'Frontend', is_popular: false, description: 'Progressive JavaScript framework for modern web interfaces' },
  { id: 'next-js', name: 'Next.js', category: 'Frontend', is_popular: true, description: 'React framework for server-side rendering, static generation, and full-stack web' },
  { id: 'html', name: 'HTML', category: 'Frontend', is_popular: false, description: 'Standard markup language for documents designed for web browsers' },
  { id: 'css', name: 'CSS', category: 'Frontend', is_popular: false, description: 'Style sheet language for presentation and visual styling of web documents' },
  { id: 'tailwind-css', name: 'Tailwind CSS', category: 'Frontend', is_popular: true, description: 'Utility-first CSS framework for rapid responsive UI development' },
  { id: 'redux', name: 'Redux', category: 'Frontend', is_popular: false, description: 'Predictable state container for JavaScript apps' },
  { id: 'typescript-frontend', name: 'TypeScript (Frontend)', category: 'Frontend', is_popular: false, description: 'Type-safe JavaScript for robust frontend architectures' },

  // BACKEND
  { id: 'node-js', name: 'Node.js', category: 'Backend', is_popular: true, description: 'Asynchronous event-driven JavaScript runtime' },
  { id: 'express-js', name: 'Express.js', category: 'Backend', is_popular: true, description: 'Fast, unopinionated, minimalist web framework for Node.js' },
  { id: 'django', name: 'Django', category: 'Backend', is_popular: true, description: 'High-level Python web framework encouraging clean design' },
  { id: 'flask', name: 'Flask', category: 'Backend', is_popular: false, description: 'Lightweight WSGI Python micro web framework' },
  { id: 'fastapi', name: 'FastAPI', category: 'Backend', is_popular: false, description: 'High-performance Python web framework for building APIs with type hints' },
  { id: 'spring-boot', name: 'Spring Boot', category: 'Backend', is_popular: false, description: 'Enterprise Java framework for production-ready microservices' },
  { id: 'nest-js', name: 'NestJS', category: 'Backend', is_popular: false, description: 'Progressive TypeScript framework for building scalable server-side apps' },
  { id: 'asp-net-core', name: 'ASP.NET Core', category: 'Backend', is_popular: false, description: 'Cross-platform framework for building cloud-connected web services' },
  { id: 'rest-apis', name: 'REST APIs', category: 'Backend', is_popular: true, description: 'Architectural style for distributed hypermedia systems' },
  { id: 'graphql', name: 'GraphQL', category: 'Backend', is_popular: false, description: 'Query language for APIs and runtime for fulfilling queries' },

  // DATABASES
  { id: 'mongodb', name: 'MongoDB', category: 'Databases', is_popular: true, description: 'Document-oriented NoSQL database for flexible data schemas' },
  { id: 'mysql', name: 'MySQL', category: 'Databases', is_popular: true, description: 'Relational database management system using structured query language' },
  { id: 'postgresql', name: 'PostgreSQL', category: 'Databases', is_popular: true, description: 'Advanced open-source relational database with strong SQL compliance' },
  { id: 'redis', name: 'Redis', category: 'Databases', is_popular: true, description: 'In-memory data structure store used as database, cache, and message broker' },
  { id: 'firebase', name: 'Firebase', category: 'Databases', is_popular: false, description: 'Google cloud platform providing real-time NoSQL Firestore database' },
  { id: 'dynamodb', name: 'DynamoDB', category: 'Databases', is_popular: false, description: 'Amazon managed serverless key-value and document database' },
  { id: 'sqlite', name: 'SQLite', category: 'Databases', is_popular: false, description: 'Self-contained, serverless, zero-configuration SQL database engine' },
  { id: 'sql', name: 'SQL', category: 'Databases', is_popular: true, description: 'Standard language for storing, manipulating and retrieving data in databases' },

  // PROGRAMMING LANGUAGES
  { id: 'python', name: 'Python', category: 'Programming Languages', is_popular: true, description: 'Versatile high-level programming language for web, AI, and scripting' },
  { id: 'java', name: 'Java', category: 'Programming Languages', is_popular: true, description: 'Class-based, object-oriented language for enterprise applications' },
  { id: 'cpp', name: 'C++', category: 'Programming Languages', is_popular: false, description: 'High-performance systems programming language with generic features' },
  { id: 'javascript', name: 'JavaScript', category: 'Programming Languages', is_popular: true, description: 'Dynamic scripting language powering modern interactive web applications' },
  { id: 'typescript', name: 'TypeScript', category: 'Programming Languages', is_popular: false, description: 'Strongly typed programming language that builds on JavaScript' },
  { id: 'csharp', name: 'C#', category: 'Programming Languages', is_popular: false, description: 'Modern, object-oriented language designed by Microsoft for .NET' },
  { id: 'golang', name: 'Go (Golang)', category: 'Programming Languages', is_popular: false, description: 'Statically typed, compiled language engineered by Google for concurrency' },
  { id: 'rust', name: 'Rust', category: 'Programming Languages', is_popular: false, description: 'Systems programming language focused on safety, speed, and concurrency' },
  { id: 'problem-solving', name: 'Problem Solving', category: 'Programming Languages', is_popular: true, description: 'Data structures, algorithms, and computational problem solving' },

  // DEVOPS & CLOUD
  { id: 'docker', name: 'Docker', category: 'DevOps & Cloud', is_popular: true, description: 'Platform for developing, shipping, and running applications in containers' },
  { id: 'kubernetes', name: 'Kubernetes', category: 'DevOps & Cloud', is_popular: false, description: 'Container orchestration system for automating deployment and scaling' },
  { id: 'aws', name: 'AWS', category: 'DevOps & Cloud', is_popular: true, description: 'Amazon Web Services cloud computing platform' },
  { id: 'azure', name: 'Azure', category: 'DevOps & Cloud', is_popular: false, description: 'Microsoft cloud computing platform and services suite' },
  { id: 'gcp', name: 'Google Cloud (GCP)', category: 'DevOps & Cloud', is_popular: false, description: 'Suite of cloud computing services by Google' },
  { id: 'github-actions', name: 'GitHub Actions', category: 'DevOps & Cloud', is_popular: true, description: 'Continuous integration and continuous delivery (CI/CD) automation' },
  { id: 'terraform', name: 'Terraform', category: 'DevOps & Cloud', is_popular: false, description: 'Infrastructure as Code software tool for cloud provisioning' },
  { id: 'linux', name: 'Linux', category: 'DevOps & Cloud', is_popular: true, description: 'Open source operating system kernel and server administration' },
  { id: 'git', name: 'Git', category: 'DevOps & Cloud', is_popular: true, description: 'Distributed version control system for tracking source code changes' },

  // DATA SCIENCE & AI
  { id: 'pandas', name: 'Pandas', category: 'Data Science & AI', is_popular: false, description: 'Fast, powerful data analysis and manipulation library for Python' },
  { id: 'numpy', name: 'NumPy', category: 'Data Science & AI', is_popular: false, description: 'Fundamental package for scientific computing with multi-dimensional arrays' },
  { id: 'scikit-learn', name: 'Scikit-learn', category: 'Data Science & AI', is_popular: false, description: 'Machine learning library for classification, regression, and clustering' },
  { id: 'tensorflow', name: 'TensorFlow', category: 'Data Science & AI', is_popular: true, description: 'End-to-end open source platform for machine learning and deep learning' },
  { id: 'pytorch', name: 'PyTorch', category: 'Data Science & AI', is_popular: true, description: 'Optimized tensor library for deep learning using GPUs and CPUs' },
  { id: 'power-bi', name: 'Power BI', category: 'Data Science & AI', is_popular: true, description: 'Interactive data visualization software with business intelligence tools' },
  { id: 'tableau', name: 'Tableau', category: 'Data Science & AI', is_popular: false, description: 'Visual analytics platform transforming data into actionable insights' },
  { id: 'machine-learning', name: 'Machine Learning', category: 'Data Science & AI', is_popular: true, description: 'Statistical models and algorithms enabling computers to learn from data' },

  // CYBERSECURITY
  { id: 'cybersecurity-fundamentals', name: 'Cybersecurity Fundamentals', category: 'Cybersecurity', is_popular: false, description: 'Core principles of information security, CIA triad, and risk mitigation' },
  { id: 'network-security', name: 'Network Security', category: 'Cybersecurity', is_popular: false, description: 'Firewalls, VPNs, IDS/IPS, protocol analysis, and traffic monitoring' },
  { id: 'owasp-web-security', name: 'OWASP & Web Security', category: 'Cybersecurity', is_popular: false, description: 'Securing web applications against top vulnerabilities (XSS, SQLi, CSRF)' },
  { id: 'cryptography', name: 'Cryptography Basics', category: 'Cybersecurity', is_popular: false, description: 'Symmetric/asymmetric encryption, hashing, digital signatures, and PKI' },

  // TESTING & QA
  { id: 'automated-testing', name: 'Automated Testing / Jest / Cypress', category: 'Testing & QA', is_popular: false, description: 'Unit, integration, and end-to-end automated testing frameworks' },
  { id: 'selenium', name: 'Selenium / Playwright', category: 'Testing & QA', is_popular: false, description: 'Browser automation and cross-browser regression test suites' },
  { id: 'api-testing', name: 'API Testing (Postman)', category: 'Testing & QA', is_popular: false, description: 'Validation of endpoints, status codes, response payloads, and schemas' },

  // UI/UX DESIGN
  { id: 'figma', name: 'Figma / UI Design', category: 'UI/UX Design', is_popular: false, description: 'Collaborative web application for interface design and vector graphics' },
  { id: 'wireframing', name: 'Wireframing & Prototyping', category: 'UI/UX Design', is_popular: false, description: 'Creating user journey mockups, low/high-fidelity interactive prototypes' },
  { id: 'user-research', name: 'User Research & Usability', category: 'UI/UX Design', is_popular: false, description: 'Conducting user interviews, heuristic evaluations, and usability testing' },

  // OTHER
  { id: 'agile-scrum', name: 'Agile & Scrum', category: 'Other', is_popular: false, description: 'Iterative project management and sprint lifecycle methodologies' },
  { id: 'system-design', name: 'System Design', category: 'Other', is_popular: false, description: 'Architecture of high-concurrency, scalable, fault-tolerant distributed systems' },
];

// Role requirements with importance weights (4 = Core Required, 2 = Secondary/Important, 1 = Recommended/Bonus)
const ROLE_SKILL_REQUIREMENTS = [
  // 1. Frontend Developer
  { role_id: 'frontend-developer', skill_id: 'javascript', is_required: true, importance_weight: 4.0 },
  { role_id: 'frontend-developer', skill_id: 'react', is_required: true, importance_weight: 4.0 },
  { role_id: 'frontend-developer', skill_id: 'html', is_required: true, importance_weight: 3.5 },
  { role_id: 'frontend-developer', skill_id: 'css', is_required: true, importance_weight: 3.5 },
  { role_id: 'frontend-developer', skill_id: 'typescript', is_required: false, importance_weight: 3.0 },
  { role_id: 'frontend-developer', skill_id: 'tailwind-css', is_required: false, importance_weight: 2.5 },
  { role_id: 'frontend-developer', skill_id: 'next-js', is_required: false, importance_weight: 2.5 },
  { role_id: 'frontend-developer', skill_id: 'git', is_required: true, importance_weight: 3.0 },
  { role_id: 'frontend-developer', skill_id: 'rest-apis', is_required: true, importance_weight: 3.0 },
  { role_id: 'frontend-developer', skill_id: 'figma', is_required: false, importance_weight: 2.0 },
  { role_id: 'frontend-developer', skill_id: 'automated-testing', is_required: false, importance_weight: 2.0 },

  // 2. Backend Developer
  { role_id: 'backend-developer', skill_id: 'node-js', is_required: true, importance_weight: 4.0 },
  { role_id: 'backend-developer', skill_id: 'express-js', is_required: true, importance_weight: 3.5 },
  { role_id: 'backend-developer', skill_id: 'rest-apis', is_required: true, importance_weight: 4.0 },
  { role_id: 'backend-developer', skill_id: 'sql', is_required: true, importance_weight: 4.0 },
  { role_id: 'backend-developer', skill_id: 'postgresql', is_required: false, importance_weight: 3.0 },
  { role_id: 'backend-developer', skill_id: 'mongodb', is_required: false, importance_weight: 2.5 },
  { role_id: 'backend-developer', skill_id: 'redis', is_required: false, importance_weight: 2.5 },
  { role_id: 'backend-developer', skill_id: 'docker', is_required: false, importance_weight: 2.5 },
  { role_id: 'backend-developer', skill_id: 'git', is_required: true, importance_weight: 3.0 },
  { role_id: 'backend-developer', skill_id: 'system-design', is_required: false, importance_weight: 3.0 },
  { role_id: 'backend-developer', skill_id: 'python', is_required: false, importance_weight: 2.0 },
  { role_id: 'backend-developer', skill_id: 'java', is_required: false, importance_weight: 2.0 },

  // 3. Full Stack Developer
  { role_id: 'full-stack-developer', skill_id: 'javascript', is_required: true, importance_weight: 4.0 },
  { role_id: 'full-stack-developer', skill_id: 'react', is_required: true, importance_weight: 4.0 },
  { role_id: 'full-stack-developer', skill_id: 'node-js', is_required: true, importance_weight: 4.0 },
  { role_id: 'full-stack-developer', skill_id: 'sql', is_required: true, importance_weight: 3.5 },
  { role_id: 'full-stack-developer', skill_id: 'mongodb', is_required: false, importance_weight: 3.0 },
  { role_id: 'full-stack-developer', skill_id: 'typescript', is_required: false, importance_weight: 3.0 },
  { role_id: 'full-stack-developer', skill_id: 'git', is_required: true, importance_weight: 3.0 },
  { role_id: 'full-stack-developer', skill_id: 'rest-apis', is_required: true, importance_weight: 3.5 },
  { role_id: 'full-stack-developer', skill_id: 'docker', is_required: false, importance_weight: 2.5 },
  { role_id: 'full-stack-developer', skill_id: 'tailwind-css', is_required: false, importance_weight: 2.0 },

  // 4. Data Analyst
  { role_id: 'data-analyst', skill_id: 'sql', is_required: true, importance_weight: 4.5 },
  { role_id: 'data-analyst', skill_id: 'python', is_required: true, importance_weight: 4.0 },
  { role_id: 'data-analyst', skill_id: 'pandas', is_required: true, importance_weight: 3.5 },
  { role_id: 'data-analyst', skill_id: 'power-bi', is_required: true, importance_weight: 3.5 },
  { role_id: 'data-analyst', skill_id: 'tableau', is_required: false, importance_weight: 2.5 },
  { role_id: 'data-analyst', skill_id: 'numpy', is_required: false, importance_weight: 2.5 },
  { role_id: 'data-analyst', skill_id: 'problem-solving', is_required: true, importance_weight: 3.0 },

  // 5. Data Scientist
  { role_id: 'data-scientist', skill_id: 'python', is_required: true, importance_weight: 4.5 },
  { role_id: 'data-scientist', skill_id: 'pandas', is_required: true, importance_weight: 4.0 },
  { role_id: 'data-scientist', skill_id: 'numpy', is_required: true, importance_weight: 3.5 },
  { role_id: 'data-scientist', skill_id: 'scikit-learn', is_required: true, importance_weight: 4.0 },
  { role_id: 'data-scientist', skill_id: 'machine-learning', is_required: true, importance_weight: 4.0 },
  { role_id: 'data-scientist', skill_id: 'sql', is_required: true, importance_weight: 3.5 },
  { role_id: 'data-scientist', skill_id: 'tensorflow', is_required: false, importance_weight: 2.5 },

  // 6. AI / Machine Learning Engineer
  { role_id: 'ai-ml-engineer', skill_id: 'python', is_required: true, importance_weight: 4.5 },
  { role_id: 'ai-ml-engineer', skill_id: 'machine-learning', is_required: true, importance_weight: 4.5 },
  { role_id: 'ai-ml-engineer', skill_id: 'pytorch', is_required: true, importance_weight: 4.0 },
  { role_id: 'ai-ml-engineer', skill_id: 'tensorflow', is_required: false, importance_weight: 3.5 },
  { role_id: 'ai-ml-engineer', skill_id: 'numpy', is_required: true, importance_weight: 3.0 },
  { role_id: 'ai-ml-engineer', skill_id: 'pandas', is_required: true, importance_weight: 3.0 },
  { role_id: 'ai-ml-engineer', skill_id: 'docker', is_required: false, importance_weight: 2.5 },
  { role_id: 'ai-ml-engineer', skill_id: 'fastapi', is_required: false, importance_weight: 2.5 },

  // 7. Cybersecurity Analyst
  { role_id: 'cybersecurity-analyst', skill_id: 'cybersecurity-fundamentals', is_required: true, importance_weight: 4.5 },
  { role_id: 'cybersecurity-analyst', skill_id: 'network-security', is_required: true, importance_weight: 4.0 },
  { role_id: 'cybersecurity-analyst', skill_id: 'owasp-web-security', is_required: true, importance_weight: 3.5 },
  { role_id: 'cybersecurity-analyst', skill_id: 'linux', is_required: true, importance_weight: 3.5 },
  { role_id: 'cybersecurity-analyst', skill_id: 'cryptography', is_required: false, importance_weight: 3.0 },
  { role_id: 'cybersecurity-analyst', skill_id: 'python', is_required: false, importance_weight: 2.5 },

  // 8. Cloud Engineer
  { role_id: 'cloud-engineer', skill_id: 'aws', is_required: true, importance_weight: 4.0 },
  { role_id: 'cloud-engineer', skill_id: 'linux', is_required: true, importance_weight: 4.0 },
  { role_id: 'cloud-engineer', skill_id: 'docker', is_required: true, importance_weight: 3.5 },
  { role_id: 'cloud-engineer', skill_id: 'kubernetes', is_required: false, importance_weight: 3.0 },
  { role_id: 'cloud-engineer', skill_id: 'terraform', is_required: false, importance_weight: 3.0 },
  { role_id: 'cloud-engineer', skill_id: 'azure', is_required: false, importance_weight: 2.5 },
  { role_id: 'cloud-engineer', skill_id: 'git', is_required: true, importance_weight: 3.0 },

  // 9. DevOps Engineer
  { role_id: 'devops-engineer', skill_id: 'docker', is_required: true, importance_weight: 4.5 },
  { role_id: 'devops-engineer', skill_id: 'kubernetes', is_required: true, importance_weight: 4.0 },
  { role_id: 'devops-engineer', skill_id: 'linux', is_required: true, importance_weight: 4.0 },
  { role_id: 'devops-engineer', skill_id: 'github-actions', is_required: true, importance_weight: 3.5 },
  { role_id: 'devops-engineer', skill_id: 'terraform', is_required: false, importance_weight: 3.5 },
  { role_id: 'devops-engineer', skill_id: 'aws', is_required: false, importance_weight: 3.0 },
  { role_id: 'devops-engineer', skill_id: 'git', is_required: true, importance_weight: 3.5 },

  // 10. UI/UX Designer
  { role_id: 'ui-ux-designer', skill_id: 'figma', is_required: true, importance_weight: 5.0 },
  { role_id: 'ui-ux-designer', skill_id: 'wireframing', is_required: true, importance_weight: 4.0 },
  { role_id: 'ui-ux-designer', skill_id: 'user-research', is_required: true, importance_weight: 4.0 },
  { role_id: 'ui-ux-designer', skill_id: 'html', is_required: false, importance_weight: 2.0 },
  { role_id: 'ui-ux-designer', skill_id: 'css', is_required: false, importance_weight: 2.0 },

  // 11. Software Tester / QA Engineer
  { role_id: 'software-tester', skill_id: 'automated-testing', is_required: true, importance_weight: 4.5 },
  { role_id: 'software-tester', skill_id: 'selenium', is_required: true, importance_weight: 4.0 },
  { role_id: 'software-tester', skill_id: 'api-testing', is_required: true, importance_weight: 3.5 },
  { role_id: 'software-tester', skill_id: 'javascript', is_required: false, importance_weight: 3.0 },
  { role_id: 'software-tester', skill_id: 'git', is_required: true, importance_weight: 3.0 },
  { role_id: 'software-tester', skill_id: 'python', is_required: false, importance_weight: 2.5 },

  // 12. Mobile App Developer
  { role_id: 'mobile-app-developer', skill_id: 'react', is_required: true, importance_weight: 4.0 },
  { role_id: 'mobile-app-developer', skill_id: 'javascript', is_required: true, importance_weight: 4.0 },
  { role_id: 'mobile-app-developer', skill_id: 'typescript', is_required: false, importance_weight: 3.0 },
  { role_id: 'mobile-app-developer', skill_id: 'rest-apis', is_required: true, importance_weight: 3.5 },
  { role_id: 'mobile-app-developer', skill_id: 'git', is_required: true, importance_weight: 3.0 },
  { role_id: 'mobile-app-developer', skill_id: 'firebase', is_required: false, importance_weight: 2.5 },
];

async function runSkillAnalyzerMigration() {
  console.log('================================================================');
  console.log('🚀 [MIGRATION] Setting up Skill Analyzer tables and catalogue...');
  console.log('================================================================');

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // 1. Create tables
    await conn.query(`
      CREATE TABLE IF NOT EXISTS skills_catalogue (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        is_popular BOOLEAN DEFAULT FALSE,
        description VARCHAR(255),
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cat (category)
      ) ENGINE=InnoDB
    `);
    console.log('✓ Created table skills_catalogue');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS career_role_requirements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_id VARCHAR(64) NOT NULL,
        skill_id VARCHAR(64) NOT NULL,
        is_required BOOLEAN DEFAULT TRUE,
        importance_weight DECIMAL(3,1) DEFAULT 3.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_role_skill (role_id, skill_id),
        FOREIGN KEY (skill_id) REFERENCES skills_catalogue(id) ON DELETE CASCADE,
        INDEX idx_role (role_id)
      ) ENGINE=InnoDB
    `);
    console.log('✓ Created table career_role_requirements');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_skills (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        skill_id VARCHAR(64) NOT NULL,
        proficiency_level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT 'INTERMEDIATE',
        evidence_type ENUM('NONE', 'PROJECT', 'GITHUB', 'CERTIFICATION', 'ASSESSMENT') DEFAULT 'NONE',
        evidence_url VARCHAR(255),
        is_verified BOOLEAN DEFAULT FALSE,
        verified_by INT,
        verified_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_student_skill (student_id, skill_id),
        FOREIGN KEY (student_id) REFERENCES students_master(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills_catalogue(id) ON DELETE CASCADE,
        INDEX idx_student_skills (student_id)
      ) ENGINE=InnoDB
    `);
    console.log('✓ Created table student_skills');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_skill_assessments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        skill_id VARCHAR(64) NOT NULL,
        assessment_topic VARCHAR(100) NOT NULL,
        score INT NOT NULL,
        max_score INT NOT NULL,
        passed BOOLEAN DEFAULT TRUE,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students_master(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills_catalogue(id) ON DELETE CASCADE,
        INDEX idx_student_assess (student_id, skill_id)
      ) ENGINE=InnoDB
    `);
    console.log('✓ Created table student_skill_assessments');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_skill_analysis_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        selected_skills_count INT DEFAULT 0,
        analysis_summary JSON,
        top_recommended_role_id VARCHAR(64),
        top_match_score DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students_master(id) ON DELETE CASCADE,
        INDEX idx_student_hist (student_id)
      ) ENGINE=InnoDB
    `);
    console.log('✓ Created table student_skill_analysis_history');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_learning_roadmaps (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        role_id VARCHAR(64) NOT NULL,
        stage_progress JSON,
        completed_tasks JSON,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_student_role (student_id, role_id),
        FOREIGN KEY (student_id) REFERENCES students_master(id) ON DELETE CASCADE,
        INDEX idx_student_roadmap (student_id, role_id)
      ) ENGINE=InnoDB
    `);
    console.log('✓ Created table student_learning_roadmaps');

    // 2. Seed / Upsert Skills Catalogue
    console.log(`Seeding ${SKILL_CATALOGUE.length} skills into skills_catalogue...`);
    for (const skill of SKILL_CATALOGUE) {
      await conn.query(
        `INSERT INTO skills_catalogue (id, name, category, is_popular, description)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           name = VALUES(name),
           category = VALUES(category),
           is_popular = VALUES(is_popular),
           description = VALUES(description)`,
        [skill.id, skill.name, skill.category, skill.is_popular ? 1 : 0, skill.description]
      );
    }
    console.log(`✓ Seeded ${SKILL_CATALOGUE.length} skills.`);

    // 3. Seed / Upsert Role Skill Requirements
    console.log(`Seeding ${ROLE_SKILL_REQUIREMENTS.length} role requirements...`);
    for (const req of ROLE_SKILL_REQUIREMENTS) {
      await conn.query(
        `INSERT INTO career_role_requirements (role_id, skill_id, is_required, importance_weight)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           is_required = VALUES(is_required),
           importance_weight = VALUES(importance_weight)`,
        [req.role_id, req.skill_id, req.is_required ? 1 : 0, req.importance_weight]
      );
    }
    console.log(`✓ Seeded ${ROLE_SKILL_REQUIREMENTS.length} role skill requirements.`);

    // 4. Seed initial skills for demo student (student_id: 1, Aditya CSE)
    const [demoStudent] = await conn.query('SELECT id FROM students_master WHERE id = 1');
    if (demoStudent.length > 0) {
      const initialSkills = [
        { skill_id: 'fastapi', proficiency: 'INTERMEDIATE', evidence: 'NONE', verified: 0 },
        { skill_id: 'golang', proficiency: 'INTERMEDIATE', evidence: 'NONE', verified: 0 },
        { skill_id: 'typescript', proficiency: 'ADVANCED', evidence: 'PROJECT', verified: 1, url: 'https://github.com/aditya/enterprise-portal' },
        { skill_id: 'pandas', proficiency: 'INTERMEDIATE', evidence: 'NONE', verified: 0 },
        { skill_id: 'vue-js', proficiency: 'BEGINNER', evidence: 'NONE', verified: 0 },
        { skill_id: 'spring-boot', proficiency: 'INTERMEDIATE', evidence: 'NONE', verified: 0 },
        { skill_id: 'kubernetes', proficiency: 'INTERMEDIATE', evidence: 'NONE', verified: 0 },
        { skill_id: 'scikit-learn', proficiency: 'INTERMEDIATE', evidence: 'NONE', verified: 0 },
      ];

      for (const item of initialSkills) {
        await conn.query(
          `INSERT INTO student_skills (student_id, skill_id, proficiency_level, evidence_type, evidence_url, is_verified)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             proficiency_level = VALUES(proficiency_level),
             evidence_type = VALUES(evidence_type),
             evidence_url = VALUES(evidence_url),
             is_verified = VALUES(is_verified)`,
          [1, item.skill_id, item.proficiency, item.evidence, item.url || null, item.verified]
        );
      }
      console.log('✓ Seeded initial 8 selected skills for demo student (id: 1) matching screenshot!');
    }

    console.log('================================================================');
    console.log('✅ [MIGRATION COMPLETE] Skill Analyzer Database Ready!');
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    if (conn) await conn.end();
  }
}

if (require.main === module) {
  runSkillAnalyzerMigration().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runSkillAnalyzerMigration, SKILL_CATALOGUE, ROLE_SKILL_REQUIREMENTS };
