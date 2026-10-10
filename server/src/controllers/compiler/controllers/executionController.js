const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const which = require('which');
const FileManager = require('../utils/fileManager');
const { languages } = require('../config/languages');

async function compileCode(langId, filePath, sessionDir, filename, fileManager, config) {
    let executablePath = null;
    const isWin = process.platform === 'win32';
    let sourcePath = filePath;

    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Source file not found: ${filePath}`);
        }

        if (!config.compile) {
            return filePath;
        }

        try {
            await which(config.cmd);
        } catch (err) {
            throw new Error(`Compiler command not found: ${config.cmd}. Ensure ${config.name} compiler is installed and in PATH.`);
        }

        if (langId === 62) { // Java
            const compileArgs = [filePath];
            const compileProcess = spawn(config.cmd, compileArgs, {
                cwd: sessionDir,
                stdio: 'pipe'
            });

            let compileOutput = '';
            compileProcess.stderr.on('data', (data) => {
                compileOutput += data.toString();
            });

            const code = await new Promise((resolve) => {
                compileProcess.on('close', resolve);
            });

            if (code !== 0) {
                throw new Error(compileOutput || 'Compilation failed');
            }

            const className = path.basename(filePath, '.java');
            executablePath = path.join(sessionDir, `${className}.class`);

            if (!fs.existsSync(executablePath)) {
                throw new Error('No class file generated');
            }

            return { executablePath, sourcePath };
        } else {
            // Non-Java compilation
            const compileArgs = config.compileArgs.map(arg =>
                arg === 'OUTPUT' ? path.join(sessionDir, 'output' + (isWin ? '.exe' : '')) :
                arg === 'DIRECTORY' ? sessionDir :
                arg
            );

            const compileProcess = spawn(config.cmd, [filePath,...compileArgs], {
                cwd: sessionDir,
                stdio: 'pipe'
            });

            let compileOutput = '';
            compileProcess.stderr.on('data', (data) => {
                compileOutput += data.toString();
            });

            await new Promise((resolve, reject) => {
                compileProcess.on('close', (code) => {
                    if (code === 0) {
                        executablePath = path.join(sessionDir, 'output' + (isWin ? '.exe' : ''));
                        resolve();
                    } else {
                        reject(new Error(compileOutput || 'Compilation failed'));
                    }
                });
                compileProcess.on('error', (err) => {
                    reject(new Error(`Compilation process error: ${err.message}`));
                });
            });
            return executablePath;
        }
    } catch (err) {
        console.error('Compile error:', err);
        throw new Error(`Compilation failed: ${err.message}`);
    }
}

async function executeCode(langId, filePath, executablePath, input, workDir, timeout, measureMemory = true) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const config = languages[langId];
        let runtimeCmd = config.runtimeCmd;
        const isWin = process.platform === 'win32';
        if (config.compile && (runtimeCmd === './OUTPUT' || runtimeCmd === 'OUTPUT.exe')) {
            runtimeCmd = isWin ? 'output.exe' : './output';
        }
        let cmd = runtimeCmd;
        let args;

        if (config.compile) {
            args = config.runtimeArgs.map(arg =>
                arg === 'DIRECTORY' ? workDir :
                arg === 'CLASSNAME' ? path.basename(filePath, '.java') :
                arg === 'OUTPUT' ? executablePath :
                arg
            );
            
            // Special handling for Java - use the class name from the file path
            if (langId === 62) { // Java
                const className = path.basename(filePath, '.java');
                args = [className]; // Replace all args with just the class name
            }
        } else {
            cmd = config.cmd;
            args = [...config.runtimeArgs, filePath];
        }

        if (config.compile && (config.runtimeCmd === './OUTPUT' || config.runtimeCmd === 'OUTPUT.exe')) {
            cmd = executablePath;
            args = [];
        } else {
            try {
                await which(cmd);
            } catch (err) {
                console.log('which error', err);
                throw new Error(`Runtime command not found: ${cmd}. Ensure ${config.name} runtime is installed and in PATH.`);
            }
        }

        let useTime = measureMemory && !isWin;
        if (useTime) {
            try {
                await which('/usr/bin/time');
            } catch (err) {
                console.warn('GNU time not available, memory measurement disabled');
                useTime = false;
            }
            if (useTime) {
                args = ['-f', '\nMAX_MEMORY_KB: %M\nELAPSED_TIME: %E', '--', cmd, ...args];
                cmd = '/usr/bin/time';
            }
        }

        const childProcess = spawn(cmd, args, {
            cwd: workDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false
        });

        const startTime = Date.now();
        let stdoutCollected = '';
        let stderrCollected = '';
        let cpuUsage = 0;

        const cpuCheckInterval = setInterval(() => {
            if (childProcess.pid && !childProcess.killed) {
                cpuUsage += 1;
                if (cpuUsage > 1000) {
                    childProcess.kill('SIGTERM');
                    stderrCollected += 'Possible infinite loop detected\n';
                }
            }
        }, 100);

        childProcess.stdout.on('data', (data) => {
            stdoutCollected += data.toString();
        });

        childProcess.stderr.on('data', (data) => {
            stderrCollected += data.toString();
        });

        const timeoutHandle = setTimeout(() => {
            if (!childProcess.killed) {
                childProcess.kill('SIGTERM');
                setTimeout(() => {
                    if (!childProcess.killed) childProcess.kill('SIGKILL');
                }, 1000);
                stderrCollected += 'Execution timed out\n';
            }
        }, timeout);

        if (input && input.trim()) {
            childProcess.stdin.write(input + '\n');
        }
        childProcess.stdin.end();

        return new Promise((resolve) => {
            childProcess.on('close', (code, signal) => {
                clearTimeout(timeoutHandle);
                clearInterval(cpuCheckInterval);

                let memory = 0;
                let time = Date.now() - startTime;
                let stderr = stderrCollected;

                if (useTime) {
                    const memoryMatch = stderrCollected.match(/MAX_MEMORY_KB: (\d+)/);
                    if (memoryMatch) memory = parseInt(memoryMatch[1]);

                    const timeMatch = stderrCollected.match(/ELAPSED_TIME: (.*)/);
                    if (timeMatch) {
                        const timeStr = timeMatch[1].trim();
                        const parts = timeStr.split(':').reverse();
                        const sec = parseFloat(parts[0]);
                        const min = parts[1] ? parseInt(parts[1]) : 0;
                        const hour = parts[2] ? parseInt(parts[2]) : 0;
                        time = ((hour * 3600 + min * 60) + sec) * 1000;
                    }

                    stderr = stderrCollected.replace(/\nMAX_MEMORY_KB: \d+\nELAPSED_TIME: .*\n?/, '');
                }

                resolve({
                    stdout: stdoutCollected,
                    stderr,
                    code,
                    signal,
                    time,
                    memory
                });
            });

            childProcess.on('error', (err) => {
                clearTimeout(timeoutHandle);
                clearInterval(cpuCheckInterval);
                resolve({ error: err.message });
            });
        });
    } catch (err) {
        console.error('Execution error:', err);
        throw err;
    }
}

module.exports = { compileCode, executeCode };
