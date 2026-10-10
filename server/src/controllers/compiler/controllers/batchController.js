// import axios from 'axios';
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { languages } = require('../config/languages');
const FileManager = require('../utils/fileManager');
const { executeCode, compileCode } = require('./executionController');
const { extractClassName } = require('../utils/javaParser');
const { json } = require('stream/consumers');

const dotenv = require('dotenv');
const { fetchCoderData } = require('../services/api');
dotenv.config();


// Simple Java code validation
function validateJavaCode(javaCode) {
  const issues = [];

  if (!javaCode.trim()) {
    issues.push('Code is empty');
    return issues;
  }
  let braceCount = 0;
  let inString = false;
  let inChar = false;
  let inComment = false;
  let inLineComment = false;

  for (let i = 0; i < javaCode.length; i++) {
    const char = javaCode[i];
    const nextChar = javaCode[i + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }

    if (inComment) {
      if (char === '*' && nextChar === '/') {
        inComment = false;
        i++;
      }
      continue;
    }

    if (char === '/' && nextChar === '/') {
      inLineComment = true;
      i++;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inComment = true;
      i++;
      continue;
    }

    if (char === '"' && !inChar) {
      inString = !inString;
      continue;
    }

    if (char === "'" && !inString) {
      inChar = !inChar;
      continue;
    }

    if (!inString && !inChar) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
  }

  if (braceCount !== 0) {
    issues.push(`Unbalanced braces: ${braceCount > 0 ? 'missing closing' : 'extra closing'} brace(s)`);
  }

  return issues;
}

async function batchHandler(req, res) {
  const { solution, type, fields, question_id, qb_name, language: langId, sessionId = null, timeout = null } = req.body;
  let testcases = fields
  let question_testresult = [];
  let testcase_type = [];


  if (question_id) {
    if (typeof qb_name !== 'string' || qb_name.trim() === '') {
      return res.status(400).json({ error: 'qb_name must be a non-empty string' });
    }

    try {
      fetchCoderData
      const response = await fetchCoderData(`${process.env.CODER_API_URL}/question/${qb_name}/${question_id}`)
      let question_testcases = [];
      console.log(response);
      if (response.status == 200) {
        
        // return res.status(200).json({ 'response': response?.data?.data[0]?.testcases, response })
        response?.data?.data?.testcases?.visible &&
          response?.data?.data?.testcases?.visible.map(
            visible => {
              question_testcases.push(visible.value)
              question_testresult.push(visible?.output)
              testcase_type.push('visible')
            }
          )

        response?.data?.data?.testcases?.random &&
          response?.data?.data?.testcases?.random.map(
            random => {
              question_testcases.push(random?.value)
              question_testresult.push(random?.output)
              testcase_type.push('random')
            }
          )

        response?.data?.data?.testcases?.special &&
          response?.data?.data?.testcases?.special.map(
            special => {
              question_testcases.push(special.value)
              question_testresult.push(special?.output)
              testcase_type.push('special')
            }
          )

        testcases = question_testcases
      }
    } catch (error) {
        return res.status(200).json({ 'response': error })
        console.log(error);
    }
  }
  // Input validation
  if (!solution || typeof solution !== 'string' || solution.trim() === '') {
    return res.status(400).json({ error: 'Solution must be a non-empty string' });
  }
  if (!Number.isInteger(type)) {
    return res.status(400).json({ error: 'Type must be an integer' });
  }
  if (!Array.isArray(testcases) || testcases.some((f) => typeof f !== 'string')) {
    return res.status(400).json({ error: 'Fields must be an array of strings' });
  }
  if (!langId || !languages[langId]) {
    console.error(`Invalid language ID: ${langId}`);
    return res.status(400).json({ error: 'Invalid or missing language ID' });
  }
  if (testcases.length > 1000) {
    return res.status(400).json({ error: 'Too many input fields', details: 'Maximum 1000 inputs allowed' });
  }

  // Group inputs based on inputCount
  const inputGroups = testcases;

  const config = languages[langId];
  if (!config.timeout) {
    console.warn(`No timeout defined for language ID: ${langId}`);
    config.timeout = 5000; // Default timeout (5 seconds)
  }

  const fileManager = new FileManager();
  const currentSessionId = sessionId || uuidv4();
  const executionTimeout = timeout || config.timeout;

  try {
    const sessionDir = fileManager.createSessionDir(currentSessionId);
    let filename;

    // Handle Java-specific processing
    if (langId === 62) {
      const validationIssues = validateJavaCode(solution);
      if (validationIssues.length > 0) {
        console.warn('Java validation warnings:', validationIssues);
      }

      try {
        const className = extractClassName(solution);
        console.log('Extracted class name:', className);
        filename = `${className}.${config.ext}`;
      } catch (parseErr) {
        console.error('Java class name extraction error:', parseErr.message);
        fileManager.cleanupSession(currentSessionId);
        return res.status(400).json({
          error: 'Failed to extract class name from Java code',
          details: parseErr.message,
          validationIssues,
        });
      }
    } else {
      filename = fileManager.generateFilename(config.ext);
    }

    // Write file
    const filePath = path.join(sessionDir, filename);
    fileManager.writeFile(filePath, solution);
    console.log(`File written: ${filename}`);

    let executablePath = null;
    let sourcePath = filePath;

    // Compile code if needed
    if (config.compile) {
      try {
        const compileResult = await compileCode(langId, filePath, sessionDir, filename, fileManager, config);
        if (typeof compileResult === 'object' && compileResult.executablePath) {
          executablePath = compileResult.executablePath;
          sourcePath = compileResult.sourcePath || filePath;
        } else if (typeof compileResult === 'string') {
          executablePath = compileResult;
        } else {
          throw new Error('Invalid return value from compileCode function');
        }
        console.log(`Compilation successful: ${executablePath}`);
      } catch (compileErr) {
        console.error('Compilation error:', compileErr.message);
        fileManager.cleanupSession(currentSessionId);
        return res.status(400).json({
          error: 'Compilation failed',
          details: compileErr.message,
        });
      }
    } else {
      executablePath = filePath;
    }

    // Execute code for each input group
    const results = [];
    for (let i = 0; i < inputGroups.length; i++) {
      // const group = inputGroups[i];
      const inputString = inputGroups[i]
      // const inputString = group.join('\n'); // Join inputs with newlines
      try {
        const result = await executeCode(
          langId,
          sourcePath,
          executablePath,
          inputString,
          sessionDir,
          executionTimeout,
          true
        );
        let correct = false

        console.log(result);
        if (result?.stderr) {
        } else {
          correct = result?.stdout?.trim() === question_testresult[i]?.trim() ? true : false
        }

        results.push({ correct: correct,type: testcase_type[i], ...result });
      } catch (execErr) {
        console.error(`Execution error for input group ${i + 1}:`, execErr.message);
        results.push({ error: execErr.message, status: 'error' });
      }
    }

    // Send response
    const responseData = {
      results,
      sessionId: currentSessionId,
      type,
      language: { id: config.id, name: config.name },
    };

    if (langId === 62) {
      responseData.javaInfo = {
        filename,
        parserUsed: 'java-parser npm package',
      };
    }

    res.json(responseData);

    // Cleanup files
    if (config.compile && executablePath && executablePath !== sourcePath) {
      fileManager.cleanupFiles(sourcePath, executablePath);
    } else {
      fileManager.cleanupFiles(sourcePath);
    }
  } catch (err) {
    console.error('Batch handler error:', err);
    fileManager.cleanupSession(currentSessionId);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message,
    });
  }
}

module.exports = { batchHandler };
