import { Router } from 'express'
import {
  createDirectConversation,
  getConversations,
  getMessages,
} from '../controllers/chat.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, getConversations)
router.post('/direct', authenticate, createDirectConversation)
router.get('/:id/messages', authenticate, getMessages)

export default router
