import { Router } from 'express';
import {
  login,
  register,
  getCurrentUser,
  updateProfile,
  changePassword
} from '../controllers/authController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', authenticateToken, authorizeRoles('admin'), register);
router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;
