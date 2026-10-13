const videocall = require('./videocall');

/**
 * Legacy wrapper for Mock Interview Controller
 * Delegates to modular videocall folder controller
 */
module.exports = {
  getMockInterviews: videocall.getMeetings,
  getMockInterviewByCode: videocall.getMeetingByCode,
  createMockInterview: videocall.createMeeting,
  evaluateMockInterview: videocall.evaluateMeeting,
  updateMeetingStatus: videocall.updateMeetingStatus,
  deleteMeeting: videocall.deleteMeeting,
  getIceServers: videocall.getIceServers
};
