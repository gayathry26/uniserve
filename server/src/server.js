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

// ── WEBRTC REAL-TIME SIGNALING & INTERVIEW ROOM SOCKETS ──
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

const interviewRooms = new Map(); // roomId -> Map(socketId -> userData)

io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET CONNECTED] ${socket.id}`);

  // Join an interview meeting room
  socket.on('join-room', ({ roomId, user }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userData = user;

    if (!interviewRooms.has(roomId)) {
      interviewRooms.set(roomId, new Map());
    }
    const currentRoom = interviewRooms.get(roomId);
    currentRoom.set(socket.id, { socketId: socket.id, ...user });

    // Announce to other participants
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      user
    });

    // Provide existing participants to newcomer
    const existingPeers = Array.from(currentRoom.values()).filter(p => p.socketId !== socket.id);
    socket.emit('room-users', { peers: existingPeers });

    console.log(`📹 [MEET ROOM] ${user?.name || socket.id} (${user?.role || 'Guest'}) entered room: ${roomId}`);
  });

  // Relay WebRTC signaling (Offer, Answer, ICE candidates)
  socket.on('webrtc-signal', ({ targetSocketId, signalData, senderInfo }) => {
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-signal', {
        senderSocketId: socket.id,
        signalData,
        senderInfo: senderInfo || socket.userData
      });
    } else if (socket.roomId) {
      socket.to(socket.roomId).emit('webrtc-signal', {
        senderSocketId: socket.id,
        signalData,
        senderInfo: senderInfo || socket.userData
      });
    }
  });

  // Camera / Microphone state change sync
  socket.on('media-toggle', ({ roomId, type, enabled }) => {
    socket.to(roomId).emit('peer-media-toggle', {
      socketId: socket.id,
      type,
      enabled
    });
  });

  // Floating emoji reaction
  socket.on('send-reaction', ({ roomId, emoji }) => {
    io.to(roomId).emit('user-reaction', {
      socketId: socket.id,
      userName: socket.userData?.name || 'Participant',
      emoji,
      id: Date.now() + Math.random()
    });
  });

  // Host admission control (candidate waiting in lobby)
  socket.on('candidate-waiting', ({ roomId, candidateInfo }) => {
    socket.to(roomId).emit('candidate-waiting', {
      socketId: socket.id,
      candidate: candidateInfo
    });
  });

  // Host admits candidate
  socket.on('admit-candidate', ({ roomId, candidateSocketId }) => {
    io.to(candidateSocketId).emit('candidate-admitted', {
      admittedBy: socket.id
    });
    // Broadcast to room
    io.to(roomId).emit('candidate-joined-officially', {
      candidateSocketId
    });
  });

  // Host denies candidate
  socket.on('deny-candidate', ({ roomId, candidateSocketId }) => {
    io.to(candidateSocketId).emit('candidate-denied', {
      deniedBy: socket.id
    });
  });

  // In-call text messages
  socket.on('send-chat', ({ roomId, message }) => {
    io.to(roomId).emit('new-chat', {
      id: Date.now() + Math.random(),
      senderSocketId: socket.id,
      senderName: socket.userData?.name || 'Participant',
      senderRole: socket.userData?.role || 'STUDENT',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    });
  });

  // Hand raise notification
  socket.on('toggle-hand-raise', ({ roomId, raised }) => {
    socket.to(roomId).emit('user-hand-raised', {
      socketId: socket.id,
      userName: socket.userData?.name || 'Participant',
      raised
    });
  });

  // Clean disconnection
  socket.on('disconnect', () => {
    if (socket.roomId && interviewRooms.has(socket.roomId)) {
      const room = interviewRooms.get(socket.roomId);
      room.delete(socket.id);
      if (room.size === 0) {
        interviewRooms.delete(socket.roomId);
      }
      socket.to(socket.roomId).emit('user-left', {
        socketId: socket.id,
        user: socket.userData
      });
      console.log(`👋 [USER LEFT] ${socket.id} exited room: ${socket.roomId}`);
    }
  });
});

// Start Server
if (require.main === module) {
  server.listen(PORT, async () => {
    console.log('================================================================');
    console.log(`🚀 [BACKEND READY] Server + WebRTC Sockets listening on http://localhost:${PORT}`);
    console.log(`📡 REST API Prefix: http://localhost:${PORT}/api/v1`);
    console.log(`📹 WebRTC Meet Sockets: Active on ws://localhost:${PORT}`);
    console.log(`🩺 System Health:  http://localhost:${PORT}/api/v1/health`);
    console.log('================================================================');

    // Startup Diagnostic Check
    const compilers = await detectCompilers();
    console.log('\n🔍 [ASSESSMENT COMPILER AUDIT]');
    console.log(`- Python 3: ${compilers.python.available ? '✅ Available (' + compilers.python.version + ')' : '❌ Missing (' + compilers.python.error + ')'}`);
    console.log(`- C (GCC):  ${compilers.c.available ? '✅ Available (' + compilers.c.version + ')' : '⚠️ Not in PATH (' + compilers.c.error + ')'}`);
    console.log(`- C++ (G++): ${compilers.cpp.available ? '✅ Available (' + compilers.cpp.version + ')' : '⚠️ Not in PATH (' + compilers.cpp.error + ')'}`);
    console.log(`- Java:     ${compilers.java.available ? '✅ Available (' + compilers.java.version + ')' : '⚠️ Not in PATH (' + compilers.java.error + ')'}`);
  });
}

module.exports = { app, server, io };
