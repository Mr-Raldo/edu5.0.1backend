import { Router } from 'express';
import {
  getMyClasses,
  getClassStudents,
  getMySubjects,
  uploadMaterial,
  getMyMaterials,
  updateMaterial,
  deleteMaterial,
  createAssignment,
  getMyAssignments,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  markAttendance,
  getClassAttendance,
  createAnnouncement,
  createSyllabus,
  getMySyllabi,
  updateSyllabus,
  deleteSyllabus,
  uploadFile
} from '../controllers/teacherController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('teacher'));

// Classes & Subjects (READ-ONLY - assigned by admin)
router.get('/classes', getMyClasses);
router.get('/classes/:classId/students', getClassStudents);
router.get('/subjects', getMySubjects);

// Learning Materials
router.post('/materials', uploadMaterial);
router.get('/materials', getMyMaterials);
router.put('/materials/:id', updateMaterial);
router.delete('/materials/:id', deleteMaterial);

// Assignments
router.post('/assignments', createAssignment);
router.get('/assignments', getMyAssignments);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);
router.get('/assignments/:assignmentId/submissions', getAssignmentSubmissions);
router.put('/submissions/:id/grade', gradeSubmission);

// Syllabi
router.post('/syllabi', createSyllabus);
router.get('/syllabi', getMySyllabi);
router.put('/syllabi/:id', updateSyllabus);
router.delete('/syllabi/:id', deleteSyllabus);

// Attendance
router.post('/attendance', markAttendance);
router.get('/attendance/class/:classId', getClassAttendance);

// Announcements
router.post('/announcements', createAnnouncement);

// File Upload
router.post('/upload-file', upload.single('file'), uploadFile);

export default router;
