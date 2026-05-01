import { Router } from 'express'
import {
  createDirectConversation,
  getConversations,
  getMessages,
  sendImageMessage,
  recallMessage,
  reactMessage,
} from '../controllers/chat.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, getConversations)
router.post('/direct', authenticate, createDirectConversation)
router.get('/:id/messages', authenticate, getMessages)
router.post('/:id/messages/image', authenticate, sendImageMessage)
router.patch('/messages/:messageId/recall', authenticate, recallMessage)
router.post('/messages/:messageId/reactions', authenticate, reactMessage)

export default router
