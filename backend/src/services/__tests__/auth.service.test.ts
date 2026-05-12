import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

// Mock prisma
vi.mock('../../config/database', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock jwt
vi.mock('../../utils/jwt', () => ({
  generateTokens: vi.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  verifyRefreshToken: vi.fn(),
}))

// Mock bcrypt
vi.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed-password'))
vi.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('should hash password with bcrypt', async () => {
      const { AuthService } = await import('../auth.service')
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed-password',
        avatarUrl: null,
        phone: null,
        dateOfBirth: null,
        bio: null,
        isOnline: false,
        lastSeen: null,
        createdAt: new Date(),
        tokenVersion: 0,
      } as any)
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed-password',
        avatarUrl: null,
        phone: null,
        dateOfBirth: null,
        bio: null,
        isOnline: false,
        lastSeen: null,
        createdAt: new Date(),
        tokenVersion: 1,
      } as any)

      const authService = new AuthService()
      await authService.register('test@example.com', 'password123', 'testuser')

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12)
    })

    it('should throw if email already exists', async () => {
      const { AuthService } = await import('../auth.service')
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
        username: 'existing',
        passwordHash: 'hash',
        avatarUrl: null,
        phone: null,
        dateOfBirth: null,
        bio: null,
        isOnline: false,
        lastSeen: null,
        createdAt: new Date(),
        tokenVersion: 0,
      } as any)

      const authService = new AuthService()
      await expect(
        authService.register('test@example.com', 'password123', 'testuser')
      ).rejects.toThrow('Email already registered')
    })
  })

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      const { AuthService } = await import('../auth.service')
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed-password',
        avatarUrl: null,
        phone: null,
        dateOfBirth: null,
        bio: null,
        isOnline: false,
        lastSeen: null,
        createdAt: new Date(),
        tokenVersion: 0,
      } as any)
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed-password',
        avatarUrl: null,
        phone: null,
        dateOfBirth: null,
        bio: null,
        isOnline: false,
        lastSeen: null,
        createdAt: new Date(),
        tokenVersion: 1,
      } as any)

      const authService = new AuthService()
      const result = await authService.login('test@example.com', 'password123')

      expect(result.tokens.accessToken).toBe('mock-access-token')
      expect(result.tokens.refreshToken).toBe('mock-refresh-token')
      expect(result.user.email).toBe('test@example.com')
    })

    it('should throw on invalid password', async () => {
      const { AuthService } = await import('../auth.service')
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed-password',
        avatarUrl: null,
        phone: null,
        dateOfBirth: null,
        bio: null,
        isOnline: false,
        lastSeen: null,
        createdAt: new Date(),
        tokenVersion: 0,
      } as any)
      vi.mocked(bcrypt.compare).mockImplementationOnce(async () => false)

      const authService = new AuthService()
      await expect(
        authService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid email or password')
    })

    it('should throw if user not found', async () => {
      const { AuthService } = await import('../auth.service')
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const authService = new AuthService()
      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Account not found')
    })
  })

  describe('checkEmail', () => {
    it('should return true if email exists', async () => {
      const { AuthService } = await import('../auth.service')
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      } as any)

      const authService = new AuthService()
      const result = await authService.checkEmail('test@example.com')

      expect(result).toBe(true)
    })

    it('should return false if email does not exist', async () => {
      const { AuthService } = await import('../auth.service')
      const prisma = (await import('../../config/database')).default

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const authService = new AuthService()
      const result = await authService.checkEmail('new@example.com')

      expect(result).toBe(false)
    })
  })
})
