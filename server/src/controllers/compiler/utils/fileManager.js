const fs = require('fs');
const path = require('path');
const { extractClassName } = require('./javaParser');

class FileManager {
    constructor(baseDir = path.join(__dirname, '../temp')) {
        this.TEMP_DIR = baseDir;
        try {
            if (!fs.existsSync(this.TEMP_DIR)) {
                fs.mkdirSync(this.TEMP_DIR, { recursive: true });
            }
            const stats = fs.statfsSync(this.TEMP_DIR);
            const freeSpaceMB = stats.bavail * stats.bsize / (1024 * 1024);
            if (freeSpaceMB < 100) {
                throw new Error(`Insufficient disk space: ${freeSpaceMB.toFixed(2)} MB available`);
            }
        } catch (err) {
            console.error('Failed to initialize temp directory:', err);
            throw new Error(`Failed to initialize temp directory: ${err.message}`);
        }
    }

    generateFilename(ext, prefix = 'code') {
        return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
    }

    /**
     * Generates a filename for Java code based on the class name
     * @param {string} javaCode - The Java source code
     * @returns {string} The filename using the class name
     * @throws {Error} If no class is found in the code
     */
    generateJavaFilename(javaCode) {
        try {
            const className = extractClassName(javaCode);
            return `${className}.java`;
        } catch (error) {
            // Fallback to regular filename generation if class extraction fails
            console.warn(`Failed to extract class name: ${error.message}. Using fallback filename.`);
            return this.generateFilename('java');
        }
    }

    createSessionDir(sessionId) {
        const sessionDir = path.join(this.TEMP_DIR, sessionId);
        try {
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }
            fs.accessSync(sessionDir, fs.constants.W_OK);
            return sessionDir;
        } catch (err) {
            console.error('Failed to create session directory:', err);
            throw new Error(`Failed to create session directory: ${err.message}`);
        }
    }

    writeFile(filePath, content) {
        let fd;
        try {
            fd = fs.openSync(filePath, 'w');
            fs.writeFileSync(fd, content, { encoding: 'utf8' });
            if (!fs.existsSync(filePath)) {
                throw new Error('File write verification failed');
            }
        } catch (err) {
            console.error('Failed to write file:', err);
            throw new Error(`Failed to write file: ${err.message}`);
        } finally {
            if (fd) {
                try {
                    fs.closeSync(fd);
                } catch (err) {
                    console.error(`Failed to close file ${filePath}:`, err);
                }
            }
        }
    }

    cleanupFiles(filePath, executablePath = null, additionalFiles = []) {
        try {
            const filesToClean = [filePath, executablePath, ...additionalFiles].filter(Boolean);

            if (filePath && filePath.endsWith('.java')) {
                const dir = path.dirname(filePath);
                fs.readdirSync(dir).forEach(file => {
                    if (file.endsWith('.class')) {
                        filesToClean.push(path.join(dir, file));
                    }
                });
            }

            // Delete files
            filesToClean.forEach(file => {
                if (fs.existsSync(file)) {
                    try {
                        fs.unlinkSync(file);
                    } catch (err) {
                        console.error(`Failed to delete file ${file}:`, err);
                    }
                }
            });

            // Delete parent folder if empty
            if (filePath) {
                const dir = path.dirname(filePath);
                this.deleteEmptyDirsUp(dir);
            }
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    }

    deleteEmptyDirsUp(dir) {
        try {
            while (dir.startsWith(this.TEMP_DIR)) {
                if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
                    fs.rmdirSync(dir);
                    dir = path.dirname(dir);
                } else {
                    break;
                }
            }
        } catch (err) {
            console.error(`Failed to delete folder ${dir}:`, err);
        }
    }

    cleanupSession(sessionId) {
        try {
            const sessionDir = path.join(this.TEMP_DIR, sessionId);
            if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
            }
        } catch (err) {
            console.error('Session cleanup error:', err);
        }
    }
}

module.exports = FileManager;
