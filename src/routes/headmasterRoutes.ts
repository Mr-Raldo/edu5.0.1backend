import { Router } from 'express';
import {
  getSchoolDashboard,
  getAllDepartments,
  getTeacherPerformance,
  getStudentPerformance,
  getAllClasses,
  getSchoolInfo
} from '../controllers/headmasterController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('headmaster'));

router.get('/dashboard', getSchoolDashboard);
router.get('/departments', getAllDepartments);
router.get('/teachers/performance', getTeacherPerformance);
router.get('/students/performance', getStudentPerformance);
router.get('/classes', getAllClasses);
router.get('/school', getSchoolInfo);

export default router;
