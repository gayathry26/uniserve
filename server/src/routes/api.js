const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { enforceDepartmentIsolation } = require('../middleware/deptIsolation');

// Controllers
const authCtrl = require('../controllers/authController');
const dashCtrl = require('../controllers/dashboardController');
const studentCtrl = require('../controllers/studentController');
const compCtrl = require('../controllers/companyController');
const jobCtrl = require('../controllers/jobController');
const driveCtrl = require('../controllers/driveController');
const appCtrl = require('../controllers/applicationController');
const intCtrl = require('../controllers/interviewController');
const mockIntCtrl = require('../controllers/mockInterviewController');
const videocallCtrl = require('../controllers/videocall');
const assessCtrl = require('../controllers/assessmentController');
const trainCtrl = require('../controllers/trainingController');
const internCtrl = require('../controllers/internshipController');
const offerCtrl = require('../controllers/offerController');
const policyCtrl = require('../controllers/policyController');
const notifCtrl = require('../controllers/notificationController');
const alumniCtrl = require('../controllers/alumniController');
const grievCtrl = require('../controllers/grievanceController');
const finCtrl = require('../controllers/financeController');
const reportCtrl = require('../controllers/reportController');
const adminCtrl = require('../controllers/adminController');
const aiCtrl = require('../controllers/aiController');
const rolePermCtrl = require('../controllers/rolePermissionController');

// 1. Authentication & Role Switcher
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticateToken, authCtrl.getCurrentUser);
router.post('/auth/switch-role', authCtrl.quickSwitchDemoRole);

// 1b. Role Permissions & Dynamic Page Governance (Backend Persistence)
router.get('/permissions', rolePermCtrl.getRolePermissions);
router.get('/permissions/me', authenticateToken, rolePermCtrl.getCurrentUserPermissions);
router.put('/permissions', authenticateToken, authorize(['SUPER_ADMIN']), rolePermCtrl.updateRolePermissions);
router.post('/permissions/reset', authenticateToken, authorize(['SUPER_ADMIN']), rolePermCtrl.resetRolePermissions);

// 2. Dashboards (Live Metrics)
router.get('/dashboard/metrics', authenticateToken, dashCtrl.getDashboardMetrics);

// 3. Students
router.get('/students', authenticateToken, studentCtrl.getAllStudents);
router.get('/students/:id', authenticateToken, studentCtrl.getStudentById);
router.put('/students/:id/profile', authenticateToken, studentCtrl.updateStudentProfile);
router.post('/students/sync-erp', authenticateToken, studentCtrl.syncFromErp);

// 4. Companies & Placement Drives
router.get('/companies', authenticateToken, compCtrl.getAllCompanies);
router.get('/companies/meta/departments', authenticateToken, compCtrl.getMetadata);
router.get('/companies/:id', authenticateToken, compCtrl.getCompanyById);
router.post('/companies', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN']), compCtrl.createCompany);
router.put('/companies/:id', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN']), compCtrl.updateCompany);
router.delete('/companies/:id', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN']), compCtrl.deleteCompany);
router.post('/companies/:id/apply', authenticateToken, compCtrl.applyCompanyDrive);
router.post('/companies/:id/withdraw', authenticateToken, compCtrl.withdrawCompanyApplication);

// 4b. Company Applicants, Announcements & Rounds Management
router.get('/companies/:id/applicants', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'FACULTY_COORDINATOR']), compCtrl.getCompanyApplicants);
router.put('/companies/:id/applicants/:applicationId', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN']), compCtrl.updateCompanyApplicant);
router.post('/companies/:id/applicants/bulk-update', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN']), compCtrl.bulkUpdateCompanyApplicants);
router.get('/companies/:id/announcements', authenticateToken, compCtrl.getCompanyAnnouncements);
router.post('/companies/:id/announcements', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN']), compCtrl.createCompanyAnnouncement);
router.put('/companies/:id/rounds/:roundId', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN']), compCtrl.updateDriveRound);

// 5. Jobs & Opportunities
router.get('/jobs', authenticateToken, jobCtrl.getAllJobs);
router.get('/jobs/:id', authenticateToken, jobCtrl.getJobById);
router.post('/jobs', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'RECRUITER']), jobCtrl.createJob);
router.put('/jobs/:id/status', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN']), jobCtrl.updateJobStatus);

// 6. Placement Drives & Rounds
router.get('/drives', authenticateToken, driveCtrl.getAllDrives);
router.post('/drives', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN']), driveCtrl.createDrive);
router.put('/drives/:id/stage', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'RECRUITER']), driveCtrl.updateDriveStage);

// 7. Applications
router.get('/applications', authenticateToken, appCtrl.getApplications);
router.get('/applications/my-applications', authenticateToken, appCtrl.getMyApplications);
router.get('/applications/my', authenticateToken, appCtrl.getMyApplications);
router.post('/applications/apply', authenticateToken, appCtrl.applyToJob);
router.post('/applications/:id/withdraw', authenticateToken, appCtrl.withdrawApplication);
router.put('/applications/:id/status', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'RECRUITER', 'FACULTY_COORDINATOR']), appCtrl.updateApplicationStatus);

// 8. Interviews
router.get('/interviews', authenticateToken, intCtrl.getInterviews);
router.post('/interviews/schedule', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'RECRUITER']), intCtrl.scheduleInterview);
router.put('/interviews/:id/feedback', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'RECRUITER']), intCtrl.submitInterviewFeedback);

// 8b. Mock Video Call Interviews (WebRTC Meet System)
router.get('/mock-interviews/ice-servers', authenticateToken, videocallCtrl.getIceServers);
router.get('/mock-interviews', authenticateToken, videocallCtrl.getMeetings);
router.get('/mock-interviews/:roomCode', authenticateToken, videocallCtrl.getMeetingByCode);
router.post('/mock-interviews', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'FACULTY_COORDINATOR', 'STAFF', 'RECRUITER']), videocallCtrl.createMeeting);
router.put('/mock-interviews/:id/status', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'FACULTY_COORDINATOR', 'STAFF', 'RECRUITER']), videocallCtrl.updateMeetingStatus);
router.put('/mock-interviews/:id/evaluate', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'FACULTY_COORDINATOR', 'STAFF', 'RECRUITER']), videocallCtrl.evaluateMeeting);
router.delete('/mock-interviews/:id', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'FACULTY_COORDINATOR', 'STAFF']), videocallCtrl.deleteMeeting);

// 8c. Dedicated WebRTC Video Call Endpoints
router.get('/videocall/ice-servers', authenticateToken, videocallCtrl.getIceServers);
router.get('/videocall/meetings', authenticateToken, videocallCtrl.getMeetings);
router.get('/videocall/meetings/:roomCode', authenticateToken, videocallCtrl.getMeetingByCode);
router.post('/videocall/meetings', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'FACULTY_COORDINATOR', 'STAFF', 'RECRUITER']), videocallCtrl.createMeeting);
router.put('/videocall/meetings/:id/status', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'FACULTY_COORDINATOR', 'STAFF', 'RECRUITER']), videocallCtrl.updateMeetingStatus);
router.put('/videocall/meetings/:id/evaluate', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'FACULTY_COORDINATOR', 'STAFF', 'RECRUITER']), videocallCtrl.evaluateMeeting);
router.delete('/videocall/meetings/:id', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'FACULTY_COORDINATOR', 'STAFF']), videocallCtrl.deleteMeeting);

// 9. Assessment & Coding Execution Platform
router.get('/assessment/runtime-status', assessCtrl.getRuntimeStatus);
router.get('/assessment/list', authenticateToken, assessCtrl.getAllAssessments);
router.get('/assessment/:id', authenticateToken, assessCtrl.getAssessmentById);
router.post('/assessment/submit', authenticateToken, assessCtrl.submitCodeSolution);
router.get('/assessment/:id/leaderboard', authenticateToken, assessCtrl.getAssessmentLeaderboard);

// 9b. Online Quiz & CodeSprint Examination Routes
router.get('/student/quiz/subjects', assessCtrl.getQuizSubjects);
router.post('/student/quiz/attempts/start', assessCtrl.startQuizAttempt);
router.post('/student/quiz/attempts/save', assessCtrl.saveQuizAttempt);
router.post('/student/quiz/attempts/submit', assessCtrl.submitQuizAttempt);
router.post('/student/quiz/attempts/proctor-log', assessCtrl.saveProctorLog);

// 10. Training Programs & Department Attendance
router.get('/training', authenticateToken, trainCtrl.getAllTrainings);
router.post('/training', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN']), trainCtrl.createTraining);
router.get('/training/department/:departmentCode', authenticateToken, enforceDepartmentIsolation, trainCtrl.getDeptTrainingAttendance);
router.post('/training/record-attendance', authenticateToken, authorize(['FACULTY_COORDINATOR', 'ADMIN', 'TPO_OFFICER']), trainCtrl.recordDeptAttendance);

// 11. Internships
router.get('/internships', authenticateToken, internCtrl.getInternships);
router.post('/internships', authenticateToken, internCtrl.createInternship);

// 12. Offers
router.get('/offers', authenticateToken, offerCtrl.getAllOffers);
router.post('/offers/issue', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'RECRUITER']), offerCtrl.issueOffer);
router.post('/offers/:id/respond', authenticateToken, offerCtrl.respondToOffer);

// 13. Policy Engine & Department Overrides
router.get('/policies', authenticateToken, policyCtrl.getPolicies);
router.put('/policies/:id', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'MANAGEMENT']), policyCtrl.updatePolicy);
router.get('/policies/overrides/:departmentCode', authenticateToken, enforceDepartmentIsolation, policyCtrl.getDeptOverrides);
router.post('/policies/grant-override', authenticateToken, authorize(['FACULTY_COORDINATOR', 'ADMIN', 'TPO_OFFICER']), policyCtrl.grantCoordinatorOverride);

// 14. Notifications
router.get('/notifications', authenticateToken, notifCtrl.getNotifications);
router.post('/notifications/broadcast', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'MANAGEMENT', 'FACULTY_COORDINATOR']), notifCtrl.createNotification);

// 15. Alumni
router.get('/alumni', authenticateToken, alumniCtrl.getAlumni);
router.post('/alumni/book-mentorship', authenticateToken, alumniCtrl.bookMentorship);

// 16. Grievances
router.get('/grievances', authenticateToken, grievCtrl.getGrievances);
router.post('/grievances/file', authenticateToken, grievCtrl.fileGrievance);
router.put('/grievances/:id/resolve', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN']), grievCtrl.resolveGrievance);

// 17. Finance & Placement Cell Budget
router.get('/finance/budget', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'MANAGEMENT']), finCtrl.getBudgetDetails);
router.post('/finance/expense', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN']), finCtrl.recordExpense);

// 18. Reporting & Accreditation (NIRF/NAAC)
router.get('/reports/nirf', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'MANAGEMENT']), reportCtrl.generateNirfReport);
router.get('/reports/export-csv', authenticateToken, authorize(['TPO_OFFICER', 'ADMIN', 'MANAGEMENT']), reportCtrl.exportPlacementDataCsv);

// 19. Administration & Multi-DB Registry
router.get('/admin/users', authenticateToken, authorize(['ADMIN']), adminCtrl.getAllUsers);
router.put('/admin/users/:id', authenticateToken, authorize(['ADMIN']), adminCtrl.updateUserStatus);
router.get('/admin/department-databases', authenticateToken, authorize(['ADMIN', 'TPO_OFFICER', 'MANAGEMENT']), adminCtrl.getDepartmentDatabases);
router.put('/admin/department-databases/:id', authenticateToken, authorize(['ADMIN']), adminCtrl.updateDepartmentDatabase);
router.get('/admin/audit-logs', authenticateToken, authorize(['ADMIN', 'MANAGEMENT']), adminCtrl.getAuditLogs);

// 20. AI Assistance (Powered by Mistral 7B Instruct GGUF & Live Database RAG)
router.get('/ai/status', authenticateToken, aiCtrl.getAiStatus);
router.post('/ai/ask', authenticateToken, aiCtrl.askDbAssistant);
router.post('/ai/parse-resume', authenticateToken, aiCtrl.parseResume);
router.post('/ai/match-job', authenticateToken, aiCtrl.matchJob);
router.post('/ai/interview-feedback', authenticateToken, aiCtrl.evaluateInterviewAnswer);

module.exports = router;
