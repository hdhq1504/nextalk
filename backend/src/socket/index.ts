import { Server } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { chatService } from '../services/chat.service'
import { ClientToServerEvents, ServerToClientEvents } from '../types'
import { verifyAccessToken } from '../utils/jwt'

type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  userId?: string
}

export function initSocket(httpServer: Server) {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
      },
    }
  )

  io.use((socket: ChatSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        extractCookieToken(socket.handshake.headers.cookie)

      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication required'))
      }

      const payload = verifyAccessToken(token)
      socket.userId = payload.userId
      next()
    } catch {
      next(new Error('Invalid authentication token'))
    }
  })

  io.on('connection', async (socket: ChatSocket) => {
    socket.join(getUserRoom(socket.userId!))

    try {
      const conversations = await chatService.getConversations(socket.userId!)
      conversations.forEach((conversation) => {
        socket.join(getConversationRoom(conversation.id))
      })
    } catch (error) {
      socket.emit('error', { message: getErrorMessage(error) })
    }

    socket.on('conversation:join', async ({ conversationId }) => {
      try {
        await chatService.getConversationForMember(conversationId, socket.userId!)
        socket.join(getConversationRoom(conversationId))
      } catch (error) {
        socket.emit('error', { message: getErrorMessage(error) })
      }
    })

    socket.on('conversation:leave', ({ conversationId }) => {
      socket.leave(getConversationRoom(conversationId))
    })

    socket.on('message:send', async (data, callback) => {
      try {
        const message = await chatService.sendMessage(
          data.conversationId,
          socket.userId!,
          data.content
        )
        const conversation = await chatService.getConversationForMember(
          data.conversationId,
          socket.userId!
        )
        const room = getConversationRoom(data.conversationId)
        const memberRooms =
          conversation.members?.map((member) => getUserRoom(member.userId)) ?? []

        socket.join(room)
        io.to([room, ...memberRooms]).emit('message:new', message)
        io.to([room, ...memberRooms]).emit('conversation:update', conversation)
        callback?.({ success: true, message })
      } catch (error) {
        callback?.({ success: false, error: getErrorMessage(error) })
      }
    })
  })

  return io
}

function getConversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`
}

function getUserRoom(userId: string): string {
  return `user:${userId}`
}

function extractCookieToken(cookieHeader?: string): string | undefined {
  if (!cookieHeader) return undefined

  const cookies = cookieHeader.split(';').reduce<Record<string, string>>(
    (acc, cookie) => {
      const [rawName, ...rawValue] = cookie.trim().split('=')
      if (rawName) {
        acc[rawName] = decodeURIComponent(rawValue.join('='))
      }
      return acc
    },
    {}
  )

  return cookies.accessToken
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong'
}
