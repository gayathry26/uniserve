const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { languages, languageMap } = require('../config/languages');
const FileManager = require('../utils/fileManager');
const { executeCode, compileCode } = require('./executionController');
const { extractClassName } = require('../utils/javaParser');

async function interactiveHandler(req, res) {
    const { solution, input = '', type, language: langId, sessionId = null, timeout = null } = req.body;

    if (!solution || typeof solution !== 'string') {
        return res.status(400).json({ error: 'Solution must be a non-empty string' });
    }
    if (typeof input !== 'string') {
        return res.status(400).json({ error: 'Input must be a string' });
    }
    if (!Number.isInteger(type)) {
        return res.status(400).json({ error: 'Type must be an integer' });
    }
    if (!langId || !languages[langId]) {
        console.error(`Invalid language ID: ${langId}`);
        return res.status(400).json({ error: 'Invalid or missing language ID' });
    }

    const config = languages[langId];
    const fileManager = new FileManager();
    const currentSessionId = sessionId || uuidv4();
    const executionId = uuidv4();
    const executionTimeout = timeout || config.timeout * 10;

    try {
        const sessionDir = fileManager.createSessionDir(currentSessionId);
        let filename;

        if (langId === 62) { // Java
            try {
                const className = extractClassName(solution);
                filename = `${className}.${config.ext}`;
            } catch (parseError) {
                return res.status(400).json({ error: 'Invalid Java code', details: parseError.message });
            }
        } else {
            filename = fileManager.generateFilename(config.ext);
        }

        const filePath = path.join(sessionDir, filename);
        fileManager.writeFile(filePath, solution);

        let executablePath = null;
        let sourcePath = filePath;
        if (config.compile) {
            const compileResult = await compileCode(langId, filePath, sessionDir, filename, fileManager, config);
            if (typeof compileResult === 'object') {
                executablePath = compileResult.executablePath;
                sourcePath = compileResult.sourcePath;
            } else {
                executablePath = compileResult;
            }
        } else {
            executablePath = filePath;
        }

        const result = await executeCode(
            langId,
            sourcePath,
            executablePath,
            input,
            sessionDir,
            executionTimeout
        );

        res.json({ 
            result,
            executionId,
            sessionId: currentSessionId,
            type,
            language: { id: config.id, name: config.name },
            interactive: true // Flag to indicate this is interactive mode
        });

        fileManager.cleanupFiles(sourcePath, config.compile ? executablePath : null);

    } catch (err) {
        console.error('Interactive handler error:', err);
        fileManager.cleanupSession(currentSessionId);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}

module.exports = { interactiveHandler };