import { Router } from 'express';
import { login, register, getMe, logout } from '../controllers/auth.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import { loginSchema, registerSchema } from '../schemas/auth.schema.ts';

const router = Router();

router.post('/login', validate({ body: loginSchema }), login);
router.post('/register', validate({ body: registerSchema }), register);
router.get('/me', authenticate, getMe);
router.post('/logout', logout);

export default router;
