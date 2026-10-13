/**
 * WebRTC Real-Time Signaling and Meeting Room Socket Handler
 * Professional, low-latency signaling relay for peer-to-peer audio/video mesh
 */

// In-memory room participants tracking: roomId -> Map(socketId -> userData)
const interviewRooms = new Map();

/**
 * Configure all WebRTC signaling and interview room socket events
 * @param {import('socket.io').Server} io
 */
function setupWebRTCSockets(io) {
  io.on('connection', (socket) => {
    // 1. Join room
    socket.on('join-room', ({ roomId, user }) => {
      if (!roomId) return;

      socket.join(roomId);
      socket.roomId = roomId;
      socket.userData = user || { name: 'Participant', role: 'STUDENT' };

      if (!interviewRooms.has(roomId)) {
        interviewRooms.set(roomId, new Map());
      }
      const room = interviewRooms.get(roomId);
      room.set(socket.id, { socketId: socket.id, ...socket.userData });

      // Notify other participants in the room
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        user: socket.userData
      });

      // Send list of existing peers in room to the new participant
      const existingPeers = Array.from(room.values()).filter((p) => p.socketId !== socket.id);
      socket.emit('room-users', { peers: existingPeers });
    });

    // 2. WebRTC Signaling Relay (SDP Offer, Answer, ICE Candidate)
    socket.on('webrtc-signal', ({ targetSocketId, signalData, senderInfo }) => {
      const payload = {
        senderSocketId: socket.id,
        signalData,
        senderInfo: senderInfo || socket.userData
      };

      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-signal', payload);
      } else if (socket.roomId) {
        socket.to(socket.roomId).emit('webrtc-signal', payload);
      }
    });

    // 3. Audio / Video / Screen Share status toggle
    socket.on('media-toggle', ({ roomId, type, enabled }) => {
      const targetRoom = roomId || socket.roomId;
      if (targetRoom) {
        socket.to(targetRoom).emit('peer-media-toggle', {
          socketId: socket.id,
          type,
          enabled
        });
      }
    });

    // 4. Candidate waiting in lobby (Admission control)
    socket.on('candidate-waiting', ({ roomId, candidateInfo }) => {
      const targetRoom = roomId || socket.roomId;
      if (targetRoom) {
        socket.to(targetRoom).emit('candidate-waiting', {
          socketId: socket.id,
          candidate: candidateInfo || socket.userData
        });
      }
    });

    // 5. Host admits candidate
    socket.on('admit-candidate', ({ roomId, candidateSocketId }) => {
      if (candidateSocketId) {
        io.to(candidateSocketId).emit('candidate-admitted', {
          admittedBy: socket.id
        });
      }
      const targetRoom = roomId || socket.roomId;
      if (targetRoom) {
        io.to(targetRoom).emit('candidate-joined-officially', {
          candidateSocketId
        });
      }
    });

    // 6. Host denies candidate entry
    socket.on('deny-candidate', ({ roomId, candidateSocketId }) => {
      if (candidateSocketId) {
        io.to(candidateSocketId).emit('candidate-denied', {
          deniedBy: socket.id
        });
      }
    });

    // 7. In-call text messaging
    socket.on('send-chat', ({ roomId, message }) => {
      const targetRoom = roomId || socket.roomId;
      if (targetRoom && message) {
        io.to(targetRoom).emit('new-chat', {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          senderSocketId: socket.id,
          senderName: socket.userData?.name || 'Participant',
          senderRole: socket.userData?.role || 'STUDENT',
          text: message,
          time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        });
      }
    });

    // 8. Hand raise toggle
    socket.on('toggle-hand-raise', ({ roomId, raised }) => {
      const targetRoom = roomId || socket.roomId;
      if (targetRoom) {
        socket.to(targetRoom).emit('user-hand-raised', {
          socketId: socket.id,
          userName: socket.userData?.name || 'Participant',
          raised
        });
      }
    });

    // 9. Status acknowledgment / reaction broadcast (Professional text signals)
    socket.on('send-reaction', ({ roomId, actionType, label }) => {
      const targetRoom = roomId || socket.roomId;
      if (targetRoom) {
        io.to(targetRoom).emit('user-reaction', {
          socketId: socket.id,
          userName: socket.userData?.name || 'Participant',
          actionType: actionType || 'acknowledged',
          label: label || 'Acknowledged',
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
        });
      }
    });

    // 10. Explicit Leave Room
    socket.on('leave-room', () => {
      handleUserDisconnect(socket);
    });

    // 11. Disconnect
    socket.on('disconnect', () => {
      handleUserDisconnect(socket);
    });
  });
}

/**
 * Handle socket disconnection and notify room peers
 * @param {import('socket.io').Socket} socket
 */
function handleUserDisconnect(socket) {
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
  }
}

module.exports = {
  setupWebRTCSockets,
  interviewRooms
};
