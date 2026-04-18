import { Request } from 'express';
import { TokenPayload } from '../utils/jwt';

// =========================================
// ENUMS
// =========================================

export enum FriendRequestStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
}

export enum ConversationType {
  Direct = 'direct',
  Group = 'group',
}

export enum MemberRole {
  Admin = 'admin',
  Member = 'member',
}

export enum MessageType {
  Text = 'text',
  Image = 'image',
  File = 'file',
}

// =========================================
// API RESPONSE
// =========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =========================================
// AUTH
// =========================================

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface RegisterDto {
  email: string;
  password: string;
  username: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// =========================================
// USER
// =========================================

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface UserDetailResponse extends UserResponse {
  phone: string | null;
  dateOfBirth: Date | null;
  bio: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
}

export interface UserPublicResponse {
  id: string;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
}

// =========================================
// FRIEND REQUEST
// =========================================

export interface FriendRequestResponse {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  sender?: UserPublicResponse;
  receiver?: UserPublicResponse;
}

// =========================================
// FRIENDSHIP
// =========================================

export interface FriendshipResponse {
  id: string;
  userId: string;
  friendId: string;
  createdAt: Date;
  friend: UserPublicResponse;
}

// =========================================
// CONVERSATION
// =========================================

export interface ConversationMemberResponse {
  id: string;
  conversationId: string;
  userId: string;
  role: MemberRole;
  isPinned: boolean;
  isHidden: boolean;
  joinedAt: Date;
  user?: UserPublicResponse;
}

export interface ConversationResponse {
  id: string;
  type: ConversationType;
  name: string | null;
  avatarUrl: string | null;
  createdById: string | null;
  lastMessageId: string | null;
  createdAt: Date;
  members?: ConversationMemberResponse[];
  lastMessage?: MessageResponse | null;
}

export interface ConversationListItem {
  id: string;
  type: ConversationType;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  lastMessage: MessageResponse | null;
  members: {
    user: UserPublicResponse;
    role: MemberRole;
    isPinned: boolean;
  }[];
  unreadCount?: number;
}

// =========================================
// MESSAGE
// =========================================

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string | null;
  content: string | null;
  type: MessageType;
  createdAt: Date;
  updatedAt: Date | null;
  isDeleted: boolean;
  sender?: UserPublicResponse | null;
  readBy?: {
    userId: string;
    readAt: Date;
  }[];
}

export interface CreateMessageDto {
  conversationId: string;
  content: string;
  type?: MessageType;
}

// =========================================
// MESSAGE READ
// =========================================

export interface MessageReadResponse {
  id: string;
  messageId: string;
  userId: string;
  readAt: Date;
}

// =========================================
// SOCKET.IO EVENTS
// =========================================

export interface ServerToClientEvents {
  'message:new': (message: MessageResponse) => void;
  'message:update': (message: MessageResponse) => void;
  'message:delete': (data: { messageId: string; conversationId: string }) => void;
  'message:read': (data: { messageId: string; userId: string; readAt: Date }) => void;
  'user:typing': (data: { userId: string; username: string; isTyping: boolean }) => void;
  'user:online': (data: { userId: string; isOnline: boolean }) => void;
  'conversation:update': (conversation: ConversationResponse) => void;
  'friend:request:new': (request: FriendRequestResponse) => void;
  'friend:request:update': (request: FriendRequestResponse) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'message:send': (data: CreateMessageDto, callback?: (response: { success: boolean; message?: MessageResponse; error?: string }) => void) => void;
  'message:typing_start': (data: { conversationId: string }) => void;
  'message:typing_stop': (data: { conversationId: string }) => void;
  'message:read': (data: { messageId: string; conversationId: string }) => void;
  'conversation:join': (data: { conversationId: string }) => void;
  'conversation:leave': (data: { conversationId: string }) => void;
  'presence:update': (data: { isOnline: boolean }) => void;
}

// =========================================
// HTTP STATUS CODES
// =========================================

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;
