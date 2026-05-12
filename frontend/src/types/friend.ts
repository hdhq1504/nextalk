import type { User } from '@/types/auth'

export type UserSearchResult = Pick<
  User,
  'id' | 'username' | 'email' | 'avatarUrl' | 'createdAt'
>

export interface FriendRequest {
  id: string
  senderId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'rejected'
  sender: UserSearchResult
  createdAt: string
}

export type Friend = Pick<FriendRequest, 'id' | 'createdAt'> & {
  friendId: UserSearchResult['id']
  friend: UserSearchResult
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
