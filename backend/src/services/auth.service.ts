import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateTokens, verifyRefreshToken, TokenPayload, Tokens } from '../utils/jwt';
import { ConflictError, AuthenticationError, NotFoundError } from '../middlewares/errorHandler';
import type { AuthResponse, UpdateUserDto, UserDetailResponse, UserResponse } from '../types';

export type { AuthResponse } from '../types';

const SALT_ROUNDS = 12;

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

    const newUser = await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } },
    });

    const tokens = generateTokens({
      userId: newUser.id,
      email: newUser.email,
      tokenVersion: newUser.tokenVersion,
    });

    return {
      user: this.formatUser(newUser),
      tokens,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthenticationError('Account not found. Please check your email or sign up.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } },
    });

    const tokens = generateTokens({
      userId: updatedUser.id,
      email: updatedUser.email,
      tokenVersion: updatedUser.tokenVersion,
    });

    return {
      user: this.formatUser(updatedUser),
      tokens,
    };
  }

  async refreshToken(refreshTokenValue: string): Promise<Tokens> {
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshTokenValue);
    } catch {
      throw new AuthenticationError('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (user.tokenVersion > payload.tokenVersion) {
      throw new AuthenticationError('Token has been revoked. Please login again.');
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } },
    });

    return generateTokens({
      userId: updatedUser.id,
      email: updatedUser.email,
      tokenVersion: updatedUser.tokenVersion,
    });
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

  async getUserDetailById(userId: string): Promise<UserDetailResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.formatUserDetail(user);
  }

  async updateUser(userId: string, data: UpdateUserDto): Promise<UserDetailResponse> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.username !== undefined && { username: data.username }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null }),
        ...(data.bio !== undefined && { bio: data.bio }),
      },
    });

    return this.formatUserDetail(user);
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  async checkEmail(email: string): Promise<boolean> {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    return existingUser !== null;
  }

  private formatUser(user: Pick<UserResponse, 'id' | 'email' | 'username' | 'avatarUrl' | 'createdAt'>): UserResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }

  private formatUserDetail(user: UserDetailResponse): UserDetailResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      bio: user.bio,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
