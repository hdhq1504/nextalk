# Nextalk Architecture

## 1. System Overview

Nextalk is a real-time 1-on-1 chat application built with a modern full-stack architecture:

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Real-time**: Socket.io for WebSocket communication
- **Database**: PostgreSQL
- **Image Storage**: Cloudinary CDN

## 2. Project Structure

```
nextalk/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts         # Prisma client
│   │   │   └── cloudinary.ts        # Cloudinary config
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   └── friend.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   └── friend.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── chat.service.ts
│   │   │   └── friend.service.ts
│   │   ├── socket/
│   │   │   └── index.ts            # Socket.io handlers
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   └── fileUpload.ts        # Multer config
│   │   └── index.ts                 # Express app entry
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  # Shadcn UI components
│   │   │   ├── ImageLightbox/       # Image viewer modal
│   │   │   ├── MessageBubble/        # Chat message bubble
│   │   │   ├── MessageInput/         # Message input area
│   │   │   └── MessageList/          # Message list container
│   │   ├── lib/
│   │   │   ├── axios.ts              # Axios client
│   │   │   ├── socket.ts             # Socket.io client
│   │   │   └── utils.ts              # Utility functions
│   │   ├── services/
│   │   │   └── chat.service.ts       # Chat API + Socket calls
│   │   ├── stores/
│   │   │   ├── auth-store.ts         # Auth state (Zustand)
│   │   │   └── chat-store.ts         # Chat state (Zustand)
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   └── chat.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
└── implementation_plan.md           # Feature specification
```

## 3. Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Express 5 | REST API framework |
| Socket.io 4 | Real-time WebSocket communication |
| Prisma 7 | ORM with PostgreSQL |
| JWT | Access/refresh token authentication |
| Zod | Request validation |
| Multer | Multipart file upload |
| Cloudinary | Image CDN and storage |
| bcryptjs | Password hashing |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI library |
| TypeScript | Type safety |
| Vite | Build tool |
| TailwindCSS 4 | Styling |
| Zustand | State management |
| Socket.io-client | Real-time connection |
| Axios | HTTP client |
| emoji-picker-react | Emoji selection |
| Sonner | Toast notifications |
| React Router 7 | Client-side routing |

## 4. Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────────┐       ┌─────────────┐
│    User     │───────│  ConversationMember │───────│ Conversation│
└─────────────┘       └─────────────────────┘       └──────┬──────┘
       │                                                   │
       │                                                   │
       ▼                    ┌─────────────────────┐        │
┌─────────────┐       ┌─────┤      Message        │◄───────┘
│FriendRequest│       │     └──────────┬──────────┘
└─────────────┘       │                │
       │              │                │
       ▼              │                ▼
┌─────────────┐       │     ┌─────────────────────┐
│ Friendship  │       │     │  MessageReaction    │
└─────────────┘       │     └─────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  MessageRead  │
              └───────────────┘
```

### Models

#### User
- `id` (UUID): Primary key
- `email` (unique): User email
- `username` (unique): Display name
- `passwordHash`: Bcrypt hashed password
- `avatarUrl`: Profile picture URL
- `isOnline`: Online status flag
- `lastSeen`: Last activity timestamp

#### Conversation
- `id` (UUID): Primary key
- `type`: Enum (direct/group)
- `name`: Group name (optional)
- `avatarUrl`: Group avatar (optional)
- `createdById`: Creator user ID

#### ConversationMember
- `conversationId` + `userId`: Composite unique key
- `role`: Enum (admin/member)
- `isPinned`: Pin conversation flag
- `isHidden`: Hide from list flag

#### Message
- `id` (UUID): Primary key
- `conversationId`: Foreign key
- `senderId`: Foreign key to User
- `content`: Message text (nullable when deleted)
- `type`: Enum (text/image/file)
- `isDeleted`: Recall flag
- `replyToId`: Foreign key to Message (self-reference)
- `imageUrl`: Cloudinary URL for images
- `reactions`: Relation to MessageReaction[]

#### MessageReaction
- `id` (UUID): Primary key
- `messageId` + `userId` + `emoji`: Composite unique key
- `emoji`: Unicode emoji character
- `createdAt`: Reaction timestamp

#### Friendship
- `userId` + `friendId`: Composite unique key
- Direct conversations only between friends

## 5. API Design

### REST Endpoints

#### Authentication
```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login user
POST   /api/auth/refresh      - Refresh access token
POST   /api/auth/logout       - Logout user
```

#### Conversations
```
GET    /api/conversations              - List user's conversations
POST   /api/conversations/direct       - Create/get direct conversation
GET    /api/conversations/:id/messages - Get conversation messages
POST   /api/conversations/:id/messages/image - Upload image message
```

#### Messages
```
PATCH  /api/messages/:messageId/recall     - Recall own message
POST   /api/messages/:messageId/reactions - Add/remove reaction
```

#### Friends
```
GET    /api/friends              - List friends
GET    /api/friends/requests     - List friend requests
POST   /api/friends/requests     - Send friend request
PATCH  /api/friends/requests/:id - Accept/reject request
DELETE /api/friends/:friendId    - Remove friend
```

### Socket.io Events

#### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ conversationId, content, replyToId? }` | Send text message |
| `message:recall` | `{ messageId }` | Recall own message |
| `message:react` | `{ messageId, emoji }` | Toggle reaction |
| `message:typing_start` | `{ conversationId }` | User started typing |
| `message:typing_stop` | `{ conversationId }` | User stopped typing |
| `message:read` | `{ messageId, conversationId }` | Mark as read |
| `conversation:join` | `{ conversationId }` | Join conversation room |
| `conversation:leave` | `{ conversationId }` | Leave conversation room |

#### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `MessageResponse` | New message received |
| `message:recall` | `{ messageId, conversationId }` | Message was recalled |
| `message:react` | `{ messageId, conversationId, reactions }` | Reactions updated |
| `user:typing` | `{ userId, username, isTyping }` | Typing indicator |
| `conversation:update` | `ConversationResponse` | Conversation updated |

## 6. State Management

### Auth Store (Zustand)
```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  // Actions
  login, logout, register, refreshToken, fetchUser
}
```

### Chat Store (Zustand)
```typescript
interface ChatState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Record<string, Message[]>
  replyingTo: Message | null           // For reply feature
  // Actions
  fetchConversations, setActiveConversation,
  sendMessage, sendImageMessage,        // New
  recallMessage, reactToMessage,        // New
  setReplyingTo,                        // For reply feature
  updateMessage, updateMessageReactions // For realtime updates
}
```

## 7. Real-time Architecture

### Socket Connection Lifecycle

```
┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │
└────┬─────┘                    └────┬─────┘
     │                                 │
     │──── JWT Auth Handshake ────────►│
     │◄─── Connection Established ─────│
     │                                 │
     │──── conversation:join ─────────►│
     │◄─── (no explicit ack) ──────────│
     │     Room: conversation:{id}     │
     │                                 │
     │──── message:send ──────────────►│
     │◄─── { success, message } ───────│
     │──── Broadcast to room ─────────►│
     │◄─── message:new ────────────────│
     │                                 │
```

### Room Management
- `conversation:{id}` - All members receive messages
- `user:{userId}` - Private notifications

## 8. Security Considerations

### Authentication
- JWT access tokens (short-lived)
- Refresh tokens (long-lived, stored in HTTPOnly cookie)
- Token validation on every socket connection

### Authorization
- Conversation membership checked before message operations
- Only sender can recall their own messages
- Friends-only direct conversations

### Input Validation
- Zod schemas for all REST endpoints
- Multer file type/size validation
- Content sanitization before storage

### Rate Limiting (future)
- Socket event throttling
- Message send rate limiting

## 9. Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Server
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

## 10. Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Cloudinary account (free tier)

### Setup
```bash
# Backend
cd backend
npm install
npx prisma migrate dev --name init
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Database Migration
After schema changes:
```bash
cd backend
npx prisma migrate dev --name <migration_name>
npx prisma generate
```
