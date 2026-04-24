import type { Conversation, Message } from '@/types/chat'
import type { User } from '@/types/auth'

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'alice@example.com',
    username: 'Alice Johnson',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'user-2',
    email: 'bob@example.com',
    username: 'Bob Smith',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    createdAt: '2024-01-16T09:00:00Z'
  },
  {
    id: 'user-3',
    email: 'carol@example.com',
    username: 'Carol Davis',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    createdAt: '2024-01-17T10:00:00Z'
  },
  {
    id: 'user-4',
    email: 'david@example.com',
    username: 'David Wilson',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
    createdAt: '2024-01-18T11:00:00Z'
  },
  {
    id: 'user-5',
    email: 'emma@example.com',
    username: 'Emma Brown',
    avatarUrl: null,
    createdAt: '2024-01-19T12:00:00Z'
  }
]

export const CURRENT_USER: User = mockUsers[0]

const makeMember = (
  user: User,
  conversationId: string
): import('@/types/chat').ConversationMember => ({
  id: `member-${user.id}-${conversationId}`,
  userId: user.id,
  user,
  conversationId,
  joinedAt: user.createdAt
})

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    name: null,
    isGroup: false,
    members: [
      makeMember(mockUsers[0], 'conv-1'),
      makeMember(mockUsers[1], 'conv-1')
    ],
    lastMessage: null,
    updatedAt: '2024-03-15T14:30:00Z',
    createdAt: '2024-03-01T10:00:00Z'
  },
  {
    id: 'conv-2',
    name: null,
    isGroup: false,
    members: [
      makeMember(mockUsers[0], 'conv-2'),
      makeMember(mockUsers[2], 'conv-2')
    ],
    lastMessage: null,
    updatedAt: '2024-03-15T12:00:00Z',
    createdAt: '2024-03-02T11:00:00Z'
  },
  {
    id: 'conv-3',
    name: 'Weekend Trip Planning',
    isGroup: true,
    members: [
      makeMember(mockUsers[0], 'conv-3'),
      makeMember(mockUsers[1], 'conv-3'),
      makeMember(mockUsers[2], 'conv-3'),
      makeMember(mockUsers[3], 'conv-3')
    ],
    lastMessage: null,
    updatedAt: '2024-03-14T18:00:00Z',
    createdAt: '2024-03-10T09:00:00Z'
  },
  {
    id: 'conv-4',
    name: null,
    isGroup: false,
    members: [
      makeMember(mockUsers[0], 'conv-4'),
      makeMember(mockUsers[4], 'conv-4')
    ],
    lastMessage: null,
    updatedAt: '2024-03-13T16:45:00Z',
    createdAt: '2024-03-05T14:00:00Z'
  },
  {
    id: 'conv-5',
    name: 'Project Alpha Team',
    isGroup: true,
    members: [
      makeMember(mockUsers[0], 'conv-5'),
      makeMember(mockUsers[1], 'conv-5'),
      makeMember(mockUsers[3], 'conv-5')
    ],
    lastMessage: null,
    updatedAt: '2024-03-12T09:30:00Z',
    createdAt: '2024-02-20T08:00:00Z'
  }
]

const makeMessage = (
  id: string,
  content: string,
  sender: User,
  conversationId: string,
  createdAt: string
): Message => ({
  id,
  content,
  senderId: sender.id,
  sender,
  conversationId,
  createdAt,
  updatedAt: createdAt
})

export const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    makeMessage(
      'msg-1-1',
      "Hey Bob! How's your day going?",
      mockUsers[0],
      'conv-1',
      '2024-03-15T10:00:00Z'
    ),
    makeMessage(
      'msg-1-2',
      'Hi Alice! Pretty good, just finished a big project at work. You?',
      mockUsers[1],
      'conv-1',
      '2024-03-15T10:05:00Z'
    ),
    makeMessage(
      'msg-1-3',
      'Same here! We shipped the new feature yesterday.',
      mockUsers[0],
      'conv-1',
      '2024-03-15T10:07:00Z'
    ),
    makeMessage(
      'msg-1-4',
      "That's awesome! We should celebrate 🎉",
      mockUsers[1],
      'conv-1',
      '2024-03-15T10:10:00Z'
    ),
    makeMessage(
      'msg-1-5',
      'Absolutely! Want to grab dinner this Friday?',
      mockUsers[0],
      'conv-1',
      '2024-03-15T10:12:00Z'
    ),
    makeMessage(
      'msg-1-6',
      'Sounds great! Italian or something else?',
      mockUsers[1],
      'conv-1',
      '2024-03-15T10:15:00Z'
    ),
    makeMessage(
      'msg-1-7',
      "Italian sounds perfect. There's that place on 5th Street.",
      mockUsers[0],
      'conv-1',
      '2024-03-15T10:18:00Z'
    ),
    makeMessage(
      'msg-1-8',
      "Oh yes, Trattoria Milano! I've been wanting to try it.",
      mockUsers[1],
      'conv-1',
      '2024-03-15T14:30:00Z'
    )
  ],

  'conv-2': [
    makeMessage(
      'msg-2-1',
      'Carol! Did you see the concert announcement?',
      mockUsers[0],
      'conv-2',
      '2024-03-15T09:00:00Z'
    ),
    makeMessage(
      'msg-2-2',
      "Yes! Coldplay is coming to town! I'm so excited 🎸",
      mockUsers[2],
      'conv-2',
      '2024-03-15T09:15:00Z'
    ),
    makeMessage(
      'msg-2-3',
      'We should definitely go together!',
      mockUsers[0],
      'conv-2',
      '2024-03-15T09:20:00Z'
    ),
    makeMessage(
      'msg-2-4',
      'For sure! Tickets go on sale tomorrow at 10 AM.',
      mockUsers[2],
      'conv-2',
      '2024-03-15T09:25:00Z'
    ),
    makeMessage(
      'msg-2-5',
      'Set an alarm then! 😅',
      mockUsers[0],
      'conv-2',
      '2024-03-15T12:00:00Z'
    )
  ],

  'conv-3': [
    makeMessage(
      'msg-3-1',
      'Hey everyone! So we need to finalize the weekend trip plans.',
      mockUsers[0],
      'conv-3',
      '2024-03-14T10:00:00Z'
    ),
    makeMessage(
      'msg-3-2',
      'I was thinking we could rent a cabin in the mountains?',
      mockUsers[1],
      'conv-3',
      '2024-03-14T10:30:00Z'
    ),
    makeMessage(
      'msg-3-3',
      "That sounds perfect! I've been wanting to go hiking.",
      mockUsers[2],
      'conv-3',
      '2024-03-14T11:00:00Z'
    ),
    makeMessage(
      'msg-3-4',
      'Count me in! Should we bring camping gear?',
      mockUsers[3],
      'conv-3',
      '2024-03-14T11:30:00Z'
    ),
    makeMessage(
      'msg-3-5',
      'Yes! I have extra tents we can use.',
      mockUsers[0],
      'conv-3',
      '2024-03-14T12:00:00Z'
    ),
    makeMessage(
      'msg-3-6',
      "I'll bring the cooler and BBQ supplies 🧊🍖",
      mockUsers[1],
      'conv-3',
      '2024-03-14T14:00:00Z'
    ),
    makeMessage(
      'msg-3-7',
      'I can handle the food and drinks 🥤',
      mockUsers[2],
      'conv-3',
      '2024-03-14T15:00:00Z'
    ),
    makeMessage(
      'msg-3-8',
      "Perfect! Let's meet at the trailhead Saturday morning at 7 AM?",
      mockUsers[3],
      'conv-3',
      '2024-03-14T16:00:00Z'
    ),
    makeMessage(
      'msg-3-9',
      "Works for me! I'll drive my SUV so there's room for everyone.",
      mockUsers[0],
      'conv-3',
      '2024-03-14T18:00:00Z'
    )
  ],

  'conv-4': [
    makeMessage(
      'msg-4-1',
      'Hi Emma! I got your contact from the photography club.',
      mockUsers[0],
      'conv-4',
      '2024-03-13T14:00:00Z'
    ),
    makeMessage(
      'msg-4-2',
      "Oh hi! Nice to meet you. Yes, I heard you're into photography too!",
      mockUsers[4],
      'conv-4',
      '2024-03-13T14:10:00Z'
    ),
    makeMessage(
      'msg-4-3',
      "I'd love to collaborate on a project sometime. Your landscape shots are stunning!",
      mockUsers[0],
      'conv-4',
      '2024-03-13T14:30:00Z'
    ),
    makeMessage(
      'msg-4-4',
      'Thank you so much! That means a lot 💚',
      mockUsers[4],
      'conv-4',
      '2024-03-13T15:00:00Z'
    ),
    makeMessage(
      'msg-4-5',
      "There's a sunrise shoot at the lake next weekend. Interested?",
      mockUsers[0],
      'conv-4',
      '2024-03-13T16:45:00Z'
    )
  ],

  'conv-5': [
    makeMessage(
      'msg-5-1',
      "Team, let's sync up on Project Alpha progress.",
      mockUsers[0],
      'conv-5',
      '2024-03-12T09:00:00Z'
    ),
    makeMessage(
      'msg-5-2',
      'Frontend is 80% done. Waiting on the API endpoints.',
      mockUsers[1],
      'conv-5',
      '2024-03-12T09:15:00Z'
    ),
    makeMessage(
      'msg-5-3',
      "The backend is ready. I'll send you the docs today.",
      mockUsers[3],
      'conv-5',
      '2024-03-12T09:30:00Z'
    )
  ]
}

const setLastMessages = () => {
  const lastMessageMap: Record<string, Message> = {
    'conv-1': mockMessages['conv-1'][mockMessages['conv-1'].length - 1],
    'conv-2': mockMessages['conv-2'][mockMessages['conv-2'].length - 1],
    'conv-3': mockMessages['conv-3'][mockMessages['conv-3'].length - 1],
    'conv-4': mockMessages['conv-4'][mockMessages['conv-4'].length - 1],
    'conv-5': mockMessages['conv-5'][mockMessages['conv-5'].length - 1]
  }

  mockConversations.forEach((conv) => {
    conv.lastMessage = lastMessageMap[conv.id] ?? null
  })
}

setLastMessages()
