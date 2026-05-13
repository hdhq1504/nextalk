import { Search, UserPlus, Check, X, Loader2 } from 'lucide-react'
import { useFriendRequests } from '@/hooks/useFriendRequests'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/format'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FriendRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestsChange?: (count: number) => void
}

export function FriendRequestModal({
  open,
  onOpenChange,
  onRequestsChange
}: FriendRequestModalProps) {
  const {
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
  } = useFriendRequests({ open, onRequestsChange })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='gap-0 p-0 sm:max-w-lg' showCloseButton={false}>
        {/* Header with Tabs */}
        <div className='flex items-center border-b'>
          <div className='flex flex-1 pr-2'>
            <button
              type='button'
              onClick={() => handleTabChange('search')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                'hover:bg-accent/50',
                activeTab === 'search'
                  ? 'border-primary text-primary border-b-2'
                  : 'text-muted-foreground'
              )}
            >
              Search Users
            </button>
            <button
              type='button'
              onClick={() => handleTabChange('requests')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                'hover:bg-accent/50',
                activeTab === 'requests'
                  ? 'border-primary text-primary border-b-2'
                  : 'text-muted-foreground'
              )}
            >
              Friend Requests
            </button>
          </div>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className='space-y-4 p-4'>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
              <Input
                type='search'
                placeholder='Search by username or email...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9'
              />
              {isSearching && (
                <Loader2 className='text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin' />
              )}
            </div>

            <ScrollArea className='h-[300px]'>
              <div className='space-y-2'>
                {searchResults.length === 0 &&
                  searchQuery.length >= 2 &&
                  !isSearching && (
                    <p className='text-muted-foreground py-8 text-center text-sm'>
                      No users found
                    </p>
                  )}
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className='flex items-center gap-3 rounded-lg border p-3'
                  >
                    <Avatar>
                      {user.avatarUrl && (
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                      )}
                      <AvatarFallback>
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium'>
                        {user.username}
                      </p>
                      <p className='text-muted-foreground truncate text-xs'>
                        {user.email}
                      </p>
                    </div>
                    <Button
                      size='sm'
                      onClick={() => handleSendRequest(user.id)}
                      disabled={
                        sendingRequestId === user.id || user.requestSent
                      }
                      aria-label={
                        user.requestSent
                          ? 'Friend request sent'
                          : 'Send friend request'
                      }
                    >
                      {sendingRequestId === user.id ? (
                        <Loader2 className='size-4 animate-spin' />
                      ) : user.requestSent ? (
                        <Check className='size-4' />
                      ) : (
                        <UserPlus className='size-4' />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className='p-4'>
            {isLoadingRequests ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='text-muted-foreground size-6 animate-spin' />
              </div>
            ) : requests.length === 0 ? (
              <div className='py-12 text-center'>
                <p className='text-muted-foreground text-sm'>
                  No pending friend requests
                </p>
              </div>
            ) : (
              <ScrollArea className='h-[300px]'>
                <div className='space-y-3'>
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className='flex items-center gap-3 rounded-lg border p-3'
                    >
                      <Avatar>
                        {request.sender.avatarUrl && (
                          <AvatarImage
                            src={request.sender.avatarUrl}
                            alt={request.sender.username}
                          />
                        )}
                        <AvatarFallback>
                          {getInitials(request.sender.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium'>
                          {request.sender.username}
                        </p>
                        <p className='text-muted-foreground truncate text-xs'>
                          {request.sender.email}
                        </p>
                      </div>
                      <div className='flex gap-1'>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          className='text-green-600 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900'
                          onClick={() => handleAccept(request.id)}
                          disabled={processingRequestId === request.id}
                          aria-label='Accept request'
                        >
                          {processingRequestId === request.id ? (
                            <Loader2 className='size-4 animate-spin' />
                          ) : (
                            <Check className='size-4' />
                          )}
                        </Button>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          className='text-destructive hover:bg-destructive/10'
                          onClick={() => handleReject(request.id)}
                          disabled={processingRequestId === request.id}
                          aria-label='Reject request'
                        >
                          <X className='size-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
