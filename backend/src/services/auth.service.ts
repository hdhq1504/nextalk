import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateTokens, verifyRefreshToken, TokenPayload, Tokens } from '../utils/jwt';
import { ConflictError, AuthenticationError, NotFoundError } from '../middlewares/errorHandler';

const SALT_ROUNDS = 12;

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: Tokens;
}

export class AuthService {
  async register(email: string, password: string, username: string): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        username,
      },
    });

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
    });

    return {
      user: this.formatUser(user),
      tokens,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
    });

    return {
      user: this.formatUser(user),
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<Tokens> {
    try {
      const payload = verifyRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      return generateTokens({
        userId: user.id,
        email: user.email,
      });
    } catch {
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async getUserById(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.formatUser(user);
  }

  async logout(userId: string): Promise<void> {
    // Với JWT stateless, logout phía server chỉ cần client xóa token
    // Nếu muốn blacklist token, cần lưu token vào database hoặc Redis
    console.log(`User ${userId} logged out`);
  }

  private formatUser(user: { id: string; email: string; username: string; avatarUrl: string | null; createdAt: Date }): UserResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
