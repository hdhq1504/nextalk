import prisma from "../config/database";
import { uploadImageBuffer } from "../config/cloudinary";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../middlewares/errorHandler";
import {
  ConversationListItem,
  ConversationResponse,
  ConversationType,
  MemberRole,
  MessageResponse,
  MessageType,
  ReactionSummary,
  UpdateGroupInfoDto,
} from "../types";

const userSelect = {
  id: true,
  email: true,
  username: true,
  avatarUrl: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
} as const;

const messageInclude = {
  sender: {
    select: userSelect,
  },
  replyTo: {
    include: {
      sender: { select: userSelect },
    },
  },
  reactions: {
    include: {
      user: { select: { id: true } },
    },
  },
} as const;

const conversationInclude = {
  members: {
    include: {
      user: {
        select: userSelect,
      },
    },
    orderBy: {
      joinedAt: "asc" as const,
    },
  },
  messages: {
    include: messageInclude,
    orderBy: {
      createdAt: "desc" as const,
    },
    take: 1,
  },
} as const;

class ChatService {
  async getConversations(userId: string): Promise<ConversationListItem[]> {
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId,
            isHidden: false,
          },
        },
      },
      include: conversationInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return conversations
      .map((conversation) => this.formatConversationListItem(conversation))
      .sort((a, b) => {
        const aDate = a.lastMessage?.createdAt ?? a.createdAt;
        const bDate = b.lastMessage?.createdAt ?? b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
  }

  async getOrCreateDirectConversation(
    userId: string,
    friendId: string,
  ): Promise<ConversationListItem> {
    if (userId === friendId) {
      throw new ConflictError("You cannot create a conversation with yourself");
    }

    const friendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    if (!friendship) {
      throw new AuthorizationError("You can only chat with friends");
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        type: ConversationType.Direct,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: friendId } } },
        ],
      },
      include: conversationInclude,
    });

    if (existing && existing.members.length === 2) {
      return this.formatConversationListItem(existing);
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: ConversationType.Direct,
        createdById: userId,
        members: {
          create: [
            { userId, role: MemberRole.Member },
            { userId: friendId, role: MemberRole.Member },
          ],
        },
      },
      include: conversationInclude,
    });

    return this.formatConversationListItem(conversation);
  }

  async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<{ messages: MessageResponse[]; nextCursor?: string }> {
    await this.assertConversationMember(conversationId, userId);

    const safeLimit = Math.min(Math.max(1, limit), 100);

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      include: messageInclude,
      orderBy: { createdAt: "desc" },
      take: safeLimit + 1,
    });

    const hasMore = messages.length > safeLimit;
    const results = hasMore ? messages.slice(0, -1) : messages;

    return {
      messages: results.map((message) => this.formatMessage(message)).reverse(),
      nextCursor: hasMore ? results[results.length - 1].id : undefined,
    };
  }

  async searchMessages(
    conversationId: string,
    userId: string,
    query: string,
    limit: number = 50,
  ): Promise<{ messages: MessageResponse[]; nextCursor?: string }> {
    await this.assertConversationMember(conversationId, userId);

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return { messages: [] };
    }

    const safeLimit = Math.min(Math.max(1, limit), 100);

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        content: {
          contains: trimmedQuery,
          mode: "insensitive",
        },
      },
      include: messageInclude,
      orderBy: { createdAt: "desc" },
      take: safeLimit + 1,
    });

    const hasMore = messages.length > safeLimit;
    const results = hasMore ? messages.slice(0, -1) : messages;

    return {
      messages: results.map((message) => this.formatMessage(message)),
      nextCursor: hasMore ? results[results.length - 1].id : undefined,
    };
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    replyToId?: string,
  ): Promise<MessageResponse> {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new ValidationError("Message content is required");
    }

    await this.assertConversationMember(conversationId, senderId);

    if (replyToId) {
      const replyMessage = await prisma.message.findUnique({
        where: { id: replyToId },
        select: { conversationId: true },
      });
      if (!replyMessage) {
        throw new NotFoundError("Reply message not found");
      }
      if (replyMessage.conversationId !== conversationId) {
        throw new ValidationError(
          "Cannot reply to a message in a different conversation",
        );
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: trimmedContent,
        type: MessageType.Text,
        replyToId,
      },
      include: messageInclude,
    });

    return this.formatMessage(message);
  }

  async sendImageMessage(
    conversationId: string,
    senderId: string,
    files: Array<{ buffer: Buffer; mimetype: string }>,
    content?: string,
    replyToId?: string,
  ): Promise<MessageResponse> {
    await this.assertConversationMember(conversationId, senderId);
    const trimmedContent = content?.trim() || null;

    if (replyToId) {
      const replyMessage = await prisma.message.findUnique({
        where: { id: replyToId },
        select: { conversationId: true },
      });
      if (!replyMessage) {
        throw new NotFoundError("Reply message not found");
      }
      if (replyMessage.conversationId !== conversationId) {
        throw new ValidationError(
          "Cannot reply to a message in a different conversation",
        );
      }
    }

    const uploadPromises = files.map((file) =>
      uploadImageBuffer(file.buffer, "nextalk/messages"),
    );
    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults.map((result) => result.url);

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: trimmedContent,
        type: MessageType.Image,
        imageUrls,
        replyToId,
      },
      include: messageInclude,
    });

    return this.formatMessage(message);
  }

  async recallMessage(
    messageId: string,
    requesterId: string,
  ): Promise<MessageResponse> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: messageInclude,
    });

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    if (message.senderId !== requesterId) {
      throw new AuthorizationError("You can only recall your own messages");
    }

    if (message.isDeleted) {
      throw new ConflictError("Message has already been recalled");
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: null,
        imageUrl: null,
        imageUrls: [],
      },
      include: messageInclude,
    });

    return this.formatMessage(updated);
  }

  async reactMessage(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<{ conversationId: string; reactions: ReactionSummary[] }> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    });

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    await this.assertConversationMember(message.conversationId, userId);

    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });
    } else {
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
    }

    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: { user: { select: { id: true } } },
    });

    const reactionSummary = this.calculateReactionsFromArray(reactions);

    return {
      conversationId: message.conversationId,
      reactions: reactionSummary,
    };
  }

  private calculateReactionsFromArray(
    reactions: { emoji: string; user: { id: string } }[],
  ): ReactionSummary[] {
    const reactionMap = new Map<string, { count: number; userIds: string[] }>();

    for (const reaction of reactions) {
      const existing = reactionMap.get(reaction.emoji) || {
        count: 0,
        userIds: [],
      };
      existing.count++;
      existing.userIds.push(reaction.user.id);
      reactionMap.set(reaction.emoji, existing);
    }

    return Array.from(reactionMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      userIds: data.userIds,
    }));
  }

  async getConversationForMember(
    conversationId: string,
    userId: string,
  ): Promise<ConversationResponse> {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: conversationInclude,
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    return this.formatConversation(conversation);
  }

  private async assertConversationMember(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError("Conversation not found");
    }
  }

  private async assertGroupAdmin(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError("Conversation not found");
    }

    if (member.role !== MemberRole.Admin) {
      throw new AuthorizationError("Only admins can perform this action");
    }
  }

  async createGroupConversation(
    creatorId: string,
    name: string,
    memberIds: string[],
  ): Promise<ConversationResponse> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new ValidationError("Group name is required");
    }

    if (memberIds.length < 2) {
      throw new ValidationError("A group must have at least 2 members");
    }

    const uniqueMemberIds = [...new Set(memberIds)];
    if (uniqueMemberIds.includes(creatorId)) {
      throw new ConflictError("Creator cannot be added as a member");
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        userId: creatorId,
        friendId: { in: uniqueMemberIds },
      },
    });
    if (friendships.length !== uniqueMemberIds.length) {
      throw new AuthorizationError("You can only add friends to the group");
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: ConversationType.Group,
        name: trimmedName,
        createdById: creatorId,
        members: {
          create: [
            { userId: creatorId, role: MemberRole.Admin },
            ...uniqueMemberIds.map((id) => ({
              userId: id,
              role: MemberRole.Member,
            })),
          ],
        },
      },
      include: conversationInclude,
    });

    return this.formatConversation(conversation);
  }

  async addGroupMember(
    conversationId: string,
    requesterId: string,
    userId: string,
  ): Promise<ConversationResponse> {
    await this.assertGroupAdmin(conversationId, requesterId);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { type: true },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    if (conversation.type !== ConversationType.Group) {
      throw new ValidationError("This is not a group conversation");
    }

    const friendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId: requesterId,
          friendId: userId,
        },
      },
    });

    if (!friendship) {
      throw new AuthorizationError("You can only add friends to the group");
    }

    const existing = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (existing) {
      throw new ConflictError("User is already a member of this group");
    }

    await prisma.conversationMember.create({
      data: {
        conversationId,
        userId,
        role: MemberRole.Member,
      },
    });

    return this.getConversationForMember(conversationId, requesterId);
  }

  async removeGroupMember(
    conversationId: string,
    requesterId: string,
    userId: string,
  ): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { type: true, createdById: true },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    if (conversation.type !== ConversationType.Group) {
      throw new ValidationError("This is not a group conversation");
    }

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError("Member not found");
    }

    if (userId !== requesterId && member.role !== MemberRole.Admin) {
      throw new AuthorizationError("Only admins can remove other members");
    }

    await prisma.conversationMember.delete({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });
  }

  async updateGroupInfo(
    conversationId: string,
    requesterId: string,
    data: UpdateGroupInfoDto,
  ): Promise<ConversationResponse> {
    await this.assertGroupAdmin(conversationId, requesterId);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { type: true },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    if (conversation.type !== ConversationType.Group) {
      throw new ValidationError("This is not a group conversation");
    }

    const updateData: UpdateGroupInfoDto = {};
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (!trimmedName) {
        throw new ValidationError("Group name cannot be empty");
      }
      updateData.name = trimmedName;
    }
    if (data.avatarUrl !== undefined) {
      updateData.avatarUrl = data.avatarUrl;
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
      include: conversationInclude,
    });

    return this.formatConversation(updated);
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    const member = conversation.members.find(
      (conversationMember) => conversationMember.userId === userId,
    );

    if (!member) {
      throw new NotFoundError("Conversation not found");
    }

    if (
      conversation.type === ConversationType.Group &&
      member.role !== MemberRole.Admin
    ) {
      throw new AuthorizationError("Only admins can delete this conversation");
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  async removeConversation(conversationId: string, userId: string): Promise<void> {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError("Conversation not found");
    }

    await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: { isHidden: true },
    });
  }

  async leaveGroup(
    conversationId: string,
    userId: string,
    newAdminId?: string,
  ): Promise<ConversationResponse | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { type: true },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    if (conversation.type !== ConversationType.Group) {
      throw new ValidationError("This is not a group conversation");
    }

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError("You are not a member of this group");
    }

    const updatedConversation = await prisma.$transaction(async (tx) => {
      await tx.conversationMember.delete({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

      if (member.role !== MemberRole.Admin) {
        return null;
      }

      const remainingMembers = await tx.conversationMember.findMany({
        where: { conversationId },
      });

      if (remainingMembers.length === 0) {
        return null;
      }

      if (!newAdminId) {
        throw new ValidationError("Please choose a new admin before leaving");
      }

      if (newAdminId === userId) {
        throw new ValidationError("New admin must be another group member");
      }

      const nextAdmin = remainingMembers.find(
        (remainingMember) => remainingMember.userId === newAdminId,
      );

      if (!nextAdmin) {
        throw new ValidationError("New admin must be a member of this group");
      }

      await tx.conversationMember.update({
        where: { id: nextAdmin.id },
        data: { role: MemberRole.Admin },
      });

      return tx.conversation.findUnique({
        where: { id: conversationId },
        include: conversationInclude,
      });
    });

    return updatedConversation
      ? this.formatConversation(updatedConversation)
      : null;
  }

  private formatConversationListItem(
    conversation: ConversationWithRelations,
  ): ConversationListItem {
    const formatted = this.formatConversation(conversation);

    return {
      id: formatted.id,
      type: formatted.type,
      name: formatted.name,
      avatarUrl: formatted.avatarUrl,
      createdAt: formatted.createdAt,
      lastMessage: formatted.lastMessage ?? null,
      members:
        formatted.members?.map((member) => ({
          user: member.user!,
          role: member.role,
          isPinned: member.isPinned,
        })) ?? [],
      unreadCount: 0,
    };
  }

  private formatConversation(
    conversation: ConversationWithRelations,
  ): ConversationResponse {
    const lastMessage = conversation.messages[0];

    return {
      id: conversation.id,
      type: conversation.type as ConversationType,
      name: conversation.name,
      avatarUrl: conversation.avatarUrl,
      createdById: conversation.createdById,
      lastMessageId: lastMessage?.id ?? null,
      createdAt: conversation.createdAt,
      members: conversation.members.map((member) => ({
        id: member.id,
        conversationId: member.conversationId,
        userId: member.userId,
        role: member.role as MemberRole,
        isPinned: member.isPinned,
        isHidden: member.isHidden,
        joinedAt: member.joinedAt,
        user: member.user,
      })),
      lastMessage: lastMessage ? this.formatMessage(lastMessage) : null,
    };
  }

  private formatMessage(message: unknown): MessageResponse {
    const msg = message as MessageWithRelations;
    const reactions = msg.reactions
      ? this.calculateReactionsFromArray(msg.reactions)
      : undefined;

    return {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      type: msg.type as MessageType,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      isDeleted: msg.isDeleted,
      sender: msg.sender,
      replyToId: msg.replyToId ?? null,
      imageUrl: msg.imageUrl ?? null,
      imageUrls: msg.imageUrls ?? [],
      replyTo: msg.replyTo ? this.formatMessage(msg.replyTo) : null,
      reactions,
    };
  }
}

type ConversationWithRelations =
  Awaited<
    ReturnType<
      typeof prisma.conversation.findFirst<typeof conversationIncludeArg>
    >
  > extends infer T
    ? NonNullable<T>
    : never;

const conversationIncludeArg = {
  include: conversationInclude,
};

type MessageWithRelations = {
  id: string;
  conversationId: string;
  senderId: string | null;
  content: string | null;
  type: string;
  createdAt: Date;
  updatedAt: Date | null;
  isDeleted: boolean;
  replyToId: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  sender: {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    isOnline: boolean;
    lastSeen: Date | null;
    createdAt: Date;
  } | null;
  replyTo: unknown | null;
  reactions: {
    emoji: string;
    user: { id: string };
  }[];
};

export const chatService = new ChatService();
