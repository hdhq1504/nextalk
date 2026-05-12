// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MESSAGE_PAGE_SIZE = 50;
export const UNREAD_CONVERSATION_COUNT = 1;

// Rate Limiting
export const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const AUTH_RATE_MAX_ATTEMPTS = 10;
export const SEARCH_RATE_WINDOW_MS = 60 * 1000; // 1 minute
export const SEARCH_RATE_MAX_REQUESTS = 30;
export const REFRESH_RATE_WINDOW_MS = 60 * 1000; // 1 minute
export const REFRESH_RATE_MAX_REQUESTS = 20;

// Socket
export const SOCKET_TIMEOUT_MS = 10000; // 10 seconds
