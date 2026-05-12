import { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { chatService } from "../services/chat.service";
import {
  ClientToServerEvents,
  ConversationResponse,
  ServerToClientEvents,
} from "../types";
import { verifyAccessToken } from "../utils/jwt";

type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  userId?: string;
};

let ioInstance: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents
> | null = null;

export function initSocket(httpServer: Server) {
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin) throw new Error('CORS_ORIGIN environment variable is required');

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: corsOrigin,
        credentials: true,
      },
    },
  );
  ioInstance = io;

  io.use((socket: ChatSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        extractCookieToken(socket.handshake.headers.cookie);

      if (!token || typeof token !== "string") {
        return next(new Error("Authentication required"));
      }

      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", async (socket: ChatSocket) => {
    socket.join(getUserRoom(socket.userId!));

    try {
      const conversations = await chatService.getConversations(socket.userId!);
      conversations.forEach((conversation) => {
        socket.join(getConversationRoom(conversation.id));
      });
    } catch (error) {
      socket.emit("error", { message: getErrorMessage(error) });
    }

    socket.on("conversation:join", async ({ conversationId }) => {
      try {
        await chatService.getConversationForMember(
          conversationId,
          socket.userId!,
        );
        socket.join(getConversationRoom(conversationId));
      } catch (error) {
        socket.emit("error", { message: getErrorMessage(error) });
      }
    });

    socket.on("conversation:leave", ({ conversationId }) => {
      socket.leave(getConversationRoom(conversationId));
    });

    socket.on("message:send", async (data, callback) => {
      try {
        const message = await chatService.sendMessage(
          data.conversationId,
          socket.userId!,
          data.content,
          data.replyToId,
        );
        const conversation = await chatService.getConversationForMember(
          data.conversationId,
          socket.userId!,
        );
        const room = getConversationRoom(data.conversationId);
        socket.join(room);
        emitToConversationMembers(io, conversation, "message:new", message);
        emitToConversationMembers(
          io,
          conversation,
          "conversation:update",
          conversation,
        );
        callback?.({ success: true, message });
      } catch (error) {
        callback?.({ success: false, error: getErrorMessage(error) });
      }
    });

    socket.on("message:recall", async ({ messageId }, callback) => {
      try {
        const message = await chatService.recallMessage(
          messageId,
          socket.userId!,
        );
        const room = getConversationRoom(message.conversationId);
        io.to(room).emit("message:recall", {
          messageId,
          conversationId: message.conversationId,
        });
        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, error: getErrorMessage(error) });
      }
    });

    socket.on("message:react", async ({ messageId, emoji }, callback) => {
      try {
        const { conversationId, reactions } = await chatService.reactMessage(
          messageId,
          socket.userId!,
          emoji,
        );
        const room = getConversationRoom(conversationId);
        io.to(room).emit("message:react", {
          messageId,
          conversationId,
          reactions,
        });
        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, error: getErrorMessage(error) });
      }
    });
  });

  return io;
}

export function getSocketServer() {
  return ioInstance;
}

export function getConversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

export function getUserRoom(userId: string): string {
  return `user:${userId}`;
}

export function getConversationTargetRooms(
  conversation: ConversationResponse,
): string[] {
  const room = getConversationRoom(conversation.id);
  const memberRooms =
    conversation.members?.map((member) => getUserRoom(member.userId)) ?? [];

  return [room, ...memberRooms];
}

export function emitToConversationMembers<
  Event extends keyof ServerToClientEvents,
>(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
  conversation: ConversationResponse,
  event: Event,
  ...args: Parameters<ServerToClientEvents[Event]>
): void {
  io.to(getConversationTargetRooms(conversation)).emit(event, ...args);
}

function extractCookieToken(cookieHeader?: string): string | undefined {
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader
    .split(";")
    .reduce<Record<string, string>>((acc, cookie) => {
      const [rawName, ...rawValue] = cookie.trim().split("=");
      if (rawName) {
        acc[rawName] = decodeURIComponent(rawValue.join("="));
      }
      return acc;
    }, {});

  return cookies.accessToken;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
