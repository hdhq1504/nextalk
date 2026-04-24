import { apiClient } from '@/lib/axios'
import type {
  FriendRequest,
  Friend,
  UserSearchResult,
  ApiResponse
} from '@/types/friend'

export const friendService = {
  async searchUsers(query: string): Promise<UserSearchResult[]> {
    const response = await apiClient.post<ApiResponse<UserSearchResult[]>>(
      '/friends/search',
      { query }
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to search users')
    }

    return response.data.data
  },

  async sendFriendRequest(receiverId: string): Promise<FriendRequest> {
    const response = await apiClient.post<ApiResponse<FriendRequest>>(
      '/friends/request',
      { receiverId }
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to send friend request')
    }

    return response.data.data
  },

  async getReceivedRequests(): Promise<FriendRequest[]> {
    const response =
      await apiClient.get<ApiResponse<FriendRequest[]>>('/friends/requests')

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch friend requests')
    }

    return response.data.data
  },

  async acceptRequest(requestId: string): Promise<FriendRequest> {
    const response = await apiClient.post<ApiResponse<FriendRequest>>(
      `/friends/accept/${requestId}`
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to accept friend request')
    }

    return response.data.data
  },

  async rejectRequest(requestId: string): Promise<FriendRequest> {
    const response = await apiClient.post<ApiResponse<FriendRequest>>(
      `/friends/reject/${requestId}`
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to reject friend request')
    }

    return response.data.data
  },

  async getFriends(): Promise<Friend[]> {
    const response = await apiClient.get<ApiResponse<Friend[]>>('/friends')

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch friends')
    }

    return response.data.data
  },

  async getPendingRequestsCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      '/friends/requests/count'
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error || 'Failed to fetch pending requests count'
      )
    }

    return response.data.data.count
  }
}
