const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const RUNTIME_TIMEOUT_MS = parseInt(process.env.CODE_EXEC_TIMEOUT_MS || '5000', 10);
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Execute command and return stdout/stderr/exitCode
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      ...options,
      shell: true,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGKILL');
      } catch (e) {}
    }, options.timeout || RUNTIME_TIMEOUT_MS);

    if (options.input) {
      child.stdin.write(options.input);
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += data.toString();
      }
    });

    child.stderr.on('data', (data) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += data.toString();
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve({
        code,
        stdout,
        stderr,
        timedOut,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        code: 1,
        stdout,
        stderr: err.message,
        timedOut: false,
        error: err,
      });
    });
  });
}

/**
 * Detect runtime and compiler availability on host system
 */
async function detectCompilers() {
  const pythonPath = process.env.PYTHON_PATH || 'python';
  const gccPath = process.env.COMPILER_GCC_PATH || 'gcc';
  const gxxPath = process.env.COMPILER_GXX_PATH || 'g++';
  const javacPath = process.env.COMPILER_JAVAC_PATH || 'javac';
  const javaPath = process.env.COMPILER_JAVA_PATH || 'java';

  const results = {
    python: { available: false, version: null, path: pythonPath, error: null },
    c: { available: false, version: null, path: gccPath, error: null },
    cpp: { available: false, version: null, path: gxxPath, error: null },
    java: { available: false, version: null, path: javacPath, error: null },
  };

  // Test Python
  try {
    const res = await runCommand(pythonPath, ['--version'], { timeout: 3000 });
    if (res.code === 0 && (res.stdout || res.stderr)) {
      results.python.available = true;
      results.python.version = (res.stdout || res.stderr).trim();
    } else {
      results.python.error = res.stderr || 'Python executable not found in PATH or configured path.';
    }
  } catch (err) {
    results.python.error = err.message;
  }

  // Test GCC
  try {
    const res = await runCommand(gccPath, ['--version'], { timeout: 3000 });
    if (res.code === 0 && (res.stdout || res.stderr)) {
      results.c.available = true;
      results.c.version = (res.stdout || res.stderr).split('\n')[0].trim();
    } else {
      results.c.error = 'GCC compiler not found in PATH. Install MinGW-w64 or configure COMPILER_GCC_PATH.';
    }
  } catch (err) {
    results.c.error = err.message;
  }

  // Test G++
  try {
    const res = await runCommand(gxxPath, ['--version'], { timeout: 3000 });
    if (res.code === 0 && (res.stdout || res.stderr)) {
      results.cpp.available = true;
      results.cpp.version = (res.stdout || res.stderr).split('\n')[0].trim();
    } else {
      results.cpp.error = 'G++ compiler not found in PATH. Install MinGW-w64 or configure COMPILER_GXX_PATH.';
    }
  } catch (err) {
    results.cpp.error = err.message;
  }

  // Test Java
  try {
    const resJavac = await runCommand(javacPath, ['-version'], { timeout: 3000 });
    const resJava = await runCommand(javaPath, ['-version'], { timeout: 3000 });
    if ((resJavac.code === 0 || resJavac.stderr.includes('javac')) && resJava.code === 0) {
      results.java.available = true;
      results.java.version = (resJavac.stdout || resJavac.stderr || resJava.stderr).split('\n')[0].trim();
    } else {
      results.java.error = 'JDK/JRE not found in PATH. Install OpenJDK or configure COMPILER_JAVAC_PATH.';
    }
  } catch (err) {
    results.java.error = err.message;
  }

  return results;
}

/**
 * Normalize whitespace and line endings for fair string comparison
 */
function normalizeOutput(str) {
  if (!str) return '';
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Execute source code in sandboxed ephemeral directory against test cases
 */
async function executeSubmission({ language, sourceCode, testCases = [] }) {
  const compilers = await detectCompilers();
  const langKey = language.toLowerCase();

  const langMap = {
    python: 'python',
    c: 'c',
    cpp: 'cpp',
    cplusplus: 'cpp',
    java: 'java',
  };

  const resolvedLang = langMap[langKey];
  if (!resolvedLang) {
    return {
      success: false,
      status: 'RUNTIME_ERROR',
      error: `Unsupported programming language: '${language}'.`,
    };
  }

  if (!compilers[resolvedLang].available) {
    return {
      success: false,
      status: 'RUNTIME_ERROR',
      error: `Execution environment unavailable: ${compilers[resolvedLang].error}`,
      runtimeMissing: true,
      compilerStatus: compilers[resolvedLang],
    };
  }

  // Create isolated scratch directory
  const runId = uuidv4();
  const tempDir = path.join(os.tmpdir(), `placement_sandbox_${runId}`);
  fs.mkdirSync(tempDir, { recursive: true });

  let srcFileName;
  let compileCmd = null;
  let executeCmd = null;
  let executeArgs = [];

  switch (resolvedLang) {
    case 'python':
      srcFileName = 'solution.py';
      executeCmd = compilers.python.path;
      executeArgs = [path.join(tempDir, srcFileName)];
      break;

    case 'c':
      srcFileName = 'solution.c';
      const cBinary = path.join(tempDir, 'solution.exe');
      compileCmd = {
        cmd: compilers.c.path,
        args: [path.join(tempDir, srcFileName), '-O2', '-o', cBinary],
      };
      executeCmd = cBinary;
      break;

    case 'cpp':
      srcFileName = 'solution.cpp';
      const cppBinary = path.join(tempDir, 'solution.exe');
      compileCmd = {
        cmd: compilers.cpp.path,
        args: [path.join(tempDir, srcFileName), '-O2', '-std=c++17', '-o', cppBinary],
      };
      executeCmd = cppBinary;
      break;

    case 'java':
      srcFileName = 'Solution.java';
      compileCmd = {
        cmd: compilers.java.path,
        args: [path.join(tempDir, srcFileName)],
      };
      executeCmd = process.env.COMPILER_JAVA_PATH || 'java';
      executeArgs = ['-cp', tempDir, 'Solution'];
      break;
  }

  const srcFilePath = path.join(tempDir, srcFileName);
  fs.writeFileSync(srcFilePath, sourceCode, 'utf8');

  try {
    // Compilation stage if required
    if (compileCmd) {
      const compileRes = await runCommand(compileCmd.cmd, compileCmd.args, {
        cwd: tempDir,
        timeout: 10000,
      });

      if (compileRes.code !== 0) {
        return {
          success: false,
          status: 'COMPILATION_ERROR',
          errorMessage: compileRes.stderr || compileRes.stdout || 'Compilation failed.',
          passedTestCases: 0,
          totalTestCases: testCases.length,
          score: 0,
        };
      }
    }

    // Evaluation against test cases
    let passedCount = 0;
    const testResults = [];
    let overallStatus = 'ACCEPTED';
    let maxExecTimeMs = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const startT = Date.now();

      const runRes = await runCommand(executeCmd, executeArgs, {
        cwd: tempDir,
        input: tc.input || '',
        timeout: RUNTIME_TIMEOUT_MS,
      });

      const execTime = Date.now() - startT;
      if (execTime > maxExecTimeMs) maxExecTimeMs = execTime;

      if (runRes.timedOut) {
        overallStatus = 'TIME_LIMIT_EXCEEDED';
        testResults.push({
          testCase: i + 1,
          status: 'TIME_LIMIT_EXCEEDED',
          timeMs: execTime,
          isSample: tc.isSample || false,
        });
        break;
      }

      if (runRes.code !== 0) {
        overallStatus = 'RUNTIME_ERROR';
        testResults.push({
          testCase: i + 1,
          status: 'RUNTIME_ERROR',
          error: runRes.stderr.trim(),
          timeMs: execTime,
          isSample: tc.isSample || false,
        });
        break;
      }

      const normActual = normalizeOutput(runRes.stdout);
      const normExpected = normalizeOutput(tc.output);
      const passed = normActual === normExpected;

      if (passed) {
        passedCount++;
        testResults.push({
          testCase: i + 1,
          status: 'PASSED',
          actualOutput: tc.isSample ? normActual : '[Hidden]',
          expectedOutput: tc.isSample ? normExpected : '[Hidden]',
          timeMs: execTime,
          isSample: tc.isSample || false,
        });
      } else {
        if (overallStatus === 'ACCEPTED') overallStatus = 'WRONG_ANSWER';
        testResults.push({
          testCase: i + 1,
          status: 'WRONG_ANSWER',
          actualOutput: tc.isSample ? normActual : '[Hidden]',
          expectedOutput: tc.isSample ? normExpected : '[Hidden]',
          timeMs: execTime,
          isSample: tc.isSample || false,
        });
      }
    }

    const score = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0;

    return {
      success: true,
      status: passedCount === testCases.length ? 'ACCEPTED' : overallStatus,
      passedTestCases: passedCount,
      totalTestCases: testCases.length,
      score,
      executionTimeMs: maxExecTimeMs,
      testResults,
    };
  } finally {
    // Clean up temporary sandboxed scratch files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

module.exports = {
  detectCompilers,
  executeSubmission,
  normalizeOutput,
};
