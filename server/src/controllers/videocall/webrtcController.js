/**
 * WebRTC STUN / TURN server configuration and network infrastructure
 */

// Production-ready public STUN server list
const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

/**
 * Return ICE servers configuration for client WebRTC peer connections
 */
function getIceServers(req, res) {
  // Allow optional custom STUN/TURN configuration via environment variables
  const customTurnServer = process.env.TURN_SERVER_URL;
  const customTurnUser = process.env.TURN_SERVER_USERNAME;
  const customTurnCredential = process.env.TURN_SERVER_CREDENTIAL;

  const iceServers = [...STUN_SERVERS];

  if (customTurnServer) {
    const turnConfig = { urls: customTurnServer };
    if (customTurnUser) turnConfig.username = customTurnUser;
    if (customTurnCredential) turnConfig.credential = customTurnCredential;
    iceServers.push(turnConfig);
  }

  res.json({
    success: true,
    data: {
      iceServers,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    }
  });
}

/**
 * Validate room token or admission capabilities
 */
function validateRoomAccess(req, res) {
  const { roomCode } = req.params;
  const userRole = req.user?.role_name || 'STUDENT';
  const isHost = ['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'FACULTY_COORDINATOR', 'STAFF', 'RECRUITER'].includes(userRole);

  res.json({
    success: true,
    data: {
      roomCode,
      isHost,
      requiresAdmission: !isHost,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = {
  getIceServers,
  validateRoomAccess,
  STUN_SERVERS
};
