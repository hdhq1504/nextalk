export interface UserSearchResult {
  id: string
  username: string
  email: string
  avatarUrl: string | null
}

export interface FriendRequest {
  id: string
  senderId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'rejected'
  sender: UserSearchResult
  createdAt: string
}

export interface Friend {
  id: string
  friendId: string
  friend: UserSearchResult
  createdAt: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
