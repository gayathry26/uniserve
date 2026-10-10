const { spawn } = require('child_process');
const path = require('path');
const logger = require('winston');

const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';
const PYTHON_SCRIPT = path.resolve(__dirname, '../rag.py');

async function callPython(mode, inputData) {
  return new Promise(async (resolve, reject) => {
    // Check Python availability
    try {
      await new Promise((res, rej) => {
        const check = spawn(PYTHON_PATH, ['--version']);
        check.on('error', rej);
        check.on('close', (code) => (code === 0 ? res() : rej(new Error('Python not found'))));
      });
    } catch (error) {
      logger.error(`Python check failed: ${error.message}`);
      return reject(new Error('Python not found in system PATH'));
    }

    const python = spawn(PYTHON_PATH, [PYTHON_SCRIPT, mode]);

    let stdoutData = '';
    let stderrData = '';

    python.stdin.write(JSON.stringify(inputData));
    python.stdin.end();

    python.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    python.on('error', (error) => {
      logger.error(`Python process error: ${error.message}`);
      reject(new Error(`Python process failed: ${error.message}`));
    });

    python.on('close', (code) => {
      const output = stdoutData.trim() || stderrData.trim();
      if (code !== 0 || !output) {
        logger.error(`Python script failed with code ${code}: ${output || 'No output'}`);
        return reject(new Error(`Python script failed with code ${code}: ${output || 'No output'}`));
      }

      try {
        const parsed = JSON.parse(output);
        resolve(parsed);
      } catch (parseError) {
        logger.error(`Failed to parse Python output: ${parseError.message}. Raw output: ${output}`);
        reject(new Error(`Failed to parse Python output: ${parseError.message}`));
      }
    });
  });
}

module.exports = { callPython };