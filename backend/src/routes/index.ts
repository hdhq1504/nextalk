import { Router } from 'express';
import authRoutes from './auth.routes';
import friendRoutes from './friend.routes';
import chatRoutes from './chat.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/friends', friendRoutes);
router.use('/conversations', chatRoutes);

export default router;
