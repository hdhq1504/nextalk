import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('../../config/database', () => ({
  default: {
    conversation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    conversationMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    friendship: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Mock cloudinary
vi.mock('../../config/cloudinary', () => ({
  uploadImageBuffer: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
}))

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrCreateDirectConversation', () => {
    it('should throw if creating conversation with self', async () => {
      const chatService = await import('../chat.service')

      await expect(
        chatService.chatService.getOrCreateDirectConversation('user-1', 'user-1')
      ).rejects.toThrow('You cannot create a conversation with yourself')
    })

    it('should throw if not friends', async () => {
      const prisma = (await import('../../config/database')).default
      vi.mocked(prisma.friendship.findUnique).mockResolvedValue(null)

      const chatService = await import('../chat.service')
      await expect(
        chatService.chatService.getOrCreateDirectConversation('user-1', 'user-2')
      ).rejects.toThrow('You can only chat with friends')
    })
  })

  describe('getMessages', () => {
    it('should return paginated messages', async () => {
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.conversationMember.findUnique).mockResolvedValue({
        id: 'member-1',
        userId: 'user-1',
        conversationId: 'conv-1',
      } as any)

      vi.mocked(prisma.message.findMany).mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: 'Hello',
          type: 'text',
          createdAt: new Date(),
          updatedAt: null,
          isDeleted: false,
          replyToId: null,
          imageUrl: null,
          imageUrls: [],
          sender: {
            id: 'user-1',
            email: 'test@example.com',
            username: 'testuser',
            avatarUrl: null,
            isOnline: false,
            lastSeen: null,
            createdAt: new Date(),
          },
          reactions: [],
          replyTo: null,
        },
      ] as any)

      const chatService = await import('../chat.service')
      const result = await chatService.chatService.getMessages('conv-1', 'user-1')

      expect(result.messages).toHaveLength(1)
      expect(result.messages[0].content).toBe('Hello')
    })
  })

  describe('searchMessages', () => {
    it('should return empty array for empty query', async () => {
      const chatService = await import('../chat.service')
      const result = await chatService.chatService.searchMessages('conv-1', 'user-1', '')

      expect(result.messages).toEqual([])
    })

    it('should return messages matching query', async () => {
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.conversationMember.findUnique).mockResolvedValue({
        id: 'member-1',
        userId: 'user-1',
        conversationId: 'conv-1',
      } as any)

      vi.mocked(prisma.message.findMany).mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: 'Hello world',
          type: 'text',
          createdAt: new Date(),
          updatedAt: null,
          isDeleted: false,
          replyToId: null,
          imageUrl: null,
          imageUrls: [],
          sender: {
            id: 'user-1',
            email: 'test@example.com',
            username: 'testuser',
            avatarUrl: null,
            isOnline: false,
            lastSeen: null,
            createdAt: new Date(),
          },
          reactions: [],
          replyTo: null,
        },
      ] as any)

      const chatService = await import('../chat.service')
      const result = await chatService.chatService.searchMessages('conv-1', 'user-1', 'world')

      expect(result.messages).toHaveLength(1)
      expect(result.messages[0].content).toBe('Hello world')
    })
  })

  describe('sendMessage', () => {
    it('should throw for empty content', async () => {
      const chatService = await import('../chat.service')
      await expect(
        chatService.chatService.sendMessage('conv-1', 'user-1', '   ')
      ).rejects.toThrow('Message content is required')
    })
  })

  describe('recallMessage', () => {
    it('should throw if message not found', async () => {
      const prisma = (await import('../../config/database')).default
      vi.mocked(prisma.message.findUnique).mockResolvedValue(null)

      const chatService = await import('../chat.service')
      await expect(
        chatService.chatService.recallMessage('msg-1', 'user-1')
      ).rejects.toThrow('Message not found')
    })

    it('should throw if not message owner', async () => {
      const prisma = (await import('../../config/database')).default
      vi.mocked(prisma.message.findUnique).mockResolvedValue({
        id: 'msg-1',
        senderId: 'user-1',
        isDeleted: false,
      } as any)

      const chatService = await import('../chat.service')
      await expect(
        chatService.chatService.recallMessage('msg-1', 'user-2')
      ).rejects.toThrow('You can only recall your own messages')
    })
  })

  describe('leaveGroup', () => {
    it('should promote the selected member when admin leaves', async () => {
      const prisma = (await import('../../config/database')).default
      const joinedAt = new Date()

      vi.mocked(prisma.conversation.findUnique)
        .mockResolvedValueOnce({ type: 'group' } as any)
        .mockResolvedValueOnce({
          id: 'conv-1',
          type: 'group',
          name: 'Team',
          avatarUrl: null,
          createdById: 'admin-1',
          createdAt: joinedAt,
          members: [
            {
              id: 'member-2',
              conversationId: 'conv-1',
              userId: 'user-2',
              role: 'admin',
              isPinned: false,
              isHidden: false,
              joinedAt,
              user: {
                id: 'user-2',
                email: 'user2@example.com',
                username: 'user2',
                avatarUrl: null,
                isOnline: false,
                lastSeen: null,
                createdAt: joinedAt,
              },
            },
          ],
          messages: [],
        } as any)

      vi.mocked(prisma.conversationMember.findUnique).mockResolvedValue({
        id: 'member-1',
        conversationId: 'conv-1',
        userId: 'admin-1',
        role: 'admin',
      } as any)
      vi.mocked(prisma.conversationMember.findMany).mockResolvedValue([
        {
          id: 'member-2',
          conversationId: 'conv-1',
          userId: 'user-2',
          role: 'member',
          joinedAt,
        },
      ] as any)
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
        callback(prisma)
      )

      const chatService = await import('../chat.service')
      const result = await chatService.chatService.leaveGroup(
        'conv-1',
        'admin-1',
        'user-2'
      )

      expect(prisma.conversationMember.delete).toHaveBeenCalledWith({
        where: {
          conversationId_userId: {
            conversationId: 'conv-1',
            userId: 'admin-1',
          },
        },
      })
      expect(prisma.conversationMember.update).toHaveBeenCalledWith({
        where: { id: 'member-2' },
        data: { role: 'admin' },
      })
      expect(result?.members?.[0].role).toBe('admin')
    })

    it('should require admin to choose the next admin before leaving', async () => {
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        type: 'group',
      } as any)
      vi.mocked(prisma.conversationMember.findUnique).mockResolvedValue({
        id: 'member-1',
        conversationId: 'conv-1',
        userId: 'admin-1',
        role: 'admin',
      } as any)
      vi.mocked(prisma.conversationMember.findMany).mockResolvedValue([
        {
          id: 'member-2',
          conversationId: 'conv-1',
          userId: 'user-2',
          role: 'member',
        },
      ] as any)
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
        callback(prisma)
      )

      const chatService = await import('../chat.service')

      await expect(
        chatService.chatService.leaveGroup('conv-1', 'admin-1')
      ).rejects.toThrow('Please choose a new admin before leaving')
    })

    it('should not promote another member when a regular member leaves', async () => {
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        type: 'group',
      } as any)
      vi.mocked(prisma.conversationMember.findUnique).mockResolvedValue({
        id: 'member-2',
        conversationId: 'conv-1',
        userId: 'user-2',
        role: 'member',
      } as any)
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
        callback(prisma)
      )

      const chatService = await import('../chat.service')
      const result = await chatService.chatService.leaveGroup('conv-1', 'user-2')

      expect(prisma.conversationMember.findMany).not.toHaveBeenCalled()
      expect(prisma.conversationMember.update).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })
  })

  describe('deleteConversation', () => {
    it('should throw if a non-admin deletes a group conversation', async () => {
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: 'conv-1',
        type: 'group',
        members: [
          {
            userId: 'user-1',
            role: 'member',
          },
        ],
      } as any)

      const chatService = await import('../chat.service')

      await expect(
        chatService.chatService.deleteConversation('conv-1', 'user-1')
      ).rejects.toThrow('Only admins can delete this conversation')
      expect(prisma.conversation.delete).not.toHaveBeenCalled()
    })

    it('should delete a conversation when requester is allowed', async () => {
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: 'conv-1',
        type: 'group',
        members: [
          {
            userId: 'admin-1',
            role: 'admin',
          },
        ],
      } as any)

      const chatService = await import('../chat.service')
      await chatService.chatService.deleteConversation('conv-1', 'admin-1')

      expect(prisma.conversation.delete).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
      })
    })
  })

  describe('removeConversation', () => {
    it('should hide the conversation for the current member', async () => {
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.conversationMember.findUnique).mockResolvedValue({
        id: 'member-1',
        conversationId: 'conv-1',
        userId: 'user-1',
      } as any)

      const chatService = await import('../chat.service')
      await chatService.chatService.removeConversation('conv-1', 'user-1')

      expect(prisma.conversationMember.update).toHaveBeenCalledWith({
        where: {
          conversationId_userId: {
            conversationId: 'conv-1',
            userId: 'user-1',
          },
        },
        data: { isHidden: true },
      })
    })
  })
})
