import { Router } from 'express';
import {
  getMyDepartment,
  getDepartmentSubjects,
  createSubject,
  updateSubject,
  getDepartmentTeachers,
  getDepartmentMaterials,
  approveMaterial
} from '../controllers/hodController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('hod'));

router.get('/department', getMyDepartment);
router.get('/department/subjects', getDepartmentSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.get('/department/teachers', getDepartmentTeachers);
router.get('/department/materials', getDepartmentMaterials);
router.put('/materials/:id/approve', approveMaterial);

export default router;
