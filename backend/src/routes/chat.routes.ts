import { Router } from 'express'
import {
  createDirectConversation,
  getConversations,
  getMessages,
  sendImageMessage,
  recallMessage,
  reactMessage,
  createGroupConversation,
  addGroupMember,
  removeGroupMember,
  updateGroupInfo,
  leaveGroup,
} from '../controllers/chat.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, getConversations)
router.post('/direct', authenticate, createDirectConversation)
router.post('/group', authenticate, createGroupConversation)
router.get('/:id/messages', authenticate, getMessages)
router.post('/:id/messages/image', authenticate, sendImageMessage)
router.patch('/messages/:messageId/recall', authenticate, recallMessage)
router.post('/messages/:messageId/reactions', authenticate, reactMessage)
router.post('/:id/members', authenticate, addGroupMember)
router.delete('/:id/members/:userId', authenticate, removeGroupMember)
router.patch('/:id', authenticate, updateGroupInfo)
router.post('/:id/leave', authenticate, leaveGroup)

export default router
