const test = require('node:test');
const assert = require('node:assert');
const { queryCommon, queryDept, checkDatabaseHealth } = require('../config/db');
const { detectCompilers, executeSubmission } = require('../services/compilerService');
const { checkStudentEligibility } = require('../services/eligibilityEngine');

test('1. Database Health Check (Common LMS and Department Databases)', async () => {
  const health = await checkDatabaseHealth();
  assert.strictEqual(health.commonDb.status, 'UP', 'Common database should be UP');
  assert.strictEqual(health.departments.CSE.status, 'UP', 'CSE database should be UP');
  assert.strictEqual(health.departments.ECE.status, 'UP', 'ECE database should be UP');
  assert.strictEqual(health.departments.MECH.status, 'UP', 'MECH database should be UP');
});

test('2. Department Data Isolation Verification', async () => {
  // Query CSE student from CSE department DB
  const cseRows = await queryDept('CSE', 'SELECT * FROM dept_students_academic WHERE register_number = ?', ['2023CSE001']);
  assert.strictEqual(cseRows.length, 1, 'CSE student should exist in CSE DB');
  assert.strictEqual(cseRows[0].register_number, '2023CSE001');

  // Ensure CSE student does NOT exist in ECE DB
  const eceRows = await queryDept('ECE', 'SELECT * FROM dept_students_academic WHERE register_number = ?', ['2023CSE001']);
  assert.strictEqual(eceRows.length, 0, 'CSE student must not leak into ECE DB');
});

test('3. Eligibility Engine & Coordinator Waiver Test', async () => {
  // Fetch CSE1 student ID (CGPA 9.35, 0 backlogs)
  const [cse1] = await queryCommon('SELECT id FROM students_master WHERE register_number = ?', ['2023CSE001']);
  const [googleJob] = await queryCommon("SELECT id FROM jobs WHERE title LIKE 'Software Development Engineer%'");

  const evalResult = await checkStudentEligibility(cse1.id, googleJob.id);
  assert.strictEqual(evalResult.eligible, true, 'High CGPA CSE student should be eligible for Google SDE');

  // Fetch MECH1 student (has 1 backlog) and L&T job (requires 0 backlogs, but has coordinator waiver seeded)
  const [mech1] = await queryCommon('SELECT id FROM students_master WHERE register_number = ?', ['2023MECH001']);
  const [ltJob] = await queryCommon("SELECT id FROM jobs WHERE title LIKE 'Graduate Engineer Trainee%'");

  const mechEvalResult = await checkStudentEligibility(mech1.id, ltJob.id);
  assert.strictEqual(mechEvalResult.eligible, true, 'MECH student with coordinator waiver should be granted eligibility');
  assert.strictEqual(mechEvalResult.hasCoordinatorWaiver, true, 'Coordinator waiver must be detected');
});

test('4. Compiler Detection Service', async () => {
  const compilers = await detectCompilers();
  assert.ok(compilers.python, 'Python compiler object should exist');
  assert.strictEqual(compilers.python.available, true, 'Python 3 should be detected as available');
  assert.ok(compilers.c, 'C compiler object should exist');
  assert.ok(compilers.java, 'Java compiler object should exist');
});

test('5. Programming Assessment Sandboxed Execution (Python 3)', async () => {
  const pyCode = `
import sys
line = sys.stdin.read().strip()
if line:
    n, target = map(int, line.split('\\n')[0].split())
    nums = list(map(int, line.split('\\n')[1].split()))
    lookup = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            print(f"{lookup[complement]} {i}")
            break
        lookup[num] = i
`;

  const testCases = [
    { input: '4 9\n2 7 11 15', output: '0 1', isSample: true },
    { input: '3 6\n3 2 4', output: '1 2', isSample: false },
  ];

  const execResult = await executeSubmission({
    language: 'python',
    sourceCode: pyCode,
    testCases,
  });

  assert.strictEqual(execResult.status, 'ACCEPTED', 'Valid solution must pass all test cases');
  assert.strictEqual(execResult.passedTestCases, 2, 'Should pass both test cases');
  assert.strictEqual(execResult.score, 100, 'Score should be 100%');
  
  // Close connection pools and exit
  setTimeout(() => process.exit(0), 100);
});
