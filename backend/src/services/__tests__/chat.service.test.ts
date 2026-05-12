import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('../../config/database', () => ({
  default: {
    conversation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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
})
