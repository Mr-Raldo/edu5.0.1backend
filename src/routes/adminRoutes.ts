import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  getSchoolInfo,
  updateSchoolInfo,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
  assignTeacherToSubject,
  getClassSubjects,
  removeTeacherAssignment,
  linkParentToStudents,
  unlinkParentFromStudent,
  getAllAcademicLevels,
  createAcademicLevel,
  updateAcademicLevel,
  deleteAcademicLevel,
  getAcademicLevelSubjects,
  assignSubjectToAcademicLevel,
  removeSubjectFromAcademicLevel,
  getAllTeachers,
  getTeacherById,
  getAllStudents
} from '../controllers/adminController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/activate', activateUser);
router.put('/users/:id/deactivate', deactivateUser);

router.get('/school', getSchoolInfo);
router.put('/school', updateSchoolInfo);

router.get('/departments', getAllDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

router.get('/subjects', getAllSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

router.get('/classes', getAllClasses);
router.post('/classes', createClass);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);
router.get('/classes/:classId/subjects', getClassSubjects);

// Teacher-Subject-Class assignment
router.post('/assign-teacher-subject', assignTeacherToSubject);
router.delete('/class-subjects/:id', removeTeacherAssignment);

// Parent-Student linking
router.post('/parents/link-students', linkParentToStudents);
router.post('/parents/unlink-student', unlinkParentFromStudent);

router.get('/teachers', getAllTeachers);
router.get('/teachers/:id', getTeacherById);

router.get('/students', getAllStudents);

router.get('/academic-levels', getAllAcademicLevels);
router.post('/academic-levels', createAcademicLevel);
router.put('/academic-levels/:id', updateAcademicLevel);
router.delete('/academic-levels/:id', deleteAcademicLevel);
router.get('/academic-levels/:id/subjects', getAcademicLevelSubjects);
router.post('/academic-levels/assign-subject', assignSubjectToAcademicLevel);
router.delete('/academic-levels/subjects/:id', removeSubjectFromAcademicLevel);

export default router;
