import { Router } from 'express';
import { auth, login, register } from '../controllers/userController';

const router = Router();

router.post('/api/login', login)
router.post('/api/register', register)
router.post('/api/auth', auth)

export default router;