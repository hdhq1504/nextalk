import { Router } from 'express';
import authRoutes from './auth.routes';
import friendRoutes from './friend.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/friends', friendRoutes);

export default router;
