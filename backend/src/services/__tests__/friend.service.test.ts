import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('../../config/database', () => ({
  default: {
    friendRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    friendship: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

describe('FriendService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendFriendRequest', () => {
    it('should throw if sending to self', async () => {
      const friendService = await import('../friend.service')
      await expect(
        friendService.friendService.sendFriendRequest('user-1', 'user-1')
      ).rejects.toThrow('You cannot send a friend request to yourself')
    })

    it('should throw if request already exists', async () => {
      const prisma = (await import('../../config/database')).default
      const mockUser = {
        id: 'user-2',
        email: 'user2@example.com',
        username: 'user2',
        passwordHash: 'hash',
        avatarUrl: null,
        phone: null,
        dateOfBirth: null,
        bio: null,
        isOnline: false,
        lastSeen: null,
        createdAt: new Date(),
        tokenVersion: 0,
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.friendRequest.findFirst).mockResolvedValue({
        id: 'request-1',
        senderId: 'user-2',
        receiverId: 'user-1',
        status: 'pending',
      } as any)

      const friendService = await import('../friend.service')
      await expect(
        friendService.friendService.sendFriendRequest('user-1', 'user-2')
      ).rejects.toThrow('Friend request already exists')
    })

    it('should throw if already friends', async () => {
      const prisma = (await import('../../config/database')).default
      const mockUser = {
        id: 'user-2',
        email: 'user2@example.com',
        username: 'user2',
        passwordHash: 'hash',
        avatarUrl: null,
        phone: null,
        dateOfBirth: null,
        bio: null,
        isOnline: false,
        lastSeen: null,
        createdAt: new Date(),
        tokenVersion: 0,
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.friendRequest.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.friendship.findFirst).mockResolvedValue({
        id: 'friendship-1',
      } as any)

      const friendService = await import('../friend.service')
      await expect(
        friendService.friendService.sendFriendRequest('user-1', 'user-2')
      ).rejects.toThrow('You are already friends')
    })
  })

  describe('acceptRequest', () => {
    it('should throw if request not found', async () => {
      const prisma = (await import('../../config/database')).default
      vi.mocked(prisma.friendRequest.findUnique).mockResolvedValue(null)

      const friendService = await import('../friend.service')
      await expect(
        friendService.friendService.acceptRequest('nonexistent', 'user-2')
      ).rejects.toThrow('Friend request not found')
    })
  })

  describe('getFriends', () => {
    it('should return friends list', async () => {
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.friendship.findMany).mockResolvedValue([
        {
          id: 'friendship-1',
          userId: 'user-1',
          friendId: 'user-2',
          createdAt: new Date(),
          friend: {
            id: 'user-2',
            username: 'friend',
            email: 'friend@example.com',
            avatarUrl: null,
            createdAt: new Date(),
          },
        },
      ] as any)

      const friendService = await import('../friend.service')
      const result = await friendService.friendService.getFriends('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].friend.username).toBe('friend')
    })
  })

  describe('getPendingRequestsCount', () => {
    it('should return count of pending requests', async () => {
      const prisma = (await import('../../config/database')).default
      vi.mocked(prisma.friendRequest.count).mockResolvedValue(5)

      const friendService = await import('../friend.service')
      const result = await friendService.friendService.getPendingRequestsCount('user-1')

      expect(result).toBe(5)
    })
  })
})
