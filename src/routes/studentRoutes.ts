import { Router } from 'express';
import {
  getMyDashboard,
  getMySubjects,
  getSubjectMaterials,
  getMyAssignments,
  getAssignmentDetails,
  submitAssignment,
  getMyGrades,
  getMyAttendance,
  getAnnouncements,
  getMySyllabi,
  getMyPerformance
} from '../controllers/studentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('student'));

// Dashboard
router.get('/dashboard', getMyDashboard);

// Subjects & Materials
router.get('/subjects', getMySubjects);
router.get('/subjects/:subjectId/materials', getSubjectMaterials);

// Syllabi
router.get('/syllabi', getMySyllabi);

// Assignments
router.get('/assignments', getMyAssignments);
router.get('/assignments/:assignmentId', getAssignmentDetails);
router.post('/assignments/:assignmentId/submit', submitAssignment);

// Grades & Performance
router.get('/grades', getMyGrades);
router.get('/performance', getMyPerformance);

// Attendance
router.get('/attendance', getMyAttendance);

// Announcements
router.get('/announcements', getAnnouncements);

export default router;
