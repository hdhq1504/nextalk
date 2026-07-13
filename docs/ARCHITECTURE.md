# Nextalk Architecture

## 1. System Overview

Nextalk is a real-time chat application (1-on-1 & group) built with a modern full-stack architecture:

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS 4
- **Backend**: Node.js + Express 5 + TypeScript + Prisma ORM
- **Real-time**: Socket.io for WebSocket communication
- **Database**: PostgreSQL
- **Image Storage**: Cloudinary CDN

## 2. Project Structure

```
nextalk/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma              # Database schema
│   ├── src/
│   │   ├── app.ts                     # Express app setup (CORS, middleware, routes)
│   │   ├── index.ts                   # HTTP server entry, Socket.io init
│   │   ├── config/
│   │   │   ├── constants.ts           # App-wide constants (rate limit windows, etc.)
│   │   │   ├── database.ts            # Prisma client singleton
│   │   │   └── cloudinary.ts          # Cloudinary SDK config
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   └── friend.controller.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts     # JWT verification middleware
│   │   │   ├── errorHandler.ts        # Global error handler
│   │   │   └── rateLimit.ts           # express-rate-limit configs
│   │   ├── routes/
│   │   │   ├── index.ts               # Route aggregator
│   │   │   ├── auth.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   └── friend.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── friend.service.ts
│   │   │   └── __tests__/             # Service unit tests
│   │   ├── socket/
│   │   │   └── index.ts               # Socket.io handlers & room helpers
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript types
│   │   └── utils/
│   │       ├── jwt.ts                 # Sign/verify JWT tokens
│   │       ├── cookies.ts             # Cookie read/write helpers
│   │       ├── fileUpload.ts          # Multer config
│   │       ├── logger.ts              # Logger utility
│   │       └── validate.ts            # Zod validation helper
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Router setup
│   │   ├── main.tsx                   # React entry point
│   │   ├── assets/                    # Static assets
│   │   ├── components/
│   │   │   ├── ui/                    # Shadcn UI primitives
│   │   │   ├── ConversationDetails/   # Sidebar: group info, members
│   │   │   ├── ConversationHeader/    # Chat header with actions
│   │   │   ├── ConversationItem/      # Conversation list row
│   │   │   ├── ConversationList/      # Left-panel list container
│   │   │   ├── FriendRequestModal/    # Friend request UI
│   │   │   ├── ImageGrid/             # Multi-image grid display
│   │   │   ├── ImageLightbox/         # Full-screen image viewer
│   │   │   ├── LoginForm/             # Login form component
│   │   │   ├── MessageBubble/         # Individual message bubble
│   │   │   ├── MessageInput/          # Input area with emoji & attach
│   │   │   ├── MessageList/           # Scrollable message container
│   │   │   ├── NewChatModal/          # Create DM or group chat
│   │   │   ├── PasswordInput/         # Password field with toggle
│   │   │   ├── PasswordStrengthIndicator/
│   │   │   ├── ProtectedRoute/        # Auth guard wrapper
│   │   │   ├── SettingsModal/         # User settings UI
│   │   │   ├── Sidebar/              # Main navigation sidebar
│   │   │   ├── SignUpForm/            # Registration form
│   │   │   ├── UserInfoModal/         # View user profile modal
│   │   │   └── UserMenu/              # Avatar dropdown menu
│   │   ├── constants/
│   │   │   └── chat.ts                # Chat-related constants
│   │   ├── data/
│   │   │   └── mock-chat.ts           # Mock data for development/testing
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   ├── useFriendRequests.ts
│   │   │   ├── useImageAttachments.ts
│   │   │   └── useNewChatModal.ts
│   │   ├── layouts/
│   │   │   ├── AuthLayout.tsx         # Centered layout for auth pages
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── axios.ts               # Axios instance with token interceptors
│   │   │   ├── cookie.ts              # Browser cookie helpers
│   │   │   ├── socket.ts              # Socket.io client with reconnect logic
│   │   │   ├── token.ts               # JWT decode & expiry check
│   │   │   └── utils.ts               # cn() class utility
│   │   ├── pages/
│   │   │   ├── Chat/                  # Main chat page
│   │   │   ├── Login/
│   │   │   ├── Profile/               # User profile page
│   │   │   └── SignUp/
│   │   ├── services/
│   │   │   ├── auth.service.ts        # Auth API calls + token management
│   │   │   ├── chat.service.ts        # Chat/message API + data normalizers
│   │   │   └── friend.service.ts      # Friend request API calls
│   │   ├── stores/
│   │   │   ├── auth-store.ts          # Auth state (Zustand)
│   │   │   ├── chat-store.ts          # Chat state (Zustand)
│   │   │   ├── chat-store.helpers.ts  # Pure helper functions for store
│   │   │   ├── chat-store.types.ts    # ChatState interface definition
│   │   │   └── chat-socket-listeners.ts # Socket event → store dispatchers
│   │   ├── styles/                    # Global CSS / Tailwind overrides
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   └── chat.ts
│   │   └── utils/
│   │       ├── conversation.ts
│   │       ├── date.ts
│   │       ├── format.ts
│   │       ├── friend.ts
│   │       └── password-strength.ts
│   └── package.json
│
├── docker-compose.yml                 # PostgreSQL local dev container
└── .env.example                       # Environment variable template
```

## 3. Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express | 5 | REST API framework |
| Socket.io | 4 | Real-time WebSocket communication |
| Prisma | 7 | ORM with PostgreSQL |
| JWT | — | Access/refresh token authentication |
| Zod | — | Request schema validation |
| Multer | — | Multipart file upload |
| Cloudinary | — | Image CDN and storage |
| bcryptjs | — | Password hashing |
| express-rate-limit | — | Rate limiting for auth & search endpoints |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI library |
| TypeScript | — | Type safety |
| Vite | — | Build tool and dev server |
| TailwindCSS | 4 | Utility-first styling |
| Zustand | — | Lightweight state management |
| Socket.io-client | — | Real-time connection |
| Axios | — | HTTP client with interceptors |
| React Router | 7 | Client-side routing |
| Shadcn UI | — | Accessible component primitives |
| emoji-picker-react | — | Emoji selection panel |
| Sonner | — | Toast notifications |

## 4. Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────────┐       ┌─────────────┐
│    User     │───────│  ConversationMember │───────│ Conversation│
└──────┬──────┘       └─────────────────────┘       └──────┬──────┘
       │                                                    │
       │                 ┌──────────────────────┐          │
       │                 │       Message        │◄─────────┘
       │                 └──────┬───────────────┘
       │                        │
       │              ┌─────────┴──────────────┐
       │              │                        │
       ▼              ▼                        ▼
┌─────────────┐  ┌──────────────┐   ┌─────────────────────┐
│FriendRequest│  │ MessageRead  │   │  MessageReaction    │
└─────────────┘  └──────────────┘   └─────────────────────┘
       │
       ▼
┌─────────────┐
│ Friendship  │
└─────────────┘
```

### Models

#### User
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `email` | String (unique) | User email |
| `username` | String (unique) | Display name |
| `passwordHash` | String | Bcrypt hashed password |
| `phone` | String? | Optional phone number |
| `dateOfBirth` | DateTime? | Optional date of birth |
| `bio` | String? | Optional profile bio |
| `avatarUrl` | String? | Profile picture URL (Cloudinary) |
| `isOnline` | Boolean | Online status flag |
| `lastSeen` | DateTime? | Last activity timestamp |
| `tokenVersion` | Int | Increments on logout to invalidate tokens |

#### Conversation
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `type` | Enum | `direct` or `group` |
| `name` | String? | Group name (optional) |
| `avatarUrl` | String? | Group avatar (optional) |
| `createdById` | String? | Creator user ID |

#### ConversationMember
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `conversationId` + `userId` | Composite unique | Member record |
| `role` | Enum | `admin` or `member` |
| `isPinned` | Boolean | Pin conversation flag |
| `isHidden` | Boolean | Hide from list flag |
| `joinedAt` | DateTime | Join timestamp |

#### Message
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `conversationId` | String | Foreign key → Conversation |
| `senderId` | String? | Foreign key → User (null if deleted) |
| `content` | String? | Text content (null when recalled) |
| `type` | Enum | `text`, `image`, or `file` |
| `isDeleted` | Boolean | Recall flag |
| `replyToId` | String? | Self-referencing FK for replies |
| `imageUrl` | String? | Single image URL (legacy) |
| `imageUrls` | String[] | Multiple image URLs |

#### MessageReaction
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `messageId` + `userId` + `emoji` | Composite unique | One emoji per user per message |
| `emoji` | String | Unicode emoji character |

#### MessageRead
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `messageId` + `userId` | Composite unique | Read receipt |
| `readAt` | DateTime | Read timestamp |

#### FriendRequest
- `senderId`, `receiverId` (composite unique)
- `status`: `pending` / `accepted` / `rejected`

#### Friendship
- `userId` + `friendId` (composite unique)
- Direct conversations only allowed between friends

## 5. API Design

### REST Endpoints

#### Authentication (`/api/auth`)
```
POST   /register          - Register new user             [rate limited]
POST   /login             - Login, return tokens          [rate limited]
POST   /refresh           - Refresh access token          [rate limited]
POST   /logout            - Logout (clears tokens)        [auth required]
GET    /profile           - Get current user profile      [auth required]
PUT    /profile           - Update profile (avatar, bio…) [auth required]
POST   /check-email       - Check if email exists         [public]
```

#### Conversations (`/api/conversations`)
```
GET    /                           - List user's conversations      [auth]
POST   /direct                     - Create/get direct conversation  [auth]
POST   /group                      - Create group conversation       [auth]
GET    /:id/messages               - Get messages (cursor-paginated) [auth]
GET    /:id/messages/search        - Search messages by query        [auth, rate limited]
POST   /:id/messages/image         - Upload image message            [auth]
PATCH  /messages/:messageId/recall - Recall own message              [auth]
POST   /messages/:messageId/reactions - Toggle emoji reaction        [auth]
POST   /:id/members                - Add member to group             [auth]
DELETE /:id/members/:userId        - Remove member from group        [auth]
POST   /:id/remove                 - Remove self from conversation   [auth]
DELETE /:id                        - Delete conversation (admin)     [auth]
PATCH  /:id                        - Update group info (name/avatar) [auth]
POST   /:id/leave                  - Leave group conversation        [auth]
```

#### Friends (`/api/friends`)
```
GET    /                  - List friends                          [auth]
POST   /search            - Search users by username/email        [auth, rate limited]
POST   /request           - Send friend request                   [auth]
GET    /requests          - Get received friend requests          [auth]
GET    /requests/count    - Get pending requests count            [auth]
POST   /accept/:id        - Accept friend request                 [auth]
POST   /reject/:id        - Reject friend request                 [auth]
```

### Socket.io Events

#### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ conversationId, content, replyToId? }` | Send text message |
| `message:recall` | `{ messageId }` | Recall own message |
| `message:react` | `{ messageId, emoji }` | Toggle reaction |
| `conversation:join` | `{ conversationId }` | Join conversation room |
| `conversation:leave` | `{ conversationId }` | Leave conversation room |

#### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `MessageResponse` | New message received |
| `message:recall` | `{ messageId, conversationId }` | Message was recalled |
| `message:react` | `{ messageId, conversationId, reactions }` | Reactions updated |
| `conversation:update` | `ConversationResponse` | Conversation metadata updated |
| `conversation:member_added` | `{ conversationId, userId, conversation }` | Member added to group |
| `conversation:member_removed` | `{ conversationId, userId }` | Member removed from group |
| `conversation:deleted` | `{ conversationId }` | Conversation deleted |
| `conversation:updated` | `ConversationResponse` | Group info updated (name/avatar) |
| `error` | `{ message }` | Server-side error notification |

## 6. State Management

### Auth Store (Zustand)
```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  // Actions
  login(email, password): Promise<void>
  register(email, password, username): Promise<void>
  logout(): void
  checkAuth(): Promise<void>          // Validates stored tokens on app load
  setUser(user): void
  updateProfile(data): Promise<void>
}
```

### Chat Store (Zustand)

The chat store is split across multiple files for maintainability:
- **`chat-store.types.ts`** — `ChatState` interface
- **`chat-store.helpers.ts`** — Pure reducer-style helper functions
- **`chat-store.ts`** — Zustand store implementation
- **`chat-socket-listeners.ts`** — Binds socket events to store actions

```typescript
interface ChatState {
  // State
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Record<string, Message[]>
  messageCursors: Record<string, string | undefined>  // Cursor pagination
  hasMoreMessages: Record<string, boolean>
  isLoading: boolean
  isMessagesLoading: boolean
  error: string | null
  replyingTo: Message | null
  searchQuery: string
  searchResults: Message[]
  isSearching: boolean

  // Actions
  fetchConversations(): Promise<Conversation[]>
  setActiveConversation(conversation): void
  fetchMessages(conversationId): Promise<void>
  loadMoreMessages(conversationId): Promise<void>       // Cursor-based pagination
  searchMessages(conversationId, query): Promise<void>
  clearSearch(): void
  createDirectConversation(...): Promise<Conversation>
  createGroupConversation(...): Promise<Conversation>
  addGroupMember(...): Promise<void>
  removeGroupMember(...): Promise<void>
  deleteConversation(...): Promise<void>
  removeConversation(...): Promise<void>
  updateGroupInfo(...): Promise<void>
  leaveGroup(...): Promise<void>
  sendMessage(...): Promise<void>
  sendImageMessage(...): Promise<void>
  addOptimisticMessage(message): void                   // Optimistic UI
  replaceOptimisticMessage(tempId, message): void
  updateMessageStatus(tempId, status): void
  addMessage(message): void
  upsertConversation(conversation): void
  updateConversationLastMessage(conversationId, message): void
  recallMessage(messageId): Promise<void>
  reactToMessage(messageId, emoji): Promise<void>
  updateMessage(messageId, conversationId, patch): void
  updateMessageReactions(messageId, conversationId, reactions): void
  removeMemberFromConversation(conversationId, userId): void
  removeConversationFromStore(conversationId): void
  resetStore(): void
}
```

### Optimistic UI Pattern

Messages are sent using an optimistic approach to eliminate perceived latency:

```
1. addOptimisticMessage({ tempId, status: 'pending' }) → immediate UI update
2. API/Socket call → server processes message
3a. Success → replaceOptimisticMessage(tempId, serverMessage) → status: 'sent'
3b. Failure → updateMessageStatus(tempId, 'failed') → show error state
```

## 7. Real-time Architecture

### Socket Connection Lifecycle

```
┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │
└────┬─────┘                    └────┬─────┘
     │                               │
     │──── JWT Auth Handshake ───────►│ (token in handshake.auth or cookie)
     │◄─── Connection Established ───│
     │     Auto-join all user rooms  │
     │     Auto-join conversation rooms
     │                               │
     │──── conversation:join ────────►│ (validate membership)
     │◄─── (joined room) ────────────│
     │                               │
     │──── message:send ─────────────►│
     │◄─── callback { success, msg } │
     │◄─── message:new (broadcast) ──│ (to all room members)
     │◄─── conversation:update ──────│ (to all room members)
     │                               │
```

### Room Management
| Room Name | Members | Purpose |
|-----------|---------|---------|
| `conversation:{id}` | All conversation members | Message broadcast |
| `user:{userId}` | Single user | Private notifications (e.g. new conversation) |

### Auto-join on Connect
On socket connection, the server automatically:
1. Joins `user:{userId}` private room
2. Fetches all user conversations and joins each `conversation:{id}` room

This ensures users receive real-time updates (e.g., new group added) without manual `conversation:join` calls.

### Socket Client Architecture (Frontend)

`lib/socket.ts` exposes a `socketClient` singleton with:
- Automatic reconnection logic
- `setReconnectHandler()` to re-register listeners after reconnect
- Token injected from `authService.getAccessToken()` on connect

`chat-socket-listeners.ts` registers all event handlers and dispatches directly to the Zustand store via `useChatStore.getState()`.

## 8. Security

### Authentication
- **Access tokens**: Short-lived JWT, stored in `localStorage`
- **Refresh tokens**: Long-lived JWT, stored in `localStorage` (via `cookie.ts`)
- **Token version**: `tokenVersion` field on `User` — invalidates all tokens on logout
- **Socket auth**: JWT validated in Socket.io middleware before connection

### Authorization
- Conversation membership verified before every message/member operation
- Only the message sender can recall their own messages
- Only `admin` role can delete a conversation
- Direct conversations restricted to friends only

### Rate Limiting
| Limiter | Endpoint | Window | Max |
|---------|----------|--------|-----|
| `authRateLimiter` | `/register`, `/login` | 15 min | 10 |
| `refreshRateLimiter` | `/refresh` | 15 min | 20 |
| `searchRateLimiter` | `/friends/search`, `/messages/search` | 1 min | 30 |

### Input Validation
- Zod schemas on all REST endpoints (via `utils/validate.ts`)
- Multer file type/size validation for image uploads
- Content sanitization before DB storage

## 9. Frontend Architecture Patterns

### Service Layer
Each service (`auth.service.ts`, `chat.service.ts`, `friend.service.ts`) handles:
- Raw API calls via the Axios instance
- Token storage/retrieval
- Response normalization (e.g., `normalizeMessage`, `normalizeConversation`)

### Custom Hooks
| Hook | Purpose |
|------|---------|
| `useDebounce` | Debounce search query input |
| `useFriendRequests` | Fetch and manage friend request state |
| `useImageAttachments` | Handle file picker and image preview |
| `useNewChatModal` | Logic for the "New Chat" modal flow |

### Routing
```
/           → redirect to /chat or /login
/login      → Login page (AuthLayout)
/signup     → SignUp page (AuthLayout)
/chat       → Chat page (ProtectedRoute)
/profile    → Profile page (ProtectedRoute)
```

## 10. Environment Variables

### Backend (`.env`)
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/nextalk

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

## 11. Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or use `docker-compose.yml`)
- Cloudinary account (free tier)

### Setup
```bash
# 1. Start database (Docker)
docker-compose up -d

# 2. Backend
cd backend
npm install
cp ../.env.example .env      # Fill in your values
npx prisma migrate dev --name init
npm run dev                  # http://localhost:4000

# 3. Frontend
cd ../frontend
npm install
npm run dev                  # http://localhost:5173
```

### Database Migrations
After schema changes:
```bash
cd backend
npx prisma migrate dev --name <migration_name>
npx prisma generate
```

### Running Tests
```bash
cd backend
npm test                     # Runs service unit tests in src/services/__tests__/
```
