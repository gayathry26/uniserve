const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { languages } = require("../config/languages");
const FileManager = require("../utils/fileManager");
const { executeCode, compileCode } = require("./executionController");
const { extractClassName } = require("../utils/javaParser");

// Simple Java code validation
function validateJavaCode(javaCode) {
  const issues = [];
  
  if (!javaCode.trim()) {
    issues.push("Code is empty");
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

// Text handler function
async function textHandler(req, res) {
  const { solution, type, fields, language: langId, sessionId = null, timeout = null } = req.body;

  // Input validation
  if (!solution || typeof solution !== "string" || solution.trim() === "") {
    return res.status(400).json({ error: "Solution must be a non-empty string" });
  }
  if (!Number.isInteger(type)) {
    return res.status(400).json({ error: "Type must be an integer" });
  }
  if (typeof fields !== "string") {
    return res.status(400).json({ error: "Fields must be a string for text mode" });
  }
  if (!langId || !languages[langId]) {
    console.error(`Invalid language ID: ${langId}`);
    return res.status(400).json({ error: "Invalid or missing language ID" });
  }

  // Process multiple inputs from textarea (one input per line)
  const processedInput = fields.split('\n').filter(line => line.trim() !== '').join('\n');

  const config = languages[langId];
  const fileManager = new FileManager();
  const currentSessionId = sessionId || uuidv4();
  const executionTimeout = timeout || config.timeout;

  try {
    const sessionDir = fileManager.createSessionDir(currentSessionId);
    let filename;

    // Handle Java-specific processing
    if (langId === 62) { // Java
      // Validate Java code
      const validationIssues = validateJavaCode(solution);
      if (validationIssues.length > 0) {
        console.warn("Java validation warnings:", validationIssues);
      }

      // Extract class name from Java code
      try {
        const className = extractClassName(solution);
        console.log("Extracted class name:", className);
        filename = `${className}.${config.ext}`;
      } catch (parseErr) {
        console.error("Java class name extraction error:", parseErr.message);
        fileManager.cleanupSession(currentSessionId);
        return res.status(400).json({
          error: "Failed to extract class name from Java code",
          details: parseErr.message,
          validationIssues: validationIssues
        });
      }
    } else {
      // For non-Java languages, generate a simple filename
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
        
        if (typeof compileResult === "object" && compileResult.executablePath) {
          executablePath = compileResult.executablePath;
          sourcePath = compileResult.sourcePath || filePath;
        } else if (typeof compileResult === "string") {
          executablePath = compileResult;
        } else {
          throw new Error("Invalid return value from compileCode function");
        }
        
        console.log(`Compilation successful: ${executablePath}`);
      } catch (compileErr) {
        console.error("Compilation error:", compileErr.message);
        fileManager.cleanupSession(currentSessionId);
        return res.status(400).json({
          error: "Compilation failed",
          details: compileErr.message
        });
      }
    } else {
      executablePath = filePath;
    }

    // Execute code with processed input
    try {
      const result = await executeCode(
        langId,
        sourcePath,
        executablePath,
        processedInput,
        sessionDir,
        executionTimeout,
        true
      );

      console.log("Execution completed successfully");

      // Send response
      const responseData = {
        result,
        sessionId: currentSessionId,
        type,
        language: { id: config.id, name: config.name }
      };

      // Add Java-specific info if applicable
      if (langId === 62) {
        responseData.javaInfo = {
          filename,
          parserUsed: 'java-parser npm package'
        };
      }

      res.json(responseData);

      // Cleanup files
      if (config.compile && executablePath && executablePath !== sourcePath) {
        fileManager.cleanupFiles(sourcePath, executablePath);
      } else {
        fileManager.cleanupFiles(sourcePath);
      }
      
    } catch (execErr) {
      console.error("Execution error:", execErr.message);
      fileManager.cleanupSession(currentSessionId);
      return res.status(500).json({
        error: "Execution failed",
        details: execErr.message
      });
    }

  } catch (err) {
    console.error("Text handler error:", err);
    fileManager.cleanupSession(currentSessionId);
    res.status(500).json({ 
      error: "Internal server error", 
      details: err.message 
    });
  }
}

// Export everything
module.exports = { 
  textHandler,
};
