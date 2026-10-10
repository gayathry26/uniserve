const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const pdfParse = require('pdf-parse');

const UPLOAD_DIR = path.join(__dirname, '../uploads');
const ORG_DIR = path.join(__dirname, '../organized_resumes');
const PROCESSED_DIR = path.join(__dirname, '../processed_resumes');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Ensure directories exist
async function initializeDirectories() {
    for (const dir of [UPLOAD_DIR, ORG_DIR, PROCESSED_DIR]) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (err) {
            console.error(`Failed to create directory ${dir}: ${err.message}`);
        }
    }
}
initializeDirectories();

async function extractTextFromPdf(pdfPath) {
    try {
        const dataBuffer = await fs.readFile(pdfPath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        throw new Error('Failed to extract text from PDF');
    }
}

async function analyzeResumeWithDeepSeek(resumeText) {
    const prompt = `
Analyze the following resume and extract:
1. Candidate Full Name
2. Primary Job Role (e.g., Frontend Developer, Data Scientist)

Format your response exactly as:
Name: <full name>
Role: <job role>

Resume Content:
${resumeText.substring(0, 10000)}
`;

    const response = await axios.post(
        DEEPSEEK_API_URL,
        {
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 200
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            timeout: 20000
        }
    );

    if (
        !response.data ||
        !Array.isArray(response.data.choices) ||
        !response.data.choices[0] ||
        !response.data.choices[0].message ||
        typeof response.data.choices[0].message.content !== 'string'
    ) {
        throw new Error('Invalid response from DeepSeek API');
    }

    return response.data.choices[0].message.content;
}

function parseAnalysisResult(resultText) {
    let name = 'Unknown';
    let role = 'Uncategorized';

    const lines = resultText.split('\n');
    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith('name:')) {
            name = line.split(':')[1]?.trim().replace(/[^a-zA-Z0-9-_]/g, '_') || 'Unknown';
        } else if (lowerLine.startsWith('role:')) {
            role = line.split(':')[1]?.trim().replace(/[^a-zA-Z0-9-_]/g, '_') || 'Uncategorized';
        }
    }

    return { name, role };
}

async function organizeResume(pdfPath) {
    try {
        const text = await extractTextFromPdf(pdfPath);
        const analysis = await analyzeResumeWithDeepSeek(text);
        const { name, role } = parseAnalysisResult(analysis);

        const categoryFolder = path.join(ORG_DIR, role);
        await fs.mkdir(categoryFolder, { recursive: true });

        const baseName = `${name}_${role}`;
        let counter = 1;
        let newFilename = `${baseName}.pdf`;
        let newPath = path.join(categoryFolder, newFilename);

        while (await fs.access(newPath).then(() => true).catch(() => false)) {
            newFilename = `${baseName}_${counter}.pdf`;
            newPath = path.join(categoryFolder, newFilename);
            counter++;
        }

        await fs.rename(pdfPath, newPath);
        const relativePath = path.join(role, newFilename).replace(/\\/g, '/');
        return { success: true, path: relativePath, category: role, filename: newFilename };
    } catch (error) {
        const errorPath = path.join(PROCESSED_DIR, path.basename(pdfPath));
        try {
            await fs.rename(pdfPath, errorPath);
        } catch (_) {}
        return { success: false, error: error.message };
    }
}

// Controller handlers

async function handleUpload(req, res) {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    for (const file of req.files) {
        try {
            const result = await organizeResume(file.path);
            results.push({
                originalname: file.originalname,
                status: result.success ? 'processed' : 'failed',
                path: result.path,
                category: result.category,
                filename: result.filename,
                error: result.error
            });
        } catch (e) {
            results.push({
                originalname: file.originalname,
                status: 'failed',
                error: e.message
            });
        }
    }

    return res.json({
        message: `Processed ${results.filter(r => r.status === 'processed').length} of ${req.files.length} resumes`,
        details: results
    });
}

async function listResumes(req, res) {
    try {
        const resumes = [];
        const categories = (await fs.readdir(ORG_DIR, { withFileTypes: true }))
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const category of categories) {
            const categoryPath = path.join(ORG_DIR, category);
            const files = (await fs.readdir(categoryPath))
                .filter(file => path.extname(file).toLowerCase() === '.pdf');

            for (const file of files) {
                const relativePath = path.join(category, file).replace(/\\/g, '/');
                resumes.push({
                    filename: file,
                    path: relativePath,
                    category
                });
            }
        }

        res.json(resumes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch resumes' });
    }
}

async function deleteResume(req, res) {
    try {
        const { category, filename } = req.params;
        const resumePath = path.join(ORG_DIR, category, filename);
        const resolvedPath = path.resolve(resumePath);

        // Prevent path traversal
        if (!resolvedPath.startsWith(path.resolve(ORG_DIR))) {
            return res.status(403).json({ error: 'Invalid file path' });
        }

        if (!(await fs.access(resumePath).then(() => true).catch(() => false))) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        await fs.unlink(resumePath);
        res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete resume' });
    }
}

module.exports = {
    handleUpload,
    listResumes,
    deleteResume
};
