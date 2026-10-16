/**
 * CampusCorp IT Career Explorer - Master IT Roles & Domain Dataset
 * Unified single source of truth for Career Domains Catalog & Role Comparison.
 */

export const DOMAIN_CATEGORIES = [
  'All Domains',
  'Software Development',
  'Data Science & Analytics',
  'Artificial Intelligence & Machine Learning',
  'Cybersecurity',
  'Cloud Computing & DevOps',
  'UI/UX & Design',
  'Networking',
  'Testing & Quality Assurance',
  'Business Analysis',
  'Product Management',
  'Emerging Technologies',
];

export const ROLE_TAGS = [
  'Coding',
  'Non-Coding',
  'Creative',
  'Emerging',
  'Management',
  'Hybrid',
];

export const IT_ROLES = [
  {
    id: 'frontend-developer',
    title: 'Frontend Developer',
    category: 'Software Development',
    tags: ['Coding', 'Creative'],
    shortDescription: 'Builds responsive, high-performance web user interfaces using modern web frameworks, component architectures, and browser APIs.',
    responsibilities: [
      'Architect and construct fluid, accessible user interfaces using React, Vue, or Next.js.',
      'Transform Figma designs into clean, responsive HTML, CSS/Tailwind, and JavaScript components.',
      'Optimize web performance, Core Web Vitals, page load speeds, and bundle sizes.',
      'Integrate RESTful and GraphQL APIs with robust error handling and optimistic UI updates.',
      'Implement automated unit and integration tests using Jest, Vitest, and Cypress/Playwright.',
      'Ensure cross-browser compatibility and accessibility compliance (WCAG 2.1 AA standard).'
    ],
    scope: 'High demand across SaaS, e-commerce, consumer platforms, and enterprise digital transformations worldwide.',
    technicalSkills: [
      'JavaScript (ES6+)',
      'TypeScript',
      'React.js',
      'HTML5 & Semantic Web',
      'CSS3 & Tailwind CSS',
      'REST & GraphQL APIs',
      'State Management (Redux/Zustand)',
      'Web Performance & SEO',
      'Git Version Control'
    ],
    softSkills: [
      'Visual Aesthetic Sense',
      'Cross-Functional Collaboration',
      'Attention to Detail',
      'Empathy for End-Users',
      'Technical Communication'
    ],
    tools: [
      'VS Code',
      'Vite / Webpack',
      'Chrome DevTools',
      'Figma',
      'Postman',
      'GitHub / GitLab',
      'Vercel / Netlify'
    ],
    stats: {
      averageSalary: '₹5.5 - ₹16.0 LPA',
      jobOpenings: '42,000+ Active Roles',
      growthRate: '+19% YoY Growth'
    },
    projects: {
      beginner: [
        'Personal Portfolio Website with dark mode toggle & responsive layouts.',
        'Interactive Task & Habit Tracker with localStorage persistence.',
        'Real-time Weather Dashboard consuming OpenWeatherMap API.'
      ],
      intermediate: [
        'E-Commerce Storefront with cart management, filters, and Stripe checkout mock.',
        'Kanban Project Management Board with drag-and-drop mechanics (DnD).',
        'Social Media Feed with live comments, likes, and image uploads.'
      ],
      advanced: [
        'Full-fledged Collaborative Whiteboard / Code Editor using WebSockets.',
        'Micro-Frontend SaaS Dashboard with dynamic module federation.',
        'Custom Headless CMS Frontend with incremental static regeneration.'
      ]
    },
    certifications: [
      { name: 'Meta Front-End Developer Professional Certificate (Coursera)', type: 'PAID', provider: 'Meta' },
      { name: 'freeCodeCamp Responsive Web Design & JavaScript Algorithms', type: 'FREE', provider: 'freeCodeCamp' },
      { name: 'React - The Complete Guide (Udemy / Academind)', type: 'PAID', provider: 'Udemy' },
      { name: 'OpenJS Node.js Application Developer (JSNAD)', type: 'PAID', provider: 'OpenJS Foundation' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Foundations of the Web',
        skills: ['Semantic HTML5', 'CSS Grid & Flexbox', 'Core JavaScript (ES6+)', 'DOM Manipulation', 'Git Basics'],
        tools: ['VS Code', 'Chrome DevTools', 'Git & GitHub'],
        learningActivities: [
          'Master CSS layouts and responsive breakpoints without frameworks.',
          'Complete JavaScript algorithmic problems on LeetCode/HackerRank.',
          'Deploy 3 responsive static websites to GitHub Pages or Vercel.'
        ],
        projects: ['Responsive Product Landing Page', 'Calculator App', 'Interactive Quiz Platform'],
        description: 'Build confidence with vanilla web standards and core browser capabilities before adopting frameworks.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Modern Component Architectures & Frameworks',
        skills: ['React.js / Next.js', 'TypeScript Essentials', 'Tailwind CSS', 'API Integration', 'State Management'],
        tools: ['Vite', 'Postman', 'Tailwind CSS', 'npm / pnpm'],
        learningActivities: [
          'Refactor JavaScript codebases into strongly typed TypeScript components.',
          'Implement client-side routing, protected routes, and authentication state.',
          'Fetch and cache external REST APIs with TanStack Query.'
        ],
        projects: ['Movie Streaming UI with TMDB API', 'GitHub User Finder with Repository Analytics'],
        description: 'Specialize in building enterprise React applications with TypeScript and robust state governance.'
      },
      {
        stage: 'ADVANCED',
        title: 'Performance, Testing & Full Engineering Rigor',
        skills: ['Next.js App Router & SSR', 'Vitest & React Testing Library', 'CI/CD Pipelines', 'Web Vitals Optimization'],
        tools: ['Lighthouse', 'Cypress / Playwright', 'GitHub Actions', 'Storybook'],
        learningActivities: [
          'Audit and improve Core Web Vitals (LCP, FID, CLS) to 90+ score.',
          'Write comprehensive unit, integration, and E2E test suites.',
          'Design an isolated UI component library documented in Storybook.'
        ],
        projects: ['Full SaaS Analytics Dashboard with Charting', 'Real-time Chat App with WebSockets'],
        description: 'Elevate code quality with testing, performance profiling, and continuous deployment workflows.'
      },
      {
        stage: 'JOB READY',
        title: 'Interview Preparation & Production Deployment',
        skills: ['Frontend System Design', 'Data Structures & Algorithms', 'Web Security (CORS, XSS, CSRF)', 'Clean Architecture'],
        tools: ['Docker Basics', 'Sentry Monitoring', 'Vercel Analytics'],
        learningActivities: [
          'Practice frontend system design questions (e.g. Design Infinite Scroll, Auto-complete).',
          'Participate in mock technical interviews and behavioral rounds.',
          'Publish a polished portfolio featuring 3 production-grade capstone applications.'
        ],
        projects: ['Full-stack E-Commerce Enterprise Platform', 'Real-time Collaborative Whiteboard'],
        description: 'Prepare for top tier campus placement drives, technical screenings, and live coding challenges.'
      }
    ],
    industry: ['FinTech', 'E-Commerce', 'SaaS', 'EdTech', 'Healthcare', 'Media & Entertainment']
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer',
    category: 'Software Development',
    tags: ['Coding'],
    shortDescription: 'Engineers scalable server-side systems, high-throughput microservices, robust databases, and secure APIs powering modern software.',
    responsibilities: [
      'Design, construct, and maintain resilient RESTful and gRPC APIs.',
      'Architect relational (PostgreSQL, MySQL) and NoSQL (MongoDB, Redis) databases.',
      'Implement secure authentication, authorization (JWT, OAuth2), and cryptographic standards.',
      'Optimize query execution plans, database indexes, and server-side caching strategies.',
      'Ensure high service availability, fault tolerance, and horizontal scalability.',
      'Integrate message queues and asynchronous event workers (RabbitMQ, Kafka).'
    ],
    scope: 'Core pillar of all software backbones. High hiring across product companies, financial institutions, and cloud startups.',
    technicalSkills: [
      'Node.js / Express',
      'Java (Spring Boot) / Go / Python',
      'Relational Databases (PostgreSQL, MySQL)',
      'NoSQL (MongoDB, Redis)',
      'REST & gRPC Protocols',
      'Distributed Caching',
      'Message Queues (Kafka / RabbitMQ)',
      'Docker & Containerization',
      'Microservices Architecture'
    ],
    softSkills: [
      'Systematic Problem Solving',
      'Root Cause Analysis',
      'Architectural Reasoning',
      'Teamwork & Collaboration',
      'Reliability Under Pressure'
    ],
    tools: [
      'Postman / Insomnia',
      'Docker & Docker Compose',
      'DBeaver / DataGrip',
      'Git & CI/CD',
      'Redis CLI',
      'Grafana / Prometheus',
      'Linux Terminal'
    ],
    stats: {
      averageSalary: '₹6.0 - ₹18.0 LPA',
      jobOpenings: '38,500+ Active Roles',
      growthRate: '+21% YoY Growth'
    },
    projects: {
      beginner: [
        'Secure Authentication API with JWT, password hashing, and role permissions.',
        'CRUD Bookstore / Student Portal with MySQL and connection pooling.',
        'File Upload & Metadata Extraction Microservice with cloud storage.'
      ],
      intermediate: [
        'High-Concurrency Ticket Booking System with Redis locking and transactions.',
        'URL Shortener with custom analytics, rate limiting, and cache invalidation.',
        'Banking Transaction Engine with atomic ledger transfers and audit logging.'
      ],
      advanced: [
        'Distributed Event-Driven Order Processing System using Apache Kafka.',
        'Scalable Chat Backend supporting 10k concurrent WebSockets with Redis Pub/Sub.',
        'Multi-Tenant SaaS API Gateway with dynamic rate limiting and JWT verification.'
      ]
    },
    certifications: [
      { name: 'AWS Certified Developer - Associate', type: 'PAID', provider: 'Amazon Web Services' },
      { name: 'Oracle Certified Professional: Java SE Developer', type: 'PAID', provider: 'Oracle' },
      { name: 'PostgreSQL Database Administration (Coursera / edX)', type: 'FREE', provider: 'Coursera' },
      { name: 'Meta Back-End Developer Professional Certificate', type: 'PAID', provider: 'Meta' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Core Programming & Data Persistence',
        skills: ['Node.js or Python or Java', 'SQL & Relational Schema Design', 'HTTP Protocol & REST Basics', 'Git Version Control'],
        tools: ['VS Code', 'Postman', 'MySQL / PostgreSQL CLI'],
        learningActivities: [
          'Build standard CRUD applications without heavy ORMs to grasp raw SQL queries.',
          'Understand HTTP status codes, headers, cookies, and CORS.',
          'Implement basic authentication using bcrypt and session tokens.'
        ],
        projects: ['Student Management REST API', 'Note Taking Web Service with SQLite'],
        description: 'Understand how server computers receive HTTP requests, parse payloads, and interact with persistent disks.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Production APIs, Caching & Security',
        skills: ['JWT & OAuth2', 'Redis In-Memory Caching', 'Database Indexing & Normalization', 'Docker Containerization'],
        tools: ['Docker', 'Redis', 'DBeaver', 'Jest / Mocha'],
        learningActivities: [
          'Benchmark API response times with and without Redis caching layer.',
          'Containerize your API and database using Docker Compose.',
          'Implement request rate limiting, schema validation, and standardized error envelopes.'
        ],
        projects: ['E-Commerce Product Catalog API with Caching', 'Rate-Limited Authentication Service'],
        description: 'Transform basic scripts into secure, resilient server services ready for load.'
      },
      {
        stage: 'ADVANCED',
        title: 'Distributed Systems & Asynchronous Workers',
        skills: ['Message Brokers (Kafka/RabbitMQ)', 'Microservices Architecture', 'Database Sharding & Replication', 'Monitoring'],
        tools: ['Kafka', 'Kubernetes Basics', 'Prometheus', 'Grafana'],
        learningActivities: [
          'Decouple heavy tasks (email sending, image processing) with asynchronous message queues.',
          'Configure database read replicas and manage connection pool saturation.',
          'Instrument services with structured logging and Prometheus metrics.'
        ],
        projects: ['Distributed Notification Engine', 'Event-Driven Ride Hailing Matcher'],
        description: 'Tackle high throughput, distributed transactions, and decoupled architectural patterns.'
      },
      {
        stage: 'JOB READY',
        title: 'Backend System Design & Concurrency Mastery',
        skills: ['System Design (CAP Theorem, ACID vs BASE)', 'Load Balancing & Gateways', 'Performance Tuning'],
        tools: ['JMeter / k6', 'Linux Server Profilers'],
        learningActivities: [
          'Design scalable architectures for WhatsApp, TinyURL, and Netflix streaming.',
          'Solve concurrency race conditions using pessimistic and optimistic database locks.',
          'Participate in mock backend system design and coding whiteboard rounds.'
        ],
        projects: ['High-Concurrency Flash Sale Backend with k6 Benchmarks'],
        description: 'Demonstrate architectural maturity, scalability awareness, and deep engineering fundamentals.'
      }
    ],
    industry: ['Banking & FinTech', 'Enterprise Cloud', 'Logistics', 'Gaming', 'Healthcare', 'Government IT']
  },
  {
    id: 'full-stack-developer',
    title: 'Full Stack Developer',
    category: 'Software Development',
    tags: ['Coding', 'Hybrid'],
    shortDescription: 'Master of end-to-end software delivery, bridging intuitive user interfaces with robust backend architectures, APIs, and cloud deployments.',
    responsibilities: [
      'Design, develop, and deliver complete web applications from database schemas to interactive client interfaces.',
      'Bridge the gap between product requirements, UX design, and server infrastructure.',
      'Implement end-to-end data pipelines, real-time WebSocket updates, and server-side rendering.',
      'Manage CI/CD deployment pipelines, cloud provisioning, and container environments.',
      'Troubleshoot performance bottlenecks across frontend rendering, network latency, and database queries.',
      'Maintain code hygiene, architectural integrity, and automated test coverage across full stack.'
    ],
    scope: 'Highest volume of placement drives across startups, mid-sized product companies, and multinational tech giants.',
    technicalSkills: [
      'React / Next.js / Angular',
      'Node.js / Express / Spring Boot',
      'TypeScript (Full-Stack)',
      'PostgreSQL & MongoDB',
      'REST & GraphQL APIs',
      'Docker & Cloud Hosting',
      'Authentication & RBAC',
      'State Management & Caching',
      'DevOps CI/CD Basics'
    ],
    softSkills: [
      'Holistic Product Thinking',
      'Agile Adaptability',
      'Ownership Mindset',
      'Rapid Prototyping',
      'Effective Cross-Domain Communication'
    ],
    tools: [
      'VS Code',
      'Git & GitHub Actions',
      'Docker',
      'Postman',
      'Supabase / Firebase',
      'AWS / Render / Vercel',
      'Linux'
    ],
    stats: {
      averageSalary: '₹6.5 - ₹19.5 LPA',
      jobOpenings: '51,000+ Active Roles',
      growthRate: '+23% YoY Growth'
    },
    projects: {
      beginner: [
        'Personal Blog with Markdown CMS, commenting system, and admin login.',
        'Student Task Management Board with real-time status and tag filters.',
        'Expense Tracker with monthly budgeting charts and CSV export.'
      ],
      intermediate: [
        'Team Collaboration Workspace with live chat, task boards, and file attachments.',
        'Campus Placement Management Portal with company drives, resume uploads, and student statuses.',
        'Social Media Platform with follower graphs, notifications, and feed algorithms.'
      ],
      advanced: [
        'Multi-Vendor E-Commerce SaaS with stripe payments, vendor portals, and inventory sync.',
        'Real-time Collaborative Code Editor with video call meet and instant code execution.',
        'AI-Powered Resume Analyzer with candidate score ranking and job match engine.'
      ]
    },
    certifications: [
      { name: 'Meta Full-Stack Developer Certificate (Coursera)', type: 'PAID', provider: 'Meta' },
      { name: 'freeCodeCamp Full Stack Developer Certification', type: 'FREE', provider: 'freeCodeCamp' },
      { name: 'AWS Certified Cloud Practitioner', type: 'PAID', provider: 'AWS' },
      { name: 'The Complete 2026 Web Development Bootcamp', type: 'PAID', provider: 'Udemy' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Full Stack Fundamentals',
        skills: ['HTML5, CSS3, Modern JS', 'Node.js & Express Basics', 'Relational SQL & CRUD', 'Git & Command Line'],
        tools: ['VS Code', 'Git', 'Postman', 'Node.js'],
        learningActivities: [
          'Build end-to-end CRUD web applications with traditional server-rendered templates.',
          'Connect Node.js backends to MySQL or PostgreSQL databases with structured queries.',
          'Push clean repositories to GitHub with informative README documentation.'
        ],
        projects: ['Full-stack Recipe Catalog with Image Uploads', 'CRUD Bookstore with MySQL'],
        description: 'Understand the entire lifecycle of an HTTP request from browser click to server database write.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Modern SPA & REST API Architecture',
        skills: ['React.js + TypeScript', 'JWT Authentication & Cookies', 'ORM/Prisma or Mongoose', 'Tailwind CSS'],
        tools: ['Vite', 'Docker Basics', 'Prisma ORM', 'GitHub Actions'],
        learningActivities: [
          'Build a decoupled Single Page Application communicating with a separate REST backend.',
          'Implement secure role-based access control (Student vs Recruiter vs Admin).',
          'Deploy frontend to Vercel/Netlify and backend to Render/AWS EC2.'
        ],
        projects: ['Campus Event Registration System with QR Code Tickets', 'Kanban Board with Drag & Drop'],
        description: 'Master decoupled client-server architecture with strongly typed data models.'
      },
      {
        stage: 'ADVANCED',
        title: 'Cloud Deployment, Next.js & Scaling',
        skills: ['Next.js Full Stack (App Router)', 'WebSockets (Socket.io)', 'Redis Caching & Sessions', 'Docker Compose'],
        tools: ['Docker', 'AWS S3 & RDS', 'Redis', 'Vitest'],
        learningActivities: [
          'Migrate a multi-page app to Next.js with Server Components and Server Actions.',
          'Build real-time bidirectional communication features using WebSockets.',
          'Containerize the entire stack (Client, Server, Database, Cache) into Docker Compose.'
        ],
        projects: ['Real-time Collaborative Workspace with Whiteboard', 'Multi-tenant SaaS Dashboard'],
        description: 'Combine high frontend responsiveness with cloud-native backend resilience.'
      },
      {
        stage: 'JOB READY',
        title: 'End-to-End System Design & Capstone Delivery',
        skills: ['System Design & Microservices', 'CI/CD Automation', 'Security Audits & Monitoring', 'Interview Whiteboarding'],
        tools: ['Sentry', 'Kubernetes / ECS', 'k6 Load Testing'],
        learningActivities: [
          'Perform load testing to identify bottlenecks and optimize database queries.',
          'Present a full-stack capstone project explaining trade-offs and architectural decisions.',
          'Master full-stack interview questions (DSA + System Design + Live Debugging).'
        ],
        projects: ['Enterprise Placement Portal with Multi-tier Security & Realtime Video'],
        description: 'Stand out as an autonomous, high-velocity engineer capable of delivering production value immediately.'
      }
    ],
    industry: ['Tech Startups', 'FinTech', 'SaaS', 'E-Commerce', 'Consulting & IT Services', 'HealthTech']
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    category: 'Data Science & Analytics',
    tags: ['Non-Coding', 'Hybrid'],
    shortDescription: 'Transforms raw operational numbers into actionable business intelligence, interactive dashboards, and executive insights.',
    responsibilities: [
      'Extract, sanitize, and validate massive datasets from relational databases, ERPs, and cloud data warehouses.',
      'Design and deploy automated executive KPI dashboards using Power BI and Tableau.',
      'Perform exploratory data analysis (EDA) using SQL and Python (Pandas/NumPy).',
      'Translate fuzzy business questions into quantitative metrics and statistical hypotheses.',
      'Present data findings and strategic recommendations to non-technical stakeholders.',
      'Collaborate with data engineering teams to maintain clean data pipelines and governance.'
    ],
    scope: 'Pervasive across every modern company. Crucial for marketing, sales, finance, operations, and product analytics.',
    technicalSkills: [
      'Advanced SQL (Window Functions, CTEs)',
      'Data Visualization (Power BI / Tableau)',
      'Python for Analytics (Pandas, NumPy)',
      'Excel & Power Query',
      'Descriptive & Inferential Statistics',
      'Data Cleaning & ETL Basics',
      'A/B Testing Methodologies',
      'Business KPI Formulation'
    ],
    softSkills: [
      'Data Storytelling',
      'Commercial Acumen',
      'Critical Thinking',
      'Executive Presentation',
      'Inquisitive Curiosity'
    ],
    tools: [
      'Power BI',
      'Tableau Desktop',
      'MySQL / PostgreSQL',
      'Jupyter Notebook',
      'Microsoft Excel / Google Sheets',
      'Snowflake / BigQuery',
      'Git'
    ],
    stats: {
      averageSalary: '₹4.5 - ₹12.5 LPA',
      jobOpenings: '34,000+ Active Roles',
      growthRate: '+18% YoY Growth'
    },
    projects: {
      beginner: [
        'Interactive Sales Performance Dashboard in Power BI with dynamic slicers.',
        'Exploratory Data Analysis of Netflix content library using Pandas and Seaborn.',
        'Customer Churn Analysis in Excel with Pivot Tables and conditional forecasting.'
      ],
      intermediate: [
        'E-Commerce Customer Lifetime Value (CLV) & Cohort Retention Analysis in SQL.',
        'Supply Chain Inventory Optimization Model with automated reorder alerting.',
        'Campus Placement Historical Trends Dashboard visualizing salary distributions by branch.'
      ],
      advanced: [
        'Automated End-to-End ETL Pipeline in Python writing clean data to Snowflake.',
        'A/B Testing Statistical Validation Tool analyzing conversion rate uplifts.',
        'Financial Fraud Anomaly Detection Dashboard with real-time alerting.'
      ]
    },
    certifications: [
      { name: 'Google Data Analytics Professional Certificate (Coursera)', type: 'PAID', provider: 'Google' },
      { name: 'Microsoft Certified: Power BI Data Analyst Associate (PL-300)', type: 'PAID', provider: 'Microsoft' },
      { name: 'freeCodeCamp Data Analysis with Python', type: 'FREE', provider: 'freeCodeCamp' },
      { name: 'SQL for Data Science (UC Davis / Coursera)', type: 'FREE', provider: 'Coursera' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Spreadsheets & Fundamental SQL',
        skills: ['Advanced Excel (VLOOKUP, INDEX/MATCH, Pivot)', 'Basic to Intermediate SQL', 'Descriptive Statistics'],
        tools: ['Excel / Google Sheets', 'MySQL Workbench', 'DB Fiddle'],
        learningActivities: [
          'Clean messy tabular datasets with Excel Power Query and text formulas.',
          'Write multi-table SQL JOINs, GROUP BY aggregations, and subqueries.',
          'Understand mean, median, variance, and standard deviation distributions.'
        ],
        projects: ['Retail Store Sales Report in Excel', 'Library Management SQL Database Query Suite'],
        description: 'Build mathematical fluency and learn to navigate tabular relational databases with ease.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Business Intelligence & Python Analytics',
        skills: ['Power BI / Tableau DAX', 'Python (Pandas, NumPy, Matplotlib)', 'Advanced SQL (Window Functions)'],
        tools: ['Power BI Desktop', 'Tableau Public', 'Jupyter Notebooks'],
        learningActivities: [
          'Build interactive multi-page dashboards featuring drill-throughs and DAX measures.',
          'Perform automated data cleansing and outlier detection using Pandas DataFrames.',
          'Publish a public Tableau portfolio showcasing interactive visualizations.'
        ],
        projects: ['Global COVID-19 / Healthcare Trends Dashboard', 'HR Employee Attrition Diagnostic'],
        description: 'Combine visual storytelling with programmable data manipulation.'
      },
      {
        stage: 'ADVANCED',
        title: 'Cloud Warehouses, Modeling & A/B Testing',
        skills: ['Snowflake / Google BigQuery', 'A/B Testing & Hypothesis Testing', 'Data Modeling (Star Schema)', 'ETL Pipelines'],
        tools: ['BigQuery', 'dbt (Data Build Tool)', 'GitHub'],
        learningActivities: [
          'Design dimensional data models (Fact and Dimension tables) for enterprise queries.',
          'Evaluate statistical significance (p-values, confidence intervals) in product experiments.',
          'Automate daily report generation scripts scheduled with cron or cloud functions.'
        ],
        projects: ['SaaS Subscription Cohort & Churn Model in BigQuery', 'E-Commerce Marketing ROI Dashboard'],
        description: 'Operate at enterprise data warehouse scale and drive high-stakes strategic decisions.'
      },
      {
        stage: 'JOB READY',
        title: 'Executive Presentation & Case Studies',
        skills: ['Business Case Solving', 'Executive Data Storytelling', 'Portfolio Presentation', 'SQL Live Interview Challenges'],
        tools: ['Tableau Public Portfolio', 'Loom / Presentation Slides'],
        learningActivities: [
          'Practice SQL live coding challenges (LeetCode Medium SQL queries).',
          'Record 5-minute video walkthroughs explaining business implications of data insights.',
          'Prepare for consulting and analytics business scenario case study rounds.'
        ],
        projects: ['End-to-End Enterprise Placement Performance & NIRF Data Story'],
        description: 'Bridge deep numerical insights with persuasive executive communication.'
      }
    ],
    industry: ['Retail & E-Commerce', 'BFSI & Banking', 'Management Consulting', 'Telecommunications', 'Healthcare', 'EdTech']
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    category: 'Data Science & Analytics',
    tags: ['Coding', 'Hybrid'],
    shortDescription: 'Combines mathematical rigor, statistical modeling, machine learning, and programming to extract predictive intelligence from complex datasets.',
    responsibilities: [
      'Formulate business problems into mathematical machine learning models.',
      'Perform feature engineering, feature selection, and dimensional reduction.',
      'Train, cross-validate, and evaluate predictive regression and classification models.',
      'Deploy inference models into production microservices via FastAPI or Flask.',
      'Conduct rigorous statistical experiments and causal inference studies.',
      'Monitor model drift, accuracy degradation, and retraining pipelines in production.'
    ],
    scope: 'Critical for predictive analytics, personalized recommendations, fraud detection, and algorithmic decision making.',
    technicalSkills: [
      'Python & R Programming',
      'Machine Learning (Scikit-Learn, XGBoost)',
      'Deep Learning Foundations (PyTorch/TensorFlow)',
      'Advanced Mathematics & Linear Algebra',
      'Statistical Modeling & Causal Inference',
      'Feature Engineering & Data Preprocessing',
      'SQL & Big Data Tools (PySpark)',
      'Model Deployment (FastAPI, Docker)'
    ],
    softSkills: [
      'Scientific Skepticism',
      'Intellectual Curiosity',
      'Hypothesis Formulation',
      'Collaborative Research',
      'Business Value Translation'
    ],
    tools: [
      'JupyterLab / Google Colab',
      'PyTorch / Scikit-Learn',
      'FastAPI / Streamlit',
      'Docker',
      'MLflow',
      'Git & DVC',
      'PostgreSQL / Snowflake'
    ],
    stats: {
      averageSalary: '₹7.5 - ₹22.0 LPA',
      jobOpenings: '28,000+ Active Roles',
      growthRate: '+24% YoY Growth'
    },
    projects: {
      beginner: [
        'Housing Price Prediction Model using Linear Regression and Scikit-Learn.',
        'Credit Card Default Risk Classifier with Random Forests and ROC analysis.',
        'Customer Segmentation Clustering with K-Means and PCA visualization.'
      ],
      intermediate: [
        'Predictive Medical Diagnosis Classifier deployed as a live Streamlit web app.',
        'Time-Series Stock / Sales Demand Forecasting with ARIMA and Prophet.',
        'Movie Recommender System using Collaborative Filtering and Matrix Factorization.'
      ],
      advanced: [
        'Real-time Credit Card Fraud Detection Pipeline handling streaming transactions.',
        'End-to-End MLOps Pipeline with MLflow tracking, automated retraining, and Docker API.',
        'Multi-modal Sentiment Analysis Engine processing text reviews and user images.'
      ]
    },
    certifications: [
      { name: 'IBM Data Science Professional Certificate (Coursera)', type: 'PAID', provider: 'IBM' },
      { name: 'DeepLearning.AI Machine Learning Specialization', type: 'PAID', provider: 'DeepLearning.AI' },
      { name: 'Kaggle Machine Learning Competitions & Micro-Courses', type: 'FREE', provider: 'Kaggle' },
      { name: 'AWS Certified Machine Learning - Specialty', type: 'PAID', provider: 'AWS' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Math, Statistics & Python Foundations',
        skills: ['Linear Algebra & Multivariate Calculus', 'Probability & Statistics', 'Python for Scientific Computing', 'SQL'],
        tools: ['Jupyter Notebook', 'NumPy', 'Pandas', 'Matplotlib / Seaborn'],
        learningActivities: [
          'Master matrix operations, eigenvectors, gradients, and probability distributions.',
          'Clean, reshape, and impute missing values across complex real-world datasets.',
          'Complete introductory Kaggle beginner competitions (Titanic, Housing Prices).'
        ],
        projects: ['Exploratory Data Analysis on Healthcare Outcomes', 'Automated Data Quality Profiler'],
        description: 'Build mathematical foundations that prevent machine learning from being a black box.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Classical Machine Learning & Feature Engineering',
        skills: ['Scikit-Learn', 'XGBoost & LightGBM', 'Cross-Validation & Hyperparameter Tuning', 'Feature Selection'],
        tools: ['Scikit-Learn', 'Optuna', 'Streamlit', 'Git'],
        learningActivities: [
          'Implement decision trees, random forests, SVMs, and gradient boosted trees.',
          'Diagnose overfitting versus underfitting using bias-variance tradeoff curves.',
          'Build an interactive Streamlit app allowing users to input variables and receive predictions.'
        ],
        projects: ['Loan Default Risk Predictor Web App', 'Customer Churn Classification Engine'],
        description: 'Produce high-performing predictive models evaluated against rigorous business metrics.'
      },
      {
        stage: 'ADVANCED',
        title: 'Deep Learning, Big Data & Model Serving',
        skills: ['PyTorch Foundations', 'PySpark / Big Data', 'REST API Model Serving (FastAPI)', 'Docker Containerization'],
        tools: ['PyTorch', 'FastAPI', 'Docker', 'MLflow'],
        learningActivities: [
          'Train neural networks for tabular and unstructured data using PyTorch.',
          'Wrap trained weights into a low-latency FastAPI endpoint containerized with Docker.',
          'Track experiment parameters, metrics, and model artifacts with MLflow.'
        ],
        projects: ['Containerized Image Classifier API with Docker', 'Scalable PySpark Customer Clustering Pipeline'],
        description: 'Transition models from research notebooks to scalable production endpoints.'
      },
      {
        stage: 'JOB READY',
        title: 'MLOps, Product Integration & Portfolio',
        skills: ['MLOps Best Practices', 'A/B Testing ML Models', 'Model Monitoring & Drift Detection', 'ML System Design'],
        tools: ['DVC', 'Cloud ML Platforms (AWS SageMaker / GCP Vertex)', 'GitHub Actions'],
        learningActivities: [
          'Design end-to-end ML architectures (e.g. Design YouTube Recommendation System).',
          'Set up automated CI/CD retraining triggered when data drift exceeds thresholds.',
          'Publish a documented GitHub portfolio with reproducible Docker environments.'
        ],
        projects: ['End-to-End Enterprise Predictive Maintenance System with MLflow'],
        description: 'Qualify for prestigious data science roles with demonstrated production capability.'
      }
    ],
    industry: ['FinTech & Insurance', 'HealthTech & Biotech', 'Automotive & Autonomous Systems', 'E-Commerce', 'Aerospace']
  },
  {
    id: 'ai-ml-engineer',
    title: 'AI / Machine Learning Engineer',
    category: 'Artificial Intelligence & Machine Learning',
    tags: ['Coding', 'Emerging'],
    shortDescription: 'Builds, fine-tunes, and deploys cutting-edge deep learning, LLMs, Computer Vision, and Generative AI systems at production scale.',
    responsibilities: [
      'Architect, fine-tune, and deploy Large Language Models (LLMs) and diffusion architectures.',
      'Construct Retrieval-Augmented Generation (RAG) pipelines with vector databases and semantic search.',
      'Optimize neural network inference latency using TensorRT, ONNX, and model quantization (INT8/4).',
      'Manage high-performance GPU training clusters and distributed training jobs.',
      'Design agentic workflows, function-calling pipelines, and autonomous AI agents.',
      'Implement safety guardrails, hallucination evaluators, and ethical AI monitoring.'
    ],
    scope: 'Fastest growing discipline in modern computer science with massive compensation packages and global demand.',
    technicalSkills: [
      'Python & C++',
      'PyTorch / Hugging Face Transformers',
      'Generative AI & LLM Fine-Tuning (LoRA / QLoRA)',
      'RAG & Vector Databases (Chroma, Pinecone)',
      'Agentic Frameworks (LangChain, LangGraph)',
      'Model Quantization & Inference Optimization',
      'Docker & Kubernetes for AI',
      'MLOps & GPU Acceleration (CUDA Basics)'
    ],
    softSkills: [
      'Research-to-Production Velocity',
      'Algorithmic Intuition',
      'Ethical Responsibility',
      'Continuous Fast Learning',
      'Clear Technical Writing'
    ],
    tools: [
      'Hugging Face Hub',
      'PyTorch',
      'LangChain / LlamaIndex',
      'ChromaDB / Pinecone',
      'vLLM / Ollama',
      'Weights & Biases',
      'NVIDIA CUDA Toolkit'
    ],
    stats: {
      averageSalary: '₹8.0 - ₹26.0 LPA',
      jobOpenings: '26,500+ Active Roles',
      growthRate: '+38% YoY Growth'
    },
    projects: {
      beginner: [
        'Custom Knowledge Q&A Chatbot using OpenAI API, LangChain, and Streamlit.',
        'Handwritten Digit Classifier using Convolutional Neural Networks (CNNs) in PyTorch.',
        'Sentiment & Named Entity Recognition pipeline using Hugging Face pipelines.'
      ],
      intermediate: [
        'Production RAG Knowledge Assistant over PDF documents with ChromaDB and hybrid search.',
        'Open-Source LLM (Llama 3 / Mistral) Local Serving Engine with streaming tokens and quantization.',
        'Computer Vision Real-time Object Tracking and Counting system using YOLOv8.'
      ],
      advanced: [
        'Enterprise Autonomous Agent with multi-tool calling, SQL generation, and code sandbox execution.',
        'Fine-Tuned Specialized Medical / Legal LLM using QLoRA with evaluation benchmarks.',
        'High-Throughput Distributed LLM Inference Cluster serving 500 requests/sec with vLLM.'
      ]
    },
    certifications: [
      { name: 'DeepLearning.AI Deep Learning Specialization (Andrew Ng)', type: 'PAID', provider: 'DeepLearning.AI' },
      { name: 'Hugging Face NLP Course Certification', type: 'FREE', provider: 'Hugging Face' },
      { name: 'AWS Certified Machine Learning - Specialty', type: 'PAID', provider: 'AWS' },
      { name: 'NVIDIA Deep Learning Institute (DLI) Fundamentals', type: 'PAID', provider: 'NVIDIA' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Deep Learning & Neural Network Foundations',
        skills: ['Linear Algebra & PyTorch Basics', 'Feedforward Neural Networks', 'Backpropagation & Optimizers', 'Loss Functions'],
        tools: ['PyTorch', 'Google Colab GPU', 'Hugging Face Transformers'],
        learningActivities: [
          'Code forward and backward passes from scratch to understand gradient descent.',
          'Train your first multi-layer perceptron on image and text classification datasets.',
          'Explore pre-trained vision and language models from Hugging Face.'
        ],
        projects: ['Handwritten Digit Recognizer in PyTorch', 'Text Sentiment Classifier with DistilBERT'],
        description: 'Understand the mathematical mechanics of neural weights, loss functions, and backpropagation.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Generative AI, RAG & Vector Databases',
        skills: ['Embeddings & Vector Search', 'RAG Architecture', 'LangChain / LlamaIndex', 'Prompt Engineering & Few-Shot'],
        tools: ['ChromaDB', 'Ollama', 'FastAPI', 'LangChain'],
        learningActivities: [
          'Construct a document chunking, embedding, and semantic similarity search pipeline.',
          'Run quantized open-weights LLMs locally on personal hardware with Ollama.',
          'Build guardrails against prompt injections and hallucinated answers.'
        ],
        projects: ['Campus Academic Handbook RAG Chatbot with Citations', 'Automated Code Review Agent'],
        description: 'Harness state-of-the-art foundation models to build enterprise knowledge applications.'
      },
      {
        stage: 'ADVANCED',
        title: 'Model Fine-Tuning & Inference Optimization',
        skills: ['Parameter-Efficient Fine-Tuning (PEFT/LoRA)', 'Model Quantization (GGUF, AWQ, INT4)', 'vLLM & TensorRT', 'Evaluation (RAGAS)'],
        tools: ['Unsloth / Trl', 'Weights & Biases', 'Docker', 'vLLM'],
        learningActivities: [
          'Fine-tune an open LLM on domain-specific conversational pairs using LoRA on a cloud GPU.',
          'Benchmark token-per-second latency across FP16, INT8, and INT4 quantized models.',
          'Establish quantitative evaluation harnesses measuring faithfulness and context recall.'
        ],
        projects: ['Domain-Specific Legal / Medical Fine-Tuned Model', 'High-Speed LLM Inference Server with vLLM'],
        description: 'Optimize model performance, memory footprint, and deployment economics.'
      },
      {
        stage: 'JOB READY',
        title: 'AI Systems Architecture & Autonomous Agents',
        skills: ['Autonomous Agent Workflows (LangGraph)', 'Distributed Training (DeepSpeed)', 'AI Safety & Governance'],
        tools: ['Kubernetes for GPUs', 'Triton Inference Server'],
        learningActivities: [
          'Architect multi-agent collaboration systems capable of planning, reflection, and tool execution.',
          'Practice AI System Design interview scenarios (e.g. Design Enterprise Copilot at Scale).',
          'Deploy a production AI system with continuous observability, feedback loops, and token tracking.'
        ],
        projects: ['Full Autonomous Enterprise Data Analyst Agent with Live SQL & Plot Generation'],
        description: 'Position yourself at the forefront of the generative AI revolution.'
      }
    ],
    industry: ['Artificial Intelligence Labs', 'Enterprise SaaS', 'Autonomous Vehicles', 'Robotics', 'FinTech', 'Defense & Aerospace']
  },
  {
    id: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    category: 'Cybersecurity',
    tags: ['Hybrid', 'Coding'],
    shortDescription: 'Defends digital assets, networks, and cloud infrastructures against intrusions, ransomware, vulnerabilities, and cyber threats.',
    responsibilities: [
      'Monitor Security Operations Center (SOC) telemetry, SIEM alerts, and network anomalies.',
      'Perform vulnerability assessments, penetration testing, and risk mitigations across applications.',
      'Investigate security incidents, conduct digital forensics, and produce incident response reports.',
      'Implement zero-trust security architectures, multi-factor authentication, and endpoint detection.',
      'Audit organizational compliance against NIST, ISO 27001, and GDPR security standards.',
      'Conduct phishing simulations and security awareness training for campus or corporate staff.'
    ],
    scope: 'Critical national security and enterprise corporate defense priority. Zero unemployment rate globally.',
    technicalSkills: [
      'Network Security & Protocols (TCP/IP, DNS, SSL/TLS)',
      'SIEM Tools (Splunk, Elastic SIEM)',
      'Vulnerability Scanning (Nessus, Nmap)',
      'Linux Security & Bash Scripting',
      'Python for Security Automation',
      'Web Application Security (OWASP Top 10)',
      'Incident Response & Digital Forensics',
      'Cloud Security Basics (AWS / Azure)'
    ],
    softSkills: [
      'Investigative Mindset',
      'Ethical Integrity',
      'Crisis Composure',
      'Analytical Tenacity',
      'Discreet Confidentiality'
    ],
    tools: [
      'Wireshark',
      'Splunk / Elastic',
      'Burp Suite',
      'Metasploit',
      'Nmap',
      'Kali Linux',
      'Snort / Suricata'
    ],
    stats: {
      averageSalary: '₹5.5 - ₹17.0 LPA',
      jobOpenings: '31,000+ Active Roles',
      growthRate: '+32% YoY Growth'
    },
    projects: {
      beginner: [
        'Home Lab Network Packet Analysis with Wireshark identifying unencrypted credentials.',
        'Automated Port & Vulnerability Scanner written in Python using Nmap libraries.',
        'Secure Password Vault & Authenticator with AES-256 encryption.'
      ],
      intermediate: [
        'SOC Home Lab with Elastic SIEM analyzing simulated brute-force and malware attacks.',
        'OWASP Top 10 Web Application Penetration Test Report on DVWA (Damn Vulnerable Web App).',
        'Automated Incident Response Triage Script quarantining compromised endpoints.'
      ],
      advanced: [
        'Enterprise Zero Trust Network Access Architecture with Cloudflare and WireGuard.',
        'Custom Memory Forensics & Rootkit Extraction Tool analyzing Windows kernel dumps.',
        'Automated Phishing Analysis Sandbox extracting malicious URLs and payloads safely.'
      ]
    },
    certifications: [
      { name: 'CompTIA Security+ (SY0-701)', type: 'PAID', provider: 'CompTIA' },
      { name: 'Certified Ethical Hacker (CEH) / eJPT', type: 'PAID', provider: 'EC-Council / INE' },
      { name: 'Google Cybersecurity Professional Certificate (Coursera)', type: 'PAID', provider: 'Google' },
      { name: 'TryHackMe & HackTheBox Cyber Badges', type: 'FREE', provider: 'TryHackMe' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Networking & Operating System Security',
        skills: ['TCP/IP Model, Subnetting & Routing', 'Linux CLI & Administration', 'Cryptography Basics (Hashing, Symmetric, Asymmetric)'],
        tools: ['Kali Linux', 'Wireshark', 'VirtualBox / VMware', 'Nmap'],
        learningActivities: [
          'Inspect raw network packets in Wireshark and decode HTTP, DNS, and ARP traffic.',
          'Configure a Linux server with strict iptables firewall rules and SSH keys.',
          'Complete introductory rooms on TryHackMe (Pre-Security path).'
        ],
        projects: ['Local Network Reconnaissance Scanner in Python', 'Home Lab Setup with Ubuntu & Kali'],
        description: 'Understand how computers communicate and how attackers identify exposed vulnerabilities.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Defensive Operations, SIEM & Web Security',
        skills: ['SIEM Alert Triage (Splunk)', 'OWASP Top 10 Web Vulnerabilities', 'Log Analysis & Threat Intelligence', 'Bash/Python Scripting'],
        tools: ['Splunk', 'Burp Suite Community', 'Snort IDS', 'OWASP ZAP'],
        learningActivities: [
          'Deploy Splunk on a virtual machine and ingest Windows Event Logs and Apache logs.',
          'Exploit and remediate SQL Injection and XSS flaws on vulnerable web applications.',
          'Write Python scripts to parse authentication logs and detect brute force attempts.'
        ],
        projects: ['SIEM Detection Lab with Simulated Attacks', 'OWASP Vulnerability Audit Portfolio'],
        description: 'Build capabilities to detect active adversary intrusions and protect web applications.'
      },
      {
        stage: 'ADVANCED',
        title: 'Incident Response, Forensics & Cloud Defense',
        skills: ['Digital Forensics (Autopsy, Volatility)', 'Incident Response Lifecycle (NIST)', 'Cloud Security (IAM, GuardDuty)', 'Malware Analysis Basics'],
        tools: ['Volatility', 'Autopsy', 'AWS CloudTrail', 'Ghidra Basics'],
        learningActivities: [
          'Extract volatile memory artifacts and analyze injected DLLs from memory dumps.',
          'Conduct mock incident response simulations following the NIST containment protocol.',
          'Audit AWS IAM permission policies and enforce least-privilege access.'
        ],
        projects: ['Memory Forensics Investigation Case Study', 'Automated Cloud Security Compliance Scanner'],
        description: 'Master incident response to mitigate enterprise damage during live breaches.'
      },
      {
        stage: 'JOB READY',
        title: 'SOC Blue Team Mastery & Security Governance',
        skills: ['SOC Analyst Workflows', 'MITRE ATT&CK Framework Mapping', 'Security Policies (ISO 27001, SOC 2)', 'Technical Interview Scenarios'],
        tools: ['TheHive', 'MISP Threat Intel', 'Cisco Packet Tracer'],
        learningActivities: [
          'Map adversary tactics to the MITRE ATT&CK matrix and author custom detection rules.',
          'Prepare for technical SOC interview questions (e.g. How do you triage a ransomware alert?).',
          'Attain an industry recognized certificate (CompTIA Security+ or BTL1).'
        ],
        projects: ['Comprehensive Enterprise Threat Intelligence & Incident Response Plan'],
        description: 'Step into corporate SOCs and defense teams with practical, hands-on crisis experience.'
      }
    ],
    industry: ['Banking & Financial Services', 'Defense & Aerospace', 'Government & Public Sector', 'Healthcare', 'Consulting (Big 4)']
  },
  {
    id: 'cloud-engineer',
    title: 'Cloud Engineer',
    category: 'Cloud Computing & DevOps',
    tags: ['Coding', 'Hybrid'],
    shortDescription: 'Designs, provisions, and administers highly resilient, cost-efficient, and secure multi-cloud architectures across AWS, Azure, and GCP.',
    responsibilities: [
      'Architect and deploy highly available, fault-tolerant infrastructure on AWS, Azure, or GCP.',
      'Write Infrastructure as Code (IaC) using Terraform and AWS CloudFormation.',
      'Configure cloud networking: VPCs, subnets, route tables, NAT gateways, and VPN peering.',
      'Manage cloud security, IAM roles, encryption keys (KMS), and compliance audits.',
      'Implement auto-scaling policies, load balancers, and multi-region disaster recovery.',
      'Monitor infrastructure expenditure and optimize cloud resource utilization.'
    ],
    scope: 'Universal infrastructure shift. Every enterprise is either migrating to or scaling inside cloud platforms.',
    technicalSkills: [
      'Cloud Providers (AWS / Azure / GCP)',
      'Infrastructure as Code (Terraform)',
      'Linux Administration & Networking',
      'Docker & Container Orchestration',
      'Virtual Private Clouds (VPC, Subnetting)',
      'Cloud Security & IAM Best Practices',
      'Serverless Architectures (AWS Lambda)',
      'Cost Management & Cloud FinOps'
    ],
    softSkills: [
      'Architectural Foresight',
      'Cost-Conscious Optimization',
      'Systematic Documentation',
      'Calm Troubleshooting',
      'Collaborative Engineering'
    ],
    tools: [
      'AWS Management Console / CLI',
      'Terraform',
      'Docker',
      'Kubernetes Basics',
      'CloudWatch / Datadog',
      'Git & CI/CD',
      'Bash / Python'
    ],
    stats: {
      averageSalary: '₹6.5 - ₹19.0 LPA',
      jobOpenings: '36,000+ Active Roles',
      growthRate: '+26% YoY Growth'
    },
    projects: {
      beginner: [
        'Static Website hosted on AWS S3 with CloudFront CDN distribution and custom SSL.',
        'High-Availability Web Server Cluster behind an Application Load Balancer with Auto-Scaling.',
        'Automated S3 Backup Script written in Python using Boto3 SDK.'
      ],
      intermediate: [
        'Complete Multi-Tier AWS VPC Infrastructure provisioned 100% through Terraform.',
        'Serverless REST API using AWS Lambda, API Gateway, and DynamoDB.',
        'Automated Disaster Recovery Replication Pipeline between two AWS geographic regions.'
      ],
      advanced: [
        'Production Elastic Kubernetes Service (EKS) Cluster with auto-scaling and ingress controllers.',
        'Cloud Cost Optimization Engine identifying idle resources and applying spot instances.',
        'Enterprise Zero-Trust Cloud Architecture with Transit Gateway and centralized logging.'
      ]
    },
    certifications: [
      { name: 'AWS Certified Solutions Architect - Associate', type: 'PAID', provider: 'Amazon Web Services' },
      { name: 'Microsoft Certified: Azure Fundamentals (AZ-900) & Administrator (AZ-104)', type: 'PAID', provider: 'Microsoft' },
      { name: 'HashiCorp Certified: Terraform Associate', type: 'PAID', provider: 'HashiCorp' },
      { name: 'AWS Cloud Quest & Skill Builder Free Badges', type: 'FREE', provider: 'AWS' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Linux, Networking & Cloud Essentials',
        skills: ['Linux System Administration', 'CIDR Blocks & IP Subnetting', 'Core Cloud Concepts (IaaS, PaaS, SaaS)', 'AWS Free Tier Services'],
        tools: ['AWS Free Tier', 'Bash', 'SSH', 'Linux Terminal'],
        learningActivities: [
          'Launch and SSH into an Amazon EC2 Linux instance and configure an NGINX web server.',
          'Understand IAM Users, Groups, Roles, Policies, and multi-factor authentication.',
          'Host a static site on Amazon S3 with public read policies and CloudFront CDN.'
        ],
        projects: ['Secure EC2 Web Server with S3 Asset Storage', 'Linux Server Hardening Script'],
        description: 'Grasp foundational infrastructure and cloud economics without unnecessary overhead.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Infrastructure as Code & Cloud Networking',
        skills: ['Terraform Fundamentals', 'Custom VPC Architecture', 'Relational Database Service (RDS)', 'Serverless (Lambda)'],
        tools: ['Terraform CLI', 'AWS CLI', 'Python Boto3', 'VS Code'],
        learningActivities: [
          'Provision a production-grade VPC with public/private subnets and NAT gateways via Terraform.',
          'Write Python Boto3 scripts to automate snapshot backups and cleanup routines.',
          'Implement an event-driven serverless workflow triggered by S3 uploads.'
        ],
        projects: ['Modular Terraform AWS VPC Deployment', 'Serverless Thumbnail Generator with AWS Lambda'],
        description: 'Treat infrastructure as version-controlled software code rather than manual clicks.'
      },
      {
        stage: 'ADVANCED',
        title: 'Containers, Kubernetes & Security Hardening',
        skills: ['Amazon EKS / ECS', 'Secrets Management (AWS Secrets Manager/KMS)', 'CloudWatch & Monitoring', 'Disaster Recovery (RTO/RPO)'],
        tools: ['Docker', 'kubectl', 'Prometheus', 'Terraform Cloud'],
        learningActivities: [
          'Deploy containerized microservices to Amazon ECS or Elastic Kubernetes Service.',
          'Configure centralized logging and alert alarms with AWS CloudWatch and SNS.',
          'Design active-passive failover mechanisms using Route 53 DNS health checks.'
        ],
        projects: ['Production Microservices Cluster on AWS EKS', 'Multi-Region Disaster Recovery Demo'],
        description: 'Deploy resilient container workloads capable of self-healing and zero-downtime upgrades.'
      },
      {
        stage: 'JOB READY',
        title: 'Cloud Solutions Architecture & Cost Optimization',
        skills: ['Well-Architected Framework (Reliability, Security, Cost, Performance)', 'FinOps', 'Interview Architecture Whiteboarding'],
        tools: ['AWS Infracost', 'Lucidchart / Draw.io'],
        learningActivities: [
          'Audit architectures against the AWS Well-Architected Framework 6 Pillars.',
          'Practice explaining complex high-availability trade-offs during live technical interviews.',
          'Achieve the AWS Solutions Architect Associate credential.'
        ],
        projects: ['Enterprise Full-Stack Cloud Architecture Capstone with Cost Analysis'],
        description: 'Prepare to design enterprise-grade cloud ecosystems for Fortune 500 organizations.'
      }
    ],
    industry: ['Enterprise SaaS', 'Cloud Consulting', 'Banking & FinTech', 'Telecom', 'Government & Defense', 'E-Commerce']
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    category: 'Cloud Computing & DevOps',
    tags: ['Coding', 'Hybrid'],
    shortDescription: 'Unifies software development and IT operations through automated CI/CD pipelines, container orchestration, and site reliability engineering.',
    responsibilities: [
      'Design, maintain, and automate Continuous Integration & Continuous Delivery (CI/CD) pipelines.',
      'Orchestrate production container clusters using Kubernetes, Helm, and GitOps (ArgoCD).',
      'Implement Site Reliability Engineering (SRE) practices, SLOs, SLIs, and error budgets.',
      'Deploy observability stacks: Prometheus, Grafana, Jaeger distributed tracing, and ELK/Loki.',
      'Automate configuration management using Ansible, Bash, and Python scripts.',
      'Enforce DevSecOps practices: automated vulnerability scanning in pull requests.'
    ],
    scope: 'Tremendous industry demand. DevOps engineers command premium salaries due to cross-disciplinary expertise.',
    technicalSkills: [
      'CI/CD Pipelines (GitHub Actions, Jenkins, GitLab CI)',
      'Containerization (Docker)',
      'Container Orchestration (Kubernetes)',
      'Infrastructure as Code (Terraform)',
      'Configuration Management (Ansible)',
      'Linux Kernel & Shell Scripting',
      'Observability (Prometheus, Grafana, ELK)',
      'GitOps (ArgoCD / Flux)'
    ],
    softSkills: [
      'Automation Mindset',
      'Blameless Post-Mortem Culture',
      'Rapid Incident Triage',
      'Cross-Team Empathy',
      'Proactive Prevention'
    ],
    tools: [
      'Docker & Docker Compose',
      'Kubernetes (k8s)',
      'GitHub Actions / Jenkins',
      'ArgoCD',
      'Prometheus & Grafana',
      'Terraform',
      'Ansible'
    ],
    stats: {
      averageSalary: '₹7.0 - ₹21.0 LPA',
      jobOpenings: '39,000+ Active Roles',
      growthRate: '+28% YoY Growth'
    },
    projects: {
      beginner: [
        'Automated GitHub Actions CI Workflow running linters, tests, and building Docker images.',
        'Multi-stage Dockerfile optimization reducing container image size by 75%.',
        'Bash Automation Suite for automated server health checks and Slack alerting.'
      ],
      intermediate: [
        'End-to-End GitOps Deployment Pipeline using ArgoCD and Kubernetes on a local Minikube cluster.',
        'Production Observability Stack with Prometheus alerts, Grafana dashboards, and Loki logs.',
        'Zero-Downtime Blue/Green and Canary Deployment configuration using NGINX / Istio.'
      ],
      advanced: [
        'Multi-Cluster Kubernetes Disaster Recovery Automation across multiple cloud regions.',
        'DevSecOps Pipeline with automated SonarQube static analysis, Trivy image scans, and Snyk audit.',
        'Self-Healing Infrastructure Operator in Go reacting to pod out-of-memory errors automatically.'
      ]
    },
    certifications: [
      { name: 'Certified Kubernetes Administrator (CKA)', type: 'PAID', provider: 'Linux Foundation / CNCF' },
      { name: 'Certified Kubernetes Application Developer (CKAD)', type: 'PAID', provider: 'Linux Foundation' },
      { name: 'Docker Certified Associate (DCA)', type: 'PAID', provider: 'Docker' },
      { name: 'freeCodeCamp Docker & Kubernetes Full Course', type: 'FREE', provider: 'freeCodeCamp' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Linux, Scripting & Docker Mastery',
        skills: ['Advanced Linux & Bash', 'Git Branching Strategies', 'Docker Containerization', 'Multi-stage Docker Builds'],
        tools: ['Docker Desktop', 'Ubuntu Server', 'Git & GitHub', 'Bash'],
        learningActivities: [
          'Master Docker commands: build, run, exec, volumes, and custom bridge networks.',
          'Write multi-stage Dockerfiles for Node.js, Go, or Python to minimize attack surface.',
          'Automate routine developer tasks using parameterized Bash scripts.'
        ],
        projects: ['Optimized Production Dockerfile Suite', 'Automated Server Setup Script with Bash'],
        description: 'Establish the container packaging foundation that powers modern microservices.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'CI/CD Automation & Infrastructure as Code',
        skills: ['GitHub Actions / GitLab CI', 'Terraform Infrastructure Provisioning', 'Artifact Registries (Docker Hub, GHCR)', 'Automated Testing Gates'],
        tools: ['GitHub Actions', 'Terraform', 'Postman / Newman', 'SonarQube'],
        learningActivities: [
          'Build a continuous integration workflow that triggers tests on pull requests and publishes images.',
          'Use Terraform to spin up cloud virtual machines and network firewalls automatically.',
          'Implement branch protection rules enforcing passing CI builds before merging.'
        ],
        projects: ['Production GitHub Actions CI/CD Pipeline', 'Automated Cloud Provisioning with Terraform'],
        description: 'Eliminate manual deployments through deterministic, automated continuous integration.'
      },
      {
        stage: 'ADVANCED',
        title: 'Kubernetes Orchestration & Observability',
        skills: ['Kubernetes (Pods, Deployments, Services, Ingress)', 'Helm Package Manager', 'Prometheus & Grafana', 'GitOps with ArgoCD'],
        tools: ['Kubernetes (Minikube / k3s)', 'Helm', 'ArgoCD', 'Prometheus'],
        learningActivities: [
          'Deploy a multi-tier microservices app to a local Kubernetes cluster using Helm charts.',
          'Set up ArgoCD to synchronize Kubernetes cluster state directly with Git commits.',
          'Build custom Grafana dashboards tracking CPU, memory saturation, and 99th percentile latencies.'
        ],
        projects: ['GitOps Driven Microservices on Kubernetes with ArgoCD', 'Full Observability Stack with Alerts'],
        description: 'Orchestrate hundreds of containers with auto-scaling, load balancing, and self-healing.'
      },
      {
        stage: 'JOB READY',
        title: 'Site Reliability Engineering (SRE) & DevSecOps',
        skills: ['SRE Principles (SLOs, SLIs, Error Budgets)', 'Canary & Blue/Green Deployments', 'DevSecOps Vulnerability Scanning', 'Chaos Engineering'],
        tools: ['Trivy', 'Chaos Mesh', 'Datadog / Dynatrace'],
        learningActivities: [
          'Inject simulated network failures using Chaos Engineering and verify automatic recovery.',
          'Embed security scanners (Trivy, OWASP dependency check) directly into pull request checks.',
          'Prepare for CKA exam and live Kubernetes troubleshooting interviews.'
        ],
        projects: ['Enterprise Self-Healing SRE Platform with Automated Chaos Engineering'],
        description: 'Achieve the pinnacle of reliability engineering demanded by top tech enterprises.'
      }
    ],
    industry: ['Tech Startups', 'Cloud Infrastructure Giants', 'FinTech & Banking', 'Gaming', 'Telecom & Media']
  },
  {
    id: 'ui-ux-designer',
    title: 'UI/UX Designer',
    category: 'UI/UX & Design',
    tags: ['Creative', 'Non-Coding'],
    shortDescription: 'Crafts intuitive, visually captivating, and human-centered digital experiences through user research, wireframing, design systems, and usability testing.',
    responsibilities: [
      'Conduct user interviews, field research, and usability testing to uncover friction points.',
      'Design user personas, empathy maps, customer journey maps, and information architectures.',
      'Build low-fidelity wireframes, high-fidelity prototypes, and design systems in Figma.',
      'Ensure digital accessibility (WCAG 2.1 AA) across contrast ratios, typography, and interactive targets.',
      'Collaborate closely with frontend engineers to ensure pixel-perfect design implementation.',
      'Continuously iterate designs using qualitative feedback and quantitative behavioral analytics (Hotjar/Mixpanel).'
    ],
    scope: 'Essential for every digital product. Good UX is the #1 differentiator for consumer apps, SaaS, and campus tools.',
    technicalSkills: [
      'Figma & Auto-Layout Mastery',
      'Design Systems & Component Libraries',
      'User Research & Usability Testing',
      'Information Architecture & Wireframing',
      'Interactive Prototyping & Micro-Interactions',
      'Responsive Web & Mobile Guidelines (Material / HIG)',
      'Accessibility Standards (WCAG 2.1)',
      'Basic HTML/CSS Understanding'
    ],
    softSkills: [
      'Empathetic Listening',
      'Storytelling & Design Critique',
      'Visual Aesthetic Refinement',
      'Iterative Humility',
      'Persuasive Presentation'
    ],
    tools: [
      'Figma',
      'FigJam',
      'Adobe XD / Illustrator',
      'Miro',
      'Lottie / Spline (3D)',
      'Hotjar',
      'Notion'
    ],
    stats: {
      averageSalary: '₹5.0 - ₹15.0 LPA',
      jobOpenings: '22,000+ Active Roles',
      growthRate: '+17% YoY Growth'
    },
    projects: {
      beginner: [
        'Redesign of a Confusing Campus Portal or Local Restaurant Website in Figma.',
        'Personal Portfolio Case Study demonstrating user problem definition and final UI.',
        'Mobile Habit Tracking App wireframe with complete user onboarding flows.'
      ],
      intermediate: [
        'Comprehensive Multi-Device Design System in Figma with tokens, components, and variants.',
        'FinTech Mobile Banking App with biometric verification and transaction tracking case study.',
        'SaaS Analytics Dashboard UI with dark/light themes and customizable widgets.'
      ],
      advanced: [
        'End-to-End Campus Placement Ecosystem redesign with user testing validation recordings.',
        'Healthcare Telemedicine Experience optimized for elderly accessibility and low vision.',
        'Micro-Interactions and 3D Spline interactive landing page prototype.'
      ]
    },
    certifications: [
      { name: 'Google UX Design Professional Certificate (Coursera)', type: 'PAID', provider: 'Google' },
      { name: 'Interaction Design Foundation (IxDF) Certified Designer', type: 'PAID', provider: 'IxDF' },
      { name: 'Figma Community Design System & Auto-Layout Tutorials', type: 'FREE', provider: 'Figma' },
      { name: 'CalArts Graphic Design Specialization (Coursera)', type: 'PAID', provider: 'CalArts' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Design Principles & Figma Basics',
        skills: ['Visual Hierarchy & Typography', 'Color Theory & Contrast', 'Figma Basics (Frames, Shapes, Pen Tool)', 'Information Architecture'],
        tools: ['Figma', 'FigJam', 'Coolors / Adobe Color'],
        learningActivities: [
          'Study typography pairings, 8pt spacing grids, and color psychology.',
          'Replicate existing award-winning apps (Spotify, Airbnb) in Figma to learn layouts.',
          'Understand user personas and draw pencil paper wireframes.'
        ],
        projects: ['Food Delivery Mobile Wireframe', 'Landing Page Re-creation in Figma'],
        description: 'Develop an eye for clean visual hierarchy, balanced whitespace, and crisp typography.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Figma Components, Prototyping & User Research',
        skills: ['Figma Auto-Layout & Variants', 'Interactive Clickable Prototypes', 'User Interview Methodologies', 'WCAG Accessibility Standards'],
        tools: ['Figma Advanced', 'Miro', 'Maze (Usability Testing)'],
        learningActivities: [
          'Build flexible components with nested auto-layout, boolean properties, and variants.',
          'Conduct 5 user usability testing interviews and record screen interactions.',
          'Audit designs against WCAG color contrast calculators (aiming for 4.5:1 ratio).'
        ],
        projects: ['Complete Design System with 40+ Components', 'FinTech Mobile App with Interactive Prototype'],
        description: 'Transition from drawing static screens to constructing scalable design systems.'
      },
      {
        stage: 'ADVANCED',
        title: 'Design Systems, Micro-Interactions & Metrics',
        skills: ['Design Tokens (Variables)', 'Micro-Animations (Smart Animate)', 'Developer Handoff', 'Product Metrics (UX KPIs)'],
        tools: ['Figma Variables', 'LottieFiles', 'Zeplin / Storybook Basics'],
        learningActivities: [
          'Configure Figma variable modes for instant Light/Dark mode and brand switching.',
          'Create smooth micro-interactions (e.g. toggle switches, pull to refresh, card expands).',
          'Prepare annotated developer handoff specs with redlines and component states.'
        ],
        projects: ['SaaS Dashboard with Responsive Breakpoints and Dark Mode', 'E-Commerce Checkout Flow Redesign'],
        description: 'Collaborate seamlessly with frontend engineers to bring designs to life without compromise.'
      },
      {
        stage: 'JOB READY',
        title: 'Case Study Storytelling & Portfolio Review',
        skills: ['Case Study Writing', 'Design Critique Defensibility', 'UX Strategy', 'Live Whiteboard Design Challenge'],
        tools: ['Notion / Webflow Portfolio', 'Figma Slides'],
        learningActivities: [
          'Publish 2-3 deep, end-to-end case studies detailing research, wireframes, iterations, and metrics.',
          'Practice 45-minute whiteboard design challenges frequently used in big tech interviews.',
          'Present your design portfolio with articulate justifications for design trade-offs.'
        ],
        projects: ['Comprehensive Campus Placement Portal UX Redesign Case Study'],
        description: 'Win high-paying design roles through compelling evidence-based case studies.'
      }
    ],
    industry: ['Consumer Apps (B2C)', 'B2B SaaS', 'Digital Design Agencies', 'FinTech', 'E-Commerce', 'EdTech']
  },
  {
    id: 'software-tester',
    title: 'Software Tester / QA Engineer',
    category: 'Testing & Quality Assurance',
    tags: ['Hybrid', 'Coding'],
    shortDescription: 'Ensures software reliability, security, and performance through automated test suites, regression testing, and quality governance.',
    responsibilities: [
      'Formulate comprehensive test plans, test cases, and acceptance criteria from functional specs.',
      'Develop automated UI test suites using Selenium, Cypress, or Playwright.',
      'Construct automated API test scripts using Postman, RestAssured, or PyTest.',
      'Conduct performance, load, and stress testing using Apache JMeter or k6.',
      'Track, log, and triage defects in Jira with reproducible steps and diagnostic logs.',
      'Collaborate with developers and DevOps engineers to integrate tests into CI/CD build gates.'
    ],
    scope: 'Essential safeguard before every production release. Crucial in regulated sectors like banking, aviation, and healthcare.',
    technicalSkills: [
      'Test Automation (Playwright, Cypress, Selenium)',
      'API Testing (Postman, RestAssured)',
      'Programming (Java / Python / JavaScript)',
      'Performance Testing (JMeter, k6)',
      'SQL for Backend Verification',
      'CI/CD Test Integration',
      'Test Case Management (Jira, Zephyr)',
      'Security & Exploratory Testing'
    ],
    softSkills: [
      'Meticulous Eye for Edge Cases',
      'Tenacious Problem Hunting',
      'Constructive Communication',
      'User Advocacy',
      'Methodical Discipline'
    ],
    tools: [
      'Playwright',
      'Cypress',
      'Postman',
      'Jira',
      'Apache JMeter',
      'Git',
      'Selenium WebDriver'
    ],
    stats: {
      averageSalary: '₹4.5 - ₹13.5 LPA',
      jobOpenings: '29,000+ Active Roles',
      growthRate: '+16% YoY Growth'
    },
    projects: {
      beginner: [
        'Comprehensive Manual Test Plan and Bug Matrix for an E-Commerce portal.',
        'Postman API Test Suite with automated assertions checking HTTP response bodies.',
        'Exploratory Testing Report identifying 15 edge case bugs in a popular open-source tool.'
      ],
      intermediate: [
        'Automated End-to-End E-Commerce Regression Suite using Playwright and TypeScript.',
        'Backend Data Validation Framework executing automated SQL queries against test databases.',
        'API Test Automation Framework with Java and RestAssured integrated with Allure reporting.'
      ],
      advanced: [
        'Continuous Performance Testing Pipeline simulating 5,000 virtual users with k6 and Grafana.',
        'Cross-Browser, Cross-Device Automated Cloud Testing Grid running in GitHub Actions.',
        'AI-Assisted Test Case Generator parsing user stories into automated Gherkin/Cucumber specs.'
      ]
    },
    certifications: [
      { name: 'ISTQB Certified Tester Foundation Level (CTFL)', type: 'PAID', provider: 'ISTQB' },
      { name: 'TestAutomationU Automated Testing Certification', type: 'FREE', provider: 'Applitools' },
      { name: 'Selenium WebDriver with Java - Basics to Advanced (Udemy)', type: 'PAID', provider: 'Udemy' },
      { name: 'Postman API Testing Student Expert Certification', type: 'FREE', provider: 'Postman' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Manual Testing & Quality Fundamentals',
        skills: ['Software Testing Lifecycle (STLC)', 'Test Case Design Techniques (BVA, ECP)', 'Bug Life Cycle & Severity', 'Postman API Basics'],
        tools: ['Jira', 'Postman', 'Chrome DevTools', 'Excel / Zephyr'],
        learningActivities: [
          'Write detailed test scenarios, positive/negative test cases, and acceptance tests.',
          'Execute exploratory tests on web applications and submit reproducible bug reports.',
          'Send GET, POST, PUT, DELETE requests in Postman and inspect JSON status codes.'
        ],
        projects: ['Campus Portal Manual Test Plan & Defect Log', 'Banking Application Test Case Suite'],
        description: 'Master the principles of quality verification and edge case identification.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Test Automation with Modern Frameworks',
        skills: ['Playwright or Cypress', 'JavaScript/TypeScript or Python', 'Locators & Page Object Model (POM)', 'API Automated Assertions'],
        tools: ['Playwright', 'VS Code', 'Git', 'Allure Reports'],
        learningActivities: [
          'Build an automated regression suite with Playwright utilizing the Page Object Model.',
          'Automate user login, shopping cart checkout, and form submissions.',
          'Run automated test runs in headless mode and generate visual HTML execution reports.'
        ],
        projects: ['Automated E-Commerce End-to-End Test Suite', 'REST API Automated Verification Framework'],
        description: 'Automate repetitive testing routines with modern, reliable browser automation tools.'
      },
      {
        stage: 'ADVANCED',
        title: 'CI/CD Integration, Performance & Security',
        skills: ['CI/CD Pipeline Integration (GitHub Actions)', 'Performance Testing (k6 / JMeter)', 'Database Testing (SQL)', 'Dockerized Test Grids'],
        tools: ['GitHub Actions', 'k6', 'Docker', 'PostgreSQL'],
        learningActivities: [
          'Integrate test automation into GitHub Actions so tests run on every pull request.',
          'Write k6 load testing scripts to measure system latency under peak traffic stress.',
          'Verify database state changes by executing SQL queries after automated test runs.'
        ],
        projects: ['Continuous Integration Test Automation Pipeline', 'JMeter Load Testing Benchmark Report'],
        description: 'Ensure test automation protects release velocity without slowing down engineering.'
      },
      {
        stage: 'JOB READY',
        title: 'SDET Architecture & Leadership',
        skills: ['Test Strategy Formulation', 'Quality Metrics (Defect Escape Rate, Flakiness)', 'Code Review for Testability', 'Interview Preparation'],
        tools: ['SonarQube', 'Grafana for Quality Metrics'],
        learningActivities: [
          'Design an enterprise testing strategy balancing unit, integration, E2E, and smoke tests.',
          'Practice live coding and test architecture design interview challenges.',
          'Attain ISTQB CTFL certification to validate foundational testing knowledge.'
        ],
        projects: ['Enterprise Quality Assurance Strategy & Automated Framework Capstone'],
        description: 'Become a Software Development Engineer in Test (SDET) driving software excellence.'
      }
    ],
    industry: ['Banking & Financial Services', 'Automotive & Embedded Systems', 'Healthcare Tech', 'Enterprise SaaS', 'Gaming']
  },
  {
    id: 'business-analyst',
    title: 'Business Analyst',
    category: 'Business Analysis',
    tags: ['Management', 'Non-Coding'],
    shortDescription: 'Bridges business stakeholders and engineering teams by eliciting requirements, mapping processes, and designing IT system solutions.',
    responsibilities: [
      'Elicit, analyze, and document functional and non-functional software requirements.',
      'Author Business Requirement Documents (BRD), Software Requirement Specs (SRS), and User Stories.',
      'Map current-state (As-Is) and target-state (To-Be) business processes in BPMN.',
      'Facilitate sprint planning, backlog grooming, and Agile/Scrum ceremonies with engineering teams.',
      'Perform gap analyses, feasibility studies, and cost-benefit assessments for new IT initiatives.',
      'Conduct User Acceptance Testing (UAT) and support change management across departments.'
    ],
    scope: 'Indispensable bridge between executive strategy and technical execution in consulting, banking, and enterprise software.',
    technicalSkills: [
      'Requirements Engineering (BRD, SRS, FRD)',
      'Agile / Scrum Methodologies',
      'Process Modeling (BPMN, UML, Flowcharts)',
      'Data Analysis with SQL & Excel',
      'Jira & Confluence Backlog Management',
      'Wireframing & Prototyping Basics',
      'User Acceptance Testing (UAT)',
      'Stakeholder Management'
    ],
    softSkills: [
      'Active Listening & Negotiation',
      'Diplomatic Conflict Resolution',
      'Structured Presentation',
      'Strategic Thinking',
      'Clear Written Documentation'
    ],
    tools: [
      'Jira',
      'Confluence',
      'Lucidchart / Draw.io',
      'Miro',
      'Microsoft Excel / Power BI',
      'Balsamiq / Figma Basics',
      'Visio'
    ],
    stats: {
      averageSalary: '₹5.5 - ₹15.5 LPA',
      jobOpenings: '25,000+ Active Roles',
      growthRate: '+15% YoY Growth'
    },
    projects: {
      beginner: [
        'Complete Business Requirements Document (BRD) for a Campus Library Management Portal.',
        'Process Flow Diagram (As-Is vs To-Be) for student course registration in BPMN.',
        'Competitive Analysis Matrix comparing top three global EdTech applications.'
      ],
      intermediate: [
        'Agile User Story Backlog in Jira with acceptance criteria and story point estimates.',
        'User Acceptance Testing (UAT) Plan and sign-off criteria for a placement tracking tool.',
        'Financial Loan Application Workflow Optimization study with 30% reduction in turnaround time.'
      ],
      advanced: [
        'Enterprise ERP Migration Feasibility Study and Gap Analysis for an institution.',
        'Data-Driven Customer Journey Optimization using SQL and Power BI dashboarding.',
        'Digital Banking Mobile App Transformation roadmap with regulatory compliance mapping.'
      ]
    },
    certifications: [
      { name: 'ECBA (Entry Certificate in Business Analysis - IIBA)', type: 'PAID', provider: 'IIBA' },
      { name: 'PMI Professional in Business Analysis (PMI-PBA)', type: 'PAID', provider: 'PMI' },
      { name: 'Agile Business Analysis with Jira & Scrum (Coursera)', type: 'FREE', provider: 'Coursera' },
      { name: 'Certified Scrum Master (CSM)', type: 'PAID', provider: 'Scrum Alliance' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Requirements Engineering & Process Modeling',
        skills: ['Software Development Lifecycle (SDLC)', 'Requirements Elicitation Techniques', 'BPMN & UML Diagrams', 'Writing User Stories'],
        tools: ['Lucidchart', 'Draw.io', 'Miro', 'Microsoft Word / Docs'],
        learningActivities: [
          'Practice interviewing stakeholders to convert vague requests into concrete user stories.',
          'Map swimlane process flows depicting interaction between users, servers, and administrators.',
          'Write Acceptance Criteria using the Given-When-Then format.'
        ],
        projects: ['Campus Canteen Food Ordering System BRD', 'Student Attendance Tracking Process Flow'],
        description: 'Learn to extract crystal-clear technical requirements from non-technical stakeholders.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Agile Governance, Jira & Data Analysis',
        skills: ['Agile / Scrum Ceremonies', 'Jira Backlog Management', 'Intermediate SQL for Verification', 'Excel Data Modeling'],
        tools: ['Jira Software', 'Confluence', 'Excel', 'MySQL Basics'],
        learningActivities: [
          'Configure a Jira Scrum board with epics, user stories, tasks, and sprint iterations.',
          'Write SQL queries to validate transactional records and support business decisions.',
          'Facilitate mock sprint planning and backlog refinement sessions.'
        ],
        projects: ['Placement Portal Product Backlog in Jira with Epics', 'Sales Funnel Drop-off Analysis in Excel'],
        description: 'Manage sprint delivery and backlogs while validating data independently.'
      },
      {
        stage: 'ADVANCED',
        title: 'Feasibility, Gap Analysis & UAT',
        skills: ['Gap Analysis (As-Is vs To-Be)', 'Cost-Benefit Analysis', 'UAT Test Execution', 'Change Management'],
        tools: ['Power BI Basics', 'Confluence', 'Visio'],
        learningActivities: [
          'Conduct comprehensive gap analyses comparing legacy software with modern SaaS replacements.',
          'Design User Acceptance Testing scenarios and coordinate beta testing with end-users.',
          'Draft organizational change management strategies to ensure high adoption rates.'
        ],
        projects: ['Enterprise CRM Transition Business Case', 'Comprehensive UAT Execution Portfolio'],
        description: 'Drive high-value technology investments and ensure seamless organizational adoption.'
      },
      {
        stage: 'JOB READY',
        title: 'Consulting Case Studies & Certification',
        skills: ['Business Case Presentation', 'Stakeholder Negotiation', 'IIBA ECBA Knowledge Areas', 'Consulting Frameworks'],
        tools: ['PowerPoint / Pitch Slides', 'Tableau / Power BI'],
        learningActivities: [
          'Solve consulting business cases focusing on profitability, operational efficiency, and market entry.',
          'Practice behavioral and situational interview scenarios (e.g. Managing conflicting executive priorities).',
          'Prepare for the IIBA ECBA certification exam.'
        ],
        projects: ['End-to-End Institutional Placement Modernization Strategic Proposal'],
        description: 'Step into corporate consulting and business architecture roles with poise.'
      }
    ],
    industry: ['Management Consulting (McKinsey, BCG, Big 4)', 'Banking & Insurance', 'IT Services (TCS, Infosys, Wipro)', 'Healthcare', 'Retail']
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    category: 'Product Management',
    tags: ['Management', 'Hybrid'],
    shortDescription: 'Owns product vision, strategy, roadmap, and business outcomes at the intersection of technology, user experience, and business viable growth.',
    responsibilities: [
      'Define product vision, strategic goals, and high-impact quarterly product roadmaps.',
      'Prioritize features and backlogs using frameworks like RICE, MoSCoW, and Kano.',
      'Author comprehensive Product Requirement Documents (PRD) detailing specs and metrics.',
      'Track North Star metrics, user retention, conversion funnels, and churn rates.',
      'Lead cross-functional squads: engineers, designers, data analysts, and marketing.',
      'Perform user discovery interviews and competitive market opportunity sizing.'
    ],
    scope: 'Mini-CEO of the product. High-visibility leadership role commanding tremendous prestige and compensation.',
    technicalSkills: [
      'Product Strategy & Roadmap Formulation',
      'PRD Authoring & Feature Specifications',
      'Product Analytics (Mixpanel, Amplitude)',
      'Prioritization Frameworks (RICE, Value vs Effort)',
      'A/B Testing & Experimentation Design',
      'Agile / Scrum Product Owner Role',
      'Go-to-Market (GTM) Strategy',
      'Technical Architecture Literacy'
    ],
    softSkills: [
      'Influence Without Authority',
      'Strategic Decisiveness',
      'Executive Communication',
      'Customer Obsession',
      'Resilience in Ambiguity'
    ],
    tools: [
      'Notion / Confluence',
      'Jira / Linear',
      'Mixpanel / Amplitude',
      'Figma (Inspection)',
      'Miro',
      'Google Analytics',
      'Loom'
    ],
    stats: {
      averageSalary: '₹9.0 - ₹25.0 LPA',
      jobOpenings: '19,500+ Active Roles',
      growthRate: '+22% YoY Growth'
    },
    projects: {
      beginner: [
        'Complete Product Requirement Document (PRD) for a new Spotify or WhatsApp feature.',
        'Feature Tear-Down and Competitive Analysis of Swiggy vs Zomato ordering workflows.',
        'User Journey Map and Friction Analysis of the current college placement portal.'
      ],
      intermediate: [
        'End-to-End Product Launch Strategy for an AI-powered resume feedback feature.',
        'RICE Prioritization Matrix for 20 candidate features with data-backed justification.',
        'Product Analytics Tracking Plan and funnel visualization designed in Mixpanel.'
      ],
      advanced: [
        'B2B SaaS Growth & Monetization Strategy with pricing tier optimization and onboarding experiments.',
        'Zero-to-One Product Discovery Case Study solving campus placement preparation for Tier 3 colleges.',
        'A/B Testing Experiment Design with sample size calculations and statistical guardrails.'
      ]
    },
    certifications: [
      { name: 'Product School: Certified Product Manager (CPM)', type: 'PAID', provider: 'Product School' },
      { name: 'Google Project Management Professional Certificate (Coursera)', type: 'PAID', provider: 'Google' },
      { name: 'Reforge Product Management Foundations', type: 'PAID', provider: 'Reforge' },
      { name: 'Scrum.org Professional Scrum Product Owner (PSPO I)', type: 'PAID', provider: 'Scrum.org' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Product Thinking & User Discovery',
        skills: ['Product Sense & Opportunity Sizing', 'User Problem Framing', 'Writing First PRDs', 'Competitive Landscaping'],
        tools: ['Notion', 'Miro', 'Figma Basics', 'Google Docs'],
        learningActivities: [
          'Deconstruct popular apps to understand why features exist and which metrics they move.',
          'Conduct 10 discovery interviews asking open-ended questions without pitching solutions.',
          'Draft structured PRDs with problem statements, user personas, and success metrics.'
        ],
        projects: ['Spotify Social Listening PRD', 'Campus Placement Portal Feature Teardown'],
        description: 'Cultivate acute product sense and distinguish user needs from superficial desires.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Roadmapping, Prioritization & Execution',
        skills: ['RICE & MoSCoW Prioritization', 'Product Roadmapping', 'Agile Product Ownership', 'Working with Engineers'],
        tools: ['Jira / Linear', 'Confluence', 'Figma', 'ProductPlan'],
        learningActivities: [
          'Score feature ideas using the RICE framework (Reach, Impact, Confidence, Effort).',
          'Collaborate with developers to scope MVP releases and manage technical debt trade-offs.',
          'Define release roadmaps aligned with business OKRs (Objectives & Key Results).'
        ],
        projects: ['AI Mock Interview Feature Launch PRD & Roadmap', 'Sprint Backlog Management Portfolio'],
        description: 'Execute product releases efficiently while leading cross-functional teams without authority.'
      },
      {
        stage: 'ADVANCED',
        title: 'Product Analytics, Metrics & Growth',
        skills: ['Cohort Retention & Churn Analysis', 'North Star Metric Hierarchy', 'A/B Testing & Funnel Optimization', 'Product-Led Growth'],
        tools: ['Mixpanel / Amplitude', 'Hotjar', 'Google Analytics', 'SQL Basics'],
        learningActivities: [
          'Define event tracking taxonomies to measure user drop-offs across activation funnels.',
          'Design A/B test experiments with hypothesis formulations and sample size power calculations.',
          'Identify engagement loops that transform occasional visitors into habitual daily active users.'
        ],
        projects: ['Onboarding Funnel Optimization Plan with Mixpanel Schema', 'Pricing Tier Strategy Proposal'],
        description: 'Drive measurable business outcomes through data-informed product iteration.'
      },
      {
        stage: 'JOB READY',
        title: 'Product Leadership & Case Interviews',
        skills: ['Product Design Interviews', 'Analytical Estimation (Fermi Problems)', 'Product Strategy Case Studies', 'Executive Presentation'],
        tools: ['Loom Video Presentations', 'Keynote / Slides'],
        learningActivities: [
          'Practice product design interviews (e.g. Design an alarm clock for the blind).',
          'Solve metrics troubleshooting cases (e.g. Uber rides dropped 12% in Mumbai, diagnose why).',
          'Build a comprehensive product portfolio demonstrating end-to-end product leadership.'
        ],
        projects: ['Zero-to-One Campus Career Ecosystem Capstone & Pitch Deck'],
        description: 'Land prestigious Product Manager and Associate PM (APM) campus offers.'
      }
    ],
    industry: ['Consumer Internet (B2C)', 'B2B Enterprise SaaS', 'FinTech & Neobanks', 'EdTech', 'HealthTech', 'E-Commerce']
  },
  {
    id: 'network-engineer',
    title: 'Network & Systems Engineer',
    category: 'Networking',
    tags: ['Hybrid', 'Non-Coding'],
    shortDescription: 'Architects, configures, and secures enterprise telecommunications, routing topologies, data center switches, and WAN/LAN backbones.',
    responsibilities: [
      'Design, configure, and maintain enterprise routers, multilayer switches, and firewalls.',
      'Implement routing protocols (OSPF, BGP, EIGRP) and switching protocols (VLANs, STP).',
      'Manage enterprise Wi-Fi controllers, VPN tunnels, and Software-Defined WAN (SD-WAN).',
      'Monitor network throughput, packet loss, jitter, and latency using SNMP tools.',
      'Troubleshoot network outages and perform root cause analysis with packet captures.',
      'Maintain data center cabling, rack hardware, and power redundancy infrastructure.'
    ],
    scope: 'Foundational backbone of the entire internet. Crucial for ISPs, data centers, universities, and banks.',
    technicalSkills: [
      'Cisco IOS & Routing Protocols (OSPF, BGP)',
      'Switching Concepts (VLANs, Trunking, Spanning Tree)',
      'Subnetting & IPv4/IPv6 Addressing',
      'Firewalls & VPNs (IPsec, SSL)',
      'Network Automation with Python & Ansible',
      'Packet Analysis (Wireshark)',
      'Wireless Networking (WLAN/WAP)',
      'DNS, DHCP, NTP, and SNMP Protocols'
    ],
    softSkills: [
      'Cool-Headed Outage Resolution',
      'Disciplined Change Management',
      'Physical & Logical Spatial Reasoning',
      'Methodical Troubleshooting',
      'Team Safety Protocol Adherence'
    ],
    tools: [
      'Cisco Packet Tracer',
      'GNS3 / EVE-NG',
      'Wireshark',
      'Putty / SecureCRT',
      'SolarWinds / PRTG',
      'Python (Netmiko / Napalm)',
      'Ansible'
    ],
    stats: {
      averageSalary: '₹4.5 - ₹13.0 LPA',
      jobOpenings: '23,500+ Active Roles',
      growthRate: '+14% YoY Growth'
    },
    projects: {
      beginner: [
        'Enterprise Campus Network Topology simulated in Cisco Packet Tracer with VLANs.',
        'IPv4 VLSM Subnetting Calculator and allocation plan for 5 university departments.',
        'Home Wi-Fi and Router Security Audit identifying rogue devices and weak encryption.'
      ],
      intermediate: [
        'Multi-Site Enterprise WAN with OSPF dynamic routing, NAT, and DHCP servers in GNS3.',
        'Site-to-Site IPsec VPN Tunnel connecting simulated headquarters and branch offices.',
        'Python Network Automation Script querying switch port statuses and backing up configs.'
      ],
      advanced: [
        'BGP Multi-Homed Autonomous System simulation connecting to dual upstream ISPs.',
        'Software-Defined Network (SDN) Controller with OpenFlow managing traffic steering.',
        'Automated Configuration Drift Detection using Ansible and Git across 50 network devices.'
      ]
    },
    certifications: [
      { name: 'Cisco Certified Network Associate (CCNA 200-301)', type: 'PAID', provider: 'Cisco' },
      { name: 'CompTIA Network+ (N10-008)', type: 'PAID', provider: 'CompTIA' },
      { name: 'Cisco Packet Tracer Free Courses & Labs', type: 'FREE', provider: 'Cisco Networking Academy' },
      { name: 'Juniper Networks Certified Associate (JNCIA-Junos)', type: 'PAID', provider: 'Juniper' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Networking Basics & Subnetting',
        skills: ['OSI 7-Layer Model & TCP/IP', 'IPv4 Addressing & VLSM Subnetting', 'Basic Switch Configuration', 'Cabling & Hardware'],
        tools: ['Cisco Packet Tracer', 'Wireshark', 'Command Prompt / Ping & Traceroute'],
        learningActivities: [
          'Calculate subnets rapidly without calculators using binary and powers of two.',
          'Build small local area networks in Cisco Packet Tracer connecting PCs, switches, and routers.',
          'Inspect ARP, ICMP ping, and DNS packets using Wireshark captures.'
        ],
        projects: ['Small Office / Home Office (SOHO) Network Design', 'VLSM Address Allocation Plan'],
        description: 'Understand how bytes travel through physical media, copper wires, and local switches.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Routing, Switching & Network Security',
        skills: ['VLANs, Inter-VLAN Routing & 802.1Q', 'OSPF Dynamic Routing Protocol', 'Access Control Lists (ACLs)', 'NAT & DHCP Services'],
        tools: ['Cisco Packet Tracer Advanced', 'GNS3', 'Putty'],
        learningActivities: [
          'Segment a corporate network into isolated Department VLANs with inter-VLAN routing.',
          'Configure OSPF single-area and multi-area routing protocols across multiple routers.',
          'Implement standard and extended Access Control Lists (ACLs) to block unauthorized subnets.'
        ],
        projects: ['Multi-Department Campus Network with OSPF and VLANs', 'Firewall ACL Hardening Portfolio'],
        description: 'Deploy resilient local topologies capable of isolating sensitive departmental traffic.'
      },
      {
        stage: 'ADVANCED',
        title: 'WAN, BGP, VPNs & Automation',
        skills: ['Border Gateway Protocol (BGP)', 'Site-to-Site IPsec VPNs', 'Network Automation with Python (Netmiko)', 'SNMP Monitoring'],
        tools: ['EVE-NG / GNS3', 'Python (Netmiko)', 'PRTG Network Monitor'],
        learningActivities: [
          'Configure dual-homed BGP peering between enterprise edge routers and simulation ISPs.',
          'Write Python scripts to automate bulk configuration changes across 20 simulated switches.',
          'Deploy PRTG or SolarWinds to monitor port bandwidth utilization and alert on link drops.'
        ],
        projects: ['Automated Network Backup Script with Python', 'Secure Site-to-Site IPsec VPN Deployment'],
        description: 'Bridge dispersed regional offices with encrypted high-speed wide area links.'
      },
      {
        stage: 'JOB READY',
        title: 'CCNA Certification & Enterprise Systems',
        skills: ['SD-WAN Architectures', 'Wireless LAN Controllers (WLC)', 'CCNA Exam Mastery', 'Troubleshooting Outage Scenarios'],
        tools: ['Ansible for Networking', 'Wireshark Advanced'],
        learningActivities: [
          'Complete end-to-end CCNA mock exams and timed configuration challenges.',
          'Troubleshoot intentional topology breaks (misconfigured subnets, routing loops, duplex mismatches).',
          'Attain the Cisco CCNA credential to validate enterprise readiness.'
        ],
        projects: ['Complete Enterprise Headquarters Network Design with Redundancy & Automation'],
        description: 'Step into critical data center operations and network engineering roles.'
      }
    ],
    industry: ['Internet Service Providers (ISPs)', 'Telecom Giants', 'Data Centers & Cloud Hubs', 'Financial Institutions', 'University Campuses']
  },
  {
    id: 'blockchain-developer',
    title: 'Blockchain & Web3 Developer',
    category: 'Emerging Technologies',
    tags: ['Coding', 'Emerging'],
    shortDescription: 'Builds decentralized applications (dApps), smart contracts, token standards, and distributed cryptographic ledgers on Ethereum and Solana.',
    responsibilities: [
      'Author, audit, and deploy secure Solidity / Rust smart contracts on EVM and Solana chains.',
      'Integrate decentralized backends with modern React frontend interfaces via Ethers.js or Viem.',
      'Perform security audits to prevent reentrancy, flash loan attacks, and overflow exploits.',
      'Architect decentralized finance (DeFi) protocols, automated market makers (AMMs), and tokenomics.',
      'Implement decentralized storage pipelines using IPFS, Arweave, and Filecoin.',
      'Optimize smart contract gas consumption and execution efficiency.'
    ],
    scope: 'Pioneering frontier for decentralized finance, digital identity, supply chain provenance, and cryptography.',
    technicalSkills: [
      'Solidity & Smart Contract Development',
      'Rust (for Solana & Substrate)',
      'Web3 Libraries (Ethers.js, Viem, Wagmi)',
      'Hardhat / Foundry Testing Frameworks',
      'EVM Architecture & Gas Optimization',
      'Cryptography & Zero-Knowledge (ZK) Basics',
      'DeFi Protocol Architectures (ERC-20, ERC-721)',
      'Decentralized Storage (IPFS)'
    ],
    softSkills: [
      'Paranoid Security Discipline',
      'Economic Tokenomic Thinking',
      'Decentralized Community Engagement',
      'Fast Adaptability to New Tooling',
      'Independent Research'
    ],
    tools: [
      'Remix IDE',
      'Foundry / Hardhat',
      'MetaMask / Phantom',
      'Alchemy / Infura RPCs',
      'OpenZeppelin Contracts',
      'Etherscan',
      'Slither (Static Analyzer)'
    ],
    stats: {
      averageSalary: '₹8.0 - ₹24.0 LPA',
      jobOpenings: '16,000+ Active Roles',
      growthRate: '+31% YoY Growth'
    },
    projects: {
      beginner: [
        'ERC-20 Custom Token and Faucet with OpenZeppelin on Sepolia Testnet.',
        'Decentralized Crowdfunding Smart Contract with deadline refunds.',
        'NFT Minting DApp with IPFS decentralized metadata storage and MetaMask connection.'
      ],
      intermediate: [
        'Decentralized Voting DApp with quadratic voting and gasless meta-transactions.',
        'Automated Market Maker (AMM) Decentralized Exchange (DEX) like Uniswap v2 core.',
        'Decentralized Escrow Smart Contract with multi-signature release logic.'
      ],
      advanced: [
        'Flash Loan Arbitrage Bot executing atomic multi-protocol swaps across DEXs.',
        'Zero-Knowledge Proof Identity Verification System on Ethereum using Circom.',
        'Cross-Chain Bridge Token Transfer Protocol connecting EVM testnets.'
      ]
    },
    certifications: [
      { name: 'Certified Ethereum Developer (Blockchain Council)', type: 'PAID', provider: 'Blockchain Council' },
      { name: 'freeCodeCamp Web3, Solidity & Foundry Full Course', type: 'FREE', provider: 'freeCodeCamp / Patrick Collins' },
      { name: 'Ethereum Foundation & ConsenSys Academy Courses', type: 'PAID', provider: 'ConsenSys' },
      { name: 'CryptoZombies Interactive Solidity Tutorial', type: 'FREE', provider: 'Loom Network' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Blockchain Mechanics & Solidity Basics',
        skills: ['Cryptographic Hashes & Public-Key Cryptography', 'Blockchain Mechanics (Consensus, Blocks, Gas)', 'Solidity Basics', 'Remix IDE'],
        tools: ['Remix IDE', 'MetaMask', 'Sepolia Testnet', 'Etherscan'],
        learningActivities: [
          'Understand how SHA-256 and Elliptic Curve Cryptography enforce ledger immutability.',
          'Write and compile basic Solidity contracts on Remix and deploy to Sepolia testnet.',
          'Connect MetaMask wallet to testnets and request free test ETH from faucets.'
        ],
        projects: ['Simple Storage Smart Contract', 'Decentralized Tip Jar Contract'],
        description: 'Understand how decentralized consensus replaces centralized database trust.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Professional Tooling, Hardhat/Foundry & Web3 Frontends',
        skills: ['Hardhat / Foundry', 'OpenZeppelin Security Standards', 'Ethers.js / Wagmi / Viem', 'Testing Smart Contracts'],
        tools: ['Foundry', 'VS Code', 'Alchemy RPC', 'Wagmi / React'],
        learningActivities: [
          'Write automated unit tests for smart contracts in Solidity (Foundry) or JavaScript (Hardhat).',
          'Use OpenZeppelin battle-tested libraries for ERC-20 tokens and access control.',
          'Build a React frontend connecting to wallets and executing contract write functions.'
        ],
        projects: ['Full Decentralized Crowdfunding DApp', 'Custom NFT Marketplace with Minting'],
        description: 'Build production dApps combining audited smart contracts with polished web interfaces.'
      },
      {
        stage: 'ADVANCED',
        title: 'Smart Contract Security, DeFi & Gas Optimization',
        skills: ['Common Exploits (Reentrancy, Overflow, Front-running)', 'Slither Static Analysis', 'Gas Optimization Techniques', 'DeFi Math (AMMs, Staking)'],
        tools: ['Slither', 'Foundry Fuzz Testing', 'Tenderly', 'DefiLlama'],
        learningActivities: [
          'Deconstruct historical multi-million dollar hacks (The DAO, flash loan exploits).',
          'Audit contracts using Slither and property-based fuzz testing in Foundry.',
          'Optimize storage variables and byte packing to reduce gas expenditure by 40%.'
        ],
        projects: ['Uniswap v2 Style AMM Decentralized Exchange', 'Decentralized Staking & Lending Protocol'],
        description: 'Master contract security where a single bug can result in catastrophic financial loss.'
      },
      {
        stage: 'JOB READY',
        title: 'Layer 2 Rollups, Zero-Knowledge & Auditing',
        skills: ['Layer 2 Scalability (Arbitrum, Optimism)', 'Zero-Knowledge Proofs Basics (zk-SNARKs)', 'Smart Contract Auditing Portfolio'],
        tools: ['Circom', 'Foundry Invariant Testing'],
        learningActivities: [
          'Participate in public smart contract audit contests on Code4rena or Sherlock.',
          'Deploy protocols onto Layer 2 rollups and measure transaction cost reductions.',
          'Prepare for technical Web3 interviews covering EVM internals and security patterns.'
        ],
        projects: ['Comprehensive Smart Contract Security Audit Portfolio & Protocol Capstone'],
        description: 'Qualify for high-demand decentralized engineering and security auditing roles.'
      }
    ],
    industry: ['Decentralized Finance (DeFi)', 'Web3 Gaming', 'Digital Identity & Privacy', 'Supply Chain Tech', 'FinTech']
  },
  {
    id: 'mobile-app-developer',
    title: 'Mobile App Developer',
    category: 'Software Development',
    tags: ['Coding'],
    shortDescription: 'Builds high-performance native and cross-platform mobile apps for iOS and Android using React Native, Flutter, Kotlin, and Swift.',
    responsibilities: [
      'Design and construct responsive, touch-optimized mobile interfaces for iOS and Android.',
      'Implement native device feature integrations: camera, GPS, push notifications, and biometrics.',
      'Optimize offline data synchronization using SQLite, Room, or Realm databases.',
      'Manage app store submission workflows for Apple App Store and Google Play Store.',
      'Profile battery consumption, network data usage, and frame render rates (60fps).',
      'Integrate mobile analytics, crash reporting (Firebase Crashlytics), and in-app purchases.'
    ],
    scope: 'Billions of smartphone users globally. Every high-growth product requires a premier mobile presence.',
    technicalSkills: [
      'React Native / Flutter / Kotlin / Swift',
      'Mobile UI Architecture & Navigation',
      'Offline Storage (SQLite, WatermelonDB, Realm)',
      'REST & WebSocket Mobile Integration',
      'Push Notifications (FCM / APNs)',
      'App Store & Play Store Deployment',
      'Mobile Performance Profiling',
      'Hardware Sensors & Native Modules'
    ],
    softSkills: [
      'Device Constraint Awareness',
      'Touch Gesture Intuition',
      'Patience with App Store Policies',
      'Attention to Micro-Animations',
      'Cross-Platform Consistency'
    ],
    tools: [
      'Android Studio',
      'Xcode',
      'VS Code',
      'React Native CLI / Expo',
      'Flutter SDK',
      'Firebase Console',
      'Postman'
    ],
    stats: {
      averageSalary: '₹5.5 - ₹16.5 LPA',
      jobOpenings: '30,500+ Active Roles',
      growthRate: '+20% YoY Growth'
    },
    projects: {
      beginner: [
        'Cross-Platform Fitness & Step Counter App using device accelerometer in Expo.',
        'Personal Expense Manager with local SQLite storage and visual spending charts.',
        'Weather App with GPS geolocation and dynamic weather animations.'
      ],
      intermediate: [
        'Food Delivery App with real-time driver tracking on Google Maps and order statuses.',
        'Audio Streaming Player with background audio playback and offline playlist downloads.',
        'Campus Student Companion with push notification alerts and class timetable schedules.'
      ],
      advanced: [
        'End-to-End E-Commerce Mobile App with biometric FaceID checkout and Stripe payments.',
        'Real-time Chat App with push notifications, media sharing, and offline caching.',
        'AR Measure & Interior Furniture Placement App using ARKit / ARCore.'
      ]
    },
    certifications: [
      { name: 'Meta Android Developer Professional Certificate (Coursera)', type: 'PAID', provider: 'Meta' },
      { name: 'Google Associate Android Developer Certification', type: 'PAID', provider: 'Google' },
      { name: 'The Complete Flutter Development Bootcamp with Dart', type: 'PAID', provider: 'Udemy' },
      { name: 'React Native - The Practical Guide (Academind)', type: 'PAID', provider: 'Udemy' }
    ],
    roadmap: [
      {
        stage: 'BEGINNER',
        title: 'Mobile UI Fundamentals & Frameworks',
        skills: ['Dart & Flutter or React Native & JS', 'Mobile Layouts & Flexbox', 'Screen Navigation & Gestures', 'State Management Basics'],
        tools: ['VS Code / Android Studio', 'Expo / Flutter SDK', 'Android Emulator / iOS Simulator'],
        learningActivities: [
          'Run applications on physical mobile devices and simulated emulators.',
          'Build responsive touch interfaces that adapt gracefully across phone and tablet screens.',
          'Handle user input, device keyboard avoidance, and screen transitions.'
        ],
        projects: ['Calculator & Unit Converter App', 'Recipe Book Mobile App'],
        description: 'Understand the mobile paradigm of touch gestures, lifecycles, and screen densities.'
      },
      {
        stage: 'INTERMEDIATE',
        title: 'Native Features, Storage & APIs',
        skills: ['Device APIs (Camera, Location, Storage)', 'Offline Database (SQLite / Room)', 'Push Notifications (Firebase FCM)', 'API Integration'],
        tools: ['Firebase', 'Postman', 'Xcode Simulator', 'Figma for Mobile'],
        learningActivities: [
          'Cache API payloads locally to ensure seamless offline application experience.',
          'Integrate push notifications that trigger even when the application is backgrounded.',
          'Capture photos via device camera and upload compressed payloads to cloud storage.'
        ],
        projects: ['Offline-First Note Taking App with Cloud Sync', 'Campus Event Guide with Geolocation'],
        description: 'Harness native phone sensors and ensure uninterrupted offline functionality.'
      },
      {
        stage: 'ADVANCED',
        title: 'Performance Optimization & Store Publishing',
        skills: ['Memory Leak Diagnosis & Profiling', 'App Size Optimization', 'CI/CD for Mobile (Fastlane)', 'App Store & Play Store Guidelines'],
        tools: ['Android Profiler', 'Instruments (Xcode)', 'Fastlane', 'Google Play Console'],
        learningActivities: [
          'Profile frame render times to eliminate stutter and achieve smooth 60fps scrolling.',
          'Automate testing, build signing, and app store uploads using Fastlane scripts.',
          'Prepare store listings: screenshots, privacy policies, and compliance questionnaires.'
        ],
        projects: ['Published App on Google Play Store or Apple TestFlight', 'High-Performance Social Feed App'],
        description: 'Overcome strict mobile platform guidelines and ship production apps to millions.'
      },
      {
        stage: 'JOB READY',
        title: 'Mobile Architecture & Production Polish',
        skills: ['Clean Architecture (MVVM / BLoC)', 'Security (Keystore, Secure Storage, SSL Pinning)', 'Mobile System Design Interviews'],
        tools: ['Firebase Crashlytics', 'App Center'],
        learningActivities: [
          'Practice mobile system design questions (e.g. Design Instagram feed with offline caching).',
          'Implement SSL pinning and encrypted key storage to protect user authentication tokens.',
          'Participate in mock technical coding interviews and mobile architecture whiteboard reviews.'
        ],
        projects: ['Production-Grade E-Commerce Mobile Platform with Live Payments'],
        description: 'Excel in mobile recruitment drives for prominent consumer tech enterprises.'
      }
    ],
    industry: ['Consumer Mobile Apps', 'FinTech & Neobanks', 'Health & Fitness', 'Travel & Hospitality', 'E-Commerce', 'Entertainment']
  }
];

// Helper utilities for querying dataset
export function getAllRoles() {
  return IT_ROLES;
}

export function getRoleById(id) {
  if (!id) return null;
  const cleanId = String(id).toLowerCase().trim();
  return IT_ROLES.find(r => r.id === cleanId || r.id.toLowerCase() === cleanId) || null;
}

export function getRolesByCategory(category) {
  if (!category || category === 'All Domains') return IT_ROLES;
  return IT_ROLES.filter(r => r.category.toLowerCase() === category.toLowerCase());
}

export function getCategories() {
  return DOMAIN_CATEGORIES;
}

export function getAllTags() {
  return ROLE_TAGS;
}

export function filterRoles({ query = '', category = 'All Domains', tags = [] }) {
  const q = (query || '').toLowerCase().trim();

  return IT_ROLES.filter(role => {
    // 1. Category match
    if (category && category !== 'All Domains') {
      if (role.category.toLowerCase() !== category.toLowerCase()) {
        return false;
      }
    }

    // 2. Tags match (must match all selected tags if any)
    if (tags && tags.length > 0) {
      const roleTagsLower = role.tags.map(t => t.toLowerCase());
      const hasAllTags = tags.every(t => roleTagsLower.includes(t.toLowerCase()));
      if (!hasAllTags) return false;
    }

    // 3. Query match across title, category, description, technicalSkills, tools, industry
    if (q) {
      const matchTitle = role.title.toLowerCase().includes(q);
      const matchCat = role.category.toLowerCase().includes(q);
      const matchDesc = role.shortDescription.toLowerCase().includes(q);
      const matchSkills = role.technicalSkills.some(s => s.toLowerCase().includes(q));
      const matchSoft = role.softSkills.some(s => s.toLowerCase().includes(q));
      const matchTools = (role.tools || []).some(t => t.toLowerCase().includes(q));
      const matchInd = (role.industry || []).some(i => i.toLowerCase().includes(q));
      const matchTags = role.tags.some(t => t.toLowerCase().includes(q));

      if (!matchTitle && !matchCat && !matchDesc && !matchSkills && !matchSoft && !matchTools && !matchInd && !matchTags) {
        return false;
      }
    }

    return true;
  });
}
