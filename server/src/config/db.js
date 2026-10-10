const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX || '20', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

// Common institutional database pool
const commonPool = mysql.createPool({
  ...dbConfig,
  database: process.env.DB_COMMON_NAME || 'lms',
});

// Registry of department database connection pools
const departmentPools = new Map();

// Default fallback mappings if database table is being initialized
const defaultDeptDatabaseMap = {
  CSE: 'lms_cse',
  ECE: 'lms_ece',
  EEE: 'lms_eee',
  MECH: 'lms_mech',
  CIVIL: 'lms_civil',
  IT: 'lms_it',
};

/**
 * Get or initialize connection pool for a specific department
 * @param {string} departmentCode - e.g. 'CSE', 'ECE', 'MECH'
 * @returns {mysql.Pool}
 */
async function getDepartmentPool(departmentCode) {
  if (!departmentCode) {
    throw new Error('Department code is required for department database access.');
  }

  const deptKey = departmentCode.toUpperCase();

  if (departmentPools.has(deptKey)) {
    return departmentPools.get(deptKey);
  }

  // Look up database name from common database registry
  let dbName = defaultDeptDatabaseMap[deptKey];
  try {
    const [rows] = await commonPool.query(
      'SELECT database_name FROM department_databases WHERE dept_code = ? AND is_active = 1',
      [deptKey]
    );
    if (rows.length > 0 && rows[0].database_name) {
      dbName = rows[0].database_name;
    }
  } catch (err) {
    // Fallback to default mapping during initial startup/migrations
    console.warn(`[DB Registry] Using default mapping for ${deptKey}: ${dbName}`);
  }

  if (!dbName) {
    throw new Error(`No active database configured for department: ${deptKey}`);
  }

  const deptPool = mysql.createPool({
    ...dbConfig,
    database: dbName,
  });

  departmentPools.set(deptKey, deptPool);
  return deptPool;
}

/**
 * Execute query against common institutional database ('lms')
 */
async function queryCommon(sql, params = []) {
  const [results] = await commonPool.execute(sql, params);
  return results;
}

/**
 * Execute query against department database
 */
async function queryDept(departmentCode, sql, params = []) {
  const pool = await getDepartmentPool(departmentCode);
  const [results] = await pool.execute(sql, params);
  return results;
}

/**
 * Health check covering common DB and all department DBs
 */
async function checkDatabaseHealth() {
  const health = {
    commonDb: { status: 'DOWN', database: process.env.DB_COMMON_NAME || 'lms', latencyMs: null },
    departments: {},
  };

  const startCommon = Date.now();
  try {
    await commonPool.query('SELECT 1');
    health.commonDb.status = 'UP';
    health.commonDb.latencyMs = Date.now() - startCommon;
  } catch (err) {
    health.commonDb.error = err.message;
  }

  // Test department databases
  for (const [deptCode, dbName] of Object.entries(defaultDeptDatabaseMap)) {
    const startDept = Date.now();
    try {
      const pool = await getDepartmentPool(deptCode);
      await pool.query('SELECT 1');
      health.departments[deptCode] = {
        status: 'UP',
        database: dbName,
        latencyMs: Date.now() - startDept,
      };
    } catch (err) {
      health.departments[deptCode] = {
        status: 'DOWN',
        database: dbName,
        error: err.message,
      };
    }
  }

  return health;
}

module.exports = {
  commonPool,
  getDepartmentPool,
  queryCommon,
  queryDept,
  checkDatabaseHealth,
  defaultDeptDatabaseMap,
};
