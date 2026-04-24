import { io, Socket } from 'socket.io-client'
import { getCookie } from '@/lib/cookie'
import { isTokenExpired } from '@/lib/token'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

class SocketClient {
  private static instance: SocketClient
  private socket: Socket | null = null

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient()
    }
    return SocketClient.instance
  }

  public connect(): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    const token = getCookie('accessToken')

    // If token is expired, don't connect
    if (!token || isTokenExpired(token)) {
      console.warn('Socket connection skipped: no valid token')
      return this.socket!
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true // Important: send cookies with WebSocket connection
    })

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
    })

    return this.socket
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  public getSocket(): Socket | null {
    return this.socket
  }

  public emit(event: string, data?: unknown): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected. Cannot emit event:', event)
      return
    }
    this.socket.emit(event, data)
  }

  public on(event: string, callback: (...args: unknown[]) => void): void {
    this.socket?.on(event, callback)
  }

  public off(event: string, callback?: (...args: unknown[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback)
    } else {
      this.socket?.off(event)
    }
  }
}

export const socketClient = SocketClient.getInstance()
export default socketClient
