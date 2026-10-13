const meetingController = require('./meetingController');
const webrtcController = require('./webrtcController');
const { setupWebRTCSockets, interviewRooms } = require('./webrtcSocketHandler');

module.exports = {
  // Meeting management methods
  getMeetings: meetingController.getMeetings,
  getMeetingByCode: meetingController.getMeetingByCode,
  createMeeting: meetingController.createMeeting,
  updateMeetingStatus: meetingController.updateMeetingStatus,
  evaluateMeeting: meetingController.evaluateMeeting,
  deleteMeeting: meetingController.deleteMeeting,

  // WebRTC ICE / STUN methods
  getIceServers: webrtcController.getIceServers,
  validateRoomAccess: webrtcController.validateRoomAccess,
  STUN_SERVERS: webrtcController.STUN_SERVERS,

  // Socket signaling initializer
  setupWebRTCSockets,
  interviewRooms
};
