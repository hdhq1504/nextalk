import prisma from '../config/database';
import { NotFoundError, ConflictError, AuthorizationError } from '../middlewares/errorHandler';

export interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export interface FriendRequestResponse {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  sender: UserSearchResult;
  createdAt: Date;
}

export interface FriendResponse {
  id: string;
  friendId: string;
  friend: UserSearchResult;
  createdAt: Date;
}

export class FriendService {
  async searchUsers(currentUserId: string, query: string): Promise<UserSearchResult[]> {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
      },
      take: 20,
    });

    return users;
  }

  async sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequestResponse> {
    if (senderId === receiverId) {
      throw new ConflictError('You cannot send a friend request to yourself');
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundError('User not found');
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingRequest) {
      throw new ConflictError('Friend request already exists');
    }

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId },
        ],
      },
    });

    if (existingFriendship) {
      throw new ConflictError('You are already friends with this user');
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: 'pending',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return this.formatFriendRequest(friendRequest);
  }

  async getReceivedRequests(userId: string): Promise<FriendRequestResponse[]> {
    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: 'pending',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map(this.formatFriendRequest);
  }

  async acceptRequest(requestId: string, userId: string): Promise<FriendRequestResponse> {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Friend request not found');
    }

    if (request.receiverId !== userId) {
      throw new AuthorizationError('You are not authorized to accept this request');
    }

    if (request.status !== 'pending') {
      throw new ConflictError('This request has already been processed');
    }

    await prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      });

      await tx.friendship.createMany({
        data: [
          { userId: request.senderId, friendId: request.receiverId },
          { userId: request.receiverId, friendId: request.senderId },
        ],
      });
    });

    const updatedRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return this.formatFriendRequest(updatedRequest!);
  }

  async rejectRequest(requestId: string, userId: string): Promise<FriendRequestResponse> {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Friend request not found');
    }

    if (request.receiverId !== userId) {
      throw new AuthorizationError('You are not authorized to reject this request');
    }

    if (request.status !== 'pending') {
      throw new ConflictError('This request has already been processed');
    }

    const updatedRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return this.formatFriendRequest(updatedRequest);
  }

  async getFriends(userId: string): Promise<FriendResponse[]> {
    const friendships = await prisma.friendship.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return friendships.map((f) => ({
      id: f.id,
      friendId: f.friendId,
      friend: {
        id: f.friend.id,
        username: f.friend.username,
        email: f.friend.email,
        avatarUrl: f.friend.avatarUrl,
      },
      createdAt: f.createdAt,
    }));
  }

  async getPendingRequestsCount(userId: string): Promise<number> {
    const count = await prisma.friendRequest.count({
      where: {
        receiverId: userId,
        status: 'pending',
      },
    });
    return count;
  }

  private formatFriendRequest(request: {
    id: string;
    senderId: string;
    receiverId: string;
    status: string;
    createdAt: Date;
    sender: {
      id: string;
      username: string;
      email: string;
      avatarUrl: string | null;
    };
  }): FriendRequestResponse {
    return {
      id: request.id,
      senderId: request.senderId,
      receiverId: request.receiverId,
      status: request.status,
      sender: {
        id: request.sender.id,
        username: request.sender.username,
        email: request.sender.email,
        avatarUrl: request.sender.avatarUrl,
      },
      createdAt: request.createdAt,
    };
  }
}

export const friendService = new FriendService();
