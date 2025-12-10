import { Router } from 'express';
import {
  getMyChildren,
  getChildPerformance,
  getChildAssignments,
  getChildAttendance
} from '../controllers/parentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('parent'));

router.get('/children', getMyChildren);
router.get('/children/:studentId/performance', getChildPerformance);
router.get('/children/:studentId/assignments', getChildAssignments);
router.get('/children/:studentId/attendance', getChildAttendance);

export default router;
