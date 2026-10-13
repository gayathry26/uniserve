const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { checkDatabaseHealth } = require('./config/db');
const { detectCompilers } = require('./services/compilerService');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend applications
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// System Health Endpoint
app.get('/api/v1/health', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  const compilerHealth = await detectCompilers();

  res.json({
    status: 'UP',
    system: 'College Placement Management System (LMS)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    databases: dbHealth,
    compilers: compilerHealth,
  });
});

// Swagger / OpenAPI documentation JSON specification
app.get('/api-docs/json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'College Placement LMS Master REST API',
      version: '1.0.0',
      description: 'Enterprise REST API powering 7 portals, multi-database department isolation, and online programming assessments.',
    },
    servers: [{ url: `http://localhost:${PORT}/api/v1` }],
  });
});

// Mount Main API Routes
app.use('/api/v1', apiRoutes);

// 404 Handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling
app.use(errorHandler);

// WebRTC Real-Time Signaling & Interview Room Sockets
const { setupWebRTCSockets } = require('./controllers/videocall');
const { setupMockInterviews } = require('./database/createMockInterviews');

const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

setupWebRTCSockets(io);

// Start Server
if (require.main === module) {
  server.listen(PORT, async () => {
    console.log('================================================================');
    console.log(`[BACKEND SERVER] REST API and WebRTC Sockets listening on http://localhost:${PORT}`);
    console.log(`[REST API] http://localhost:${PORT}/api/v1`);
    console.log(`[WEBRTC SIGNALING] Active on ws://localhost:${PORT}`);
    console.log(`[SYSTEM HEALTH] http://localhost:${PORT}/api/v1/health`);
    console.log('================================================================');

    // Ensure mock interviews table is ready
    try {
      await setupMockInterviews();
    } catch (err) {
      console.error('[DATABASE] Mock interviews setup error:', err.message);
    }

    // Startup Diagnostic Check
    const compilers = await detectCompilers();
    console.log('\n[ASSESSMENT COMPILER AUDIT]');
    console.log(`- Python 3: ${compilers.python.available ? 'Available (' + compilers.python.version + ')' : 'Missing (' + compilers.python.error + ')'}`);
    console.log(`- C (GCC):  ${compilers.c.available ? 'Available (' + compilers.c.version + ')' : 'Not in PATH (' + compilers.c.error + ')'}`);
    console.log(`- C++ (G++): ${compilers.cpp.available ? 'Available (' + compilers.cpp.version + ')' : 'Not in PATH (' + compilers.cpp.error + ')'}`);
    console.log(`- Java:     ${compilers.java.available ? 'Available (' + compilers.java.version + ')' : 'Not in PATH (' + compilers.java.error + ')'}`);
  });
}

module.exports = { app, server, io };
