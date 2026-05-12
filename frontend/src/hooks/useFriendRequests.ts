import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { friendService } from '@/services/friend.service'
import { useDebounce } from '@/hooks/useDebounce'
import type { FriendRequest, UserSearchResult } from '@/types/friend'

type FriendRequestTab = 'search' | 'requests'

interface UseFriendRequestsOptions {
  open: boolean
  onRequestsChange?: (count: number) => void
}

export function useFriendRequests({
  open,
  onRequestsChange
}: UseFriendRequestsOptions) {
  const [activeTab, setActiveTab] = useState<FriendRequestTab>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null
  )
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const loadRequests = useCallback(async () => {
    setIsLoadingRequests(true)
    try {
      const data = await friendService.getReceivedRequests()
      setRequests(data)
      onRequestsChange?.(data.length)
    } catch {
      toast.error('Failed to load friend requests')
    } finally {
      setIsLoadingRequests(false)
    }
  }, [onRequestsChange])

  const searchUsers = useCallback(async (searchValue: string) => {
    const query = searchValue.trim()
    if (query.length < 2) return

    setIsSearching(true)
    try {
      const results = await friendService.searchUsers(query)
      setSearchResults(results)
    } catch {
      toast.error('Failed to search users')
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (open && activeTab === 'requests') {
      loadRequests()
    }
  }, [activeTab, loadRequests, open])

  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      searchUsers(debouncedSearchQuery)
      return
    }

    setSearchResults([])
  }, [debouncedSearchQuery, searchUsers])

  const handleSendRequest = async (receiverId: string) => {
    setSendingRequestId(receiverId)
    try {
      await friendService.sendFriendRequest(receiverId)
      toast.success('Friend request sent!')
      setSearchResults((prev) =>
        prev.map((user) =>
          user.id === receiverId ? { ...user, requestSent: true } : user
        )
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send request'
      )
    } finally {
      setSendingRequestId(null)
    }
  }

  const removeRequest = (requestId: string) => {
    setRequests((prev) => {
      const next = prev.filter((request) => request.id !== requestId)
      onRequestsChange?.(next.length)
      return next
    })
  }

  const handleAccept = async (requestId: string) => {
    setProcessingRequestId(requestId)
    try {
      await friendService.acceptRequest(requestId)
      toast.success('Friend request accepted!')
      removeRequest(requestId)
    } catch {
      toast.error('Failed to accept request')
    } finally {
      setProcessingRequestId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setProcessingRequestId(requestId)
    try {
      await friendService.rejectRequest(requestId)
      toast.success('Friend request rejected')
      removeRequest(requestId)
    } catch {
      toast.error('Failed to reject request')
    } finally {
      setProcessingRequestId(null)
    }
  }

  const handleTabChange = (tab: FriendRequestTab) => {
    setActiveTab(tab)
  }

  return {
    activeTab,
    searchQuery,
    searchResults,
    requests,
    isSearching,
    isLoadingRequests,
    sendingRequestId,
    processingRequestId,
    setSearchQuery,
    handleTabChange,
    handleSendRequest,
    handleAccept,
    handleReject
  }
}
