# Giải thích chi tiết API Đăng nhập, Đăng ký, Đăng xuất

Hệ thống authentication hoàn chỉnh với kiến trúc 3 lớp (3-layer architecture).

---

## Mục lục

1. [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
2. [Prisma Schema](#-prisma-schema)
3. [JWT Utils](#-jwt-utils)
4. [Auth Service](#-auth-service)
5. [Auth Controller](#-auth-controller)
6. [Auth Middleware](#-auth-middleware)
7. [Error Handling](#-error-handling)
8. [Cấu hình Database](#-cấu-hình-database)
9. [App & Entry](#-app--entry)
10. [Luồng hoạt động](#-luồng-hoạt-động-đầy-đủ)
11. [JWT Flow Diagram](#-jwt-flow-diagram)
12. [Bảo mật](#-bảo-mật-đã-áp-dụng)

---

## 📁 Cấu trúc thư mục

```
backend/src/
├── config/
│   └── database.ts        # Kết nối Prisma Client với PostgreSQL adapter
├── controllers/
│   └── auth.controller.ts # Xử lý request/response
├── middlewares/
│   ├── auth.middleware.ts # Xác thực JWT (authenticate + optionalAuth)
│   └── errorHandler.ts    # Xử lý lỗi toàn cục + asyncHandler
├── routes/
│   ├── auth.routes.ts     # Định nghĩa route auth
│   └── index.ts           # Router tổng hợp
├── services/
│   └── auth.service.ts    # Business logic (Class-based)
├── types/
│   └── index.ts           # TypeScript types & Enums
├── utils/
│   └── jwt.ts             # Hàm JWT helper
├── app.ts                 # Express app cấu hình middleware
└── index.ts               # Entry point khởi động server
```

---

## 🗄️ Prisma Schema

```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  passwordHash String   // Băm bcrypt (không phải password thường)
  username    String
  avatarUrl   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Đặc điểm:**
- Sử dụng UUID làm primary key
- Email là `@unique` (không cho phép trùng)
- Mật khẩu được lưu đã băm bằng bcrypt với trường `passwordHash` (không bao giờ lưu plain text)

---

## 🔐 JWT Utils (`src/utils/jwt.ts`)

```typescript
export interface TokenPayload {
  userId: string;
  email: string;
}

export interface Tokens {
  accessToken: string;   // Hết hạn 15 phút
  refreshToken: string;  // Hết hạn 7 ngày
}

export function generateAccessToken(payload: TokenPayload): string
export function generateRefreshToken(payload: TokenPayload): string
export function generateTokens(payload: TokenPayload): Tokens
export function verifyAccessToken(token: string): TokenPayload
export function verifyRefreshToken(token: string): TokenPayload
export function decodeToken(token: string): TokenPayload | null
```

**Chi tiết:**
- **Access Token**: dùng cho mọi API call, hết hạn 15 phút (`JWT_EXPIRES_IN = '15m'`)
- **Refresh Token**: dùng để lấy Access Token mới, hết hạn 7 ngày (`JWT_REFRESH_EXPIRES_IN = '7d'`)
- `TokenPayload` chứa: `userId`, `email`
- Sử dụng 2 secret khác nhau: `JWT_SECRET` và `JWT_REFRESH_SECRET`

---

## 🏢 Auth Service (`src/services/auth.service.ts`)

Lớp business logic sử dụng **Class-based** architecture:

```typescript
export class AuthService {
  async register(email: string, password: string, username: string): Promise<AuthResponse>
  async login(email: string, password: string): Promise<AuthResponse>
  async refreshToken(refreshToken: string): Promise<Tokens>
  async getUserById(userId: string): Promise<UserResponse>
  async logout(userId: string): Promise<void>
  private formatUser(user): UserResponse
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;  // Lưu ý: avatarUrl chứ không phải avatar
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: Tokens;
}
```

**Quy trình đăng ký:**
1. Nhận `{email, password, username}`
2. Kiểm tra email đã tồn tại chưa → nếu có → `ConflictError(409)`
3. Hash password bằng bcrypt (salt rounds = 12)
4. Lưu user vào database với trường `passwordHash`
5. Tạo access token (15m) + refresh token (7d)
6. Trả về `{user, tokens}`

**Quy trình đăng nhập:**
1. Nhận `{email, password}`
2. Tìm user theo email
3. Nếu không có → `AuthenticationError(401)`
4. Compare password (bcrypt.compare) với `passwordHash` đã hash
5. Nếu sai → `AuthenticationError(401)`
6. Nếu đúng → Tạo tokens mới → Trả về

---

## 🎮 Auth Controller (`src/controllers/auth.controller.ts`)

**Validation với Zod:**

```typescript
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(2).max(50),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
```

**Validation Helper:**
```typescript
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const messages = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(messages);
    }
    return result.data;
  };
}
```

Sử dụng `asyncHandler` wrapper từ `errorHandler.ts` để catch errors tự động chuyển sang `errorHandler`.

**Các endpoints:**

| Endpoint | Method | Role | Mô tả |
|----------|--------|------|-------|
| `/api/auth/register` | POST | Public | Đăng ký tài khoản mới |
| `/api/auth/login` | POST | Public | Đăng nhập (lấy tokens) |
| `/api/auth/refresh` | POST | Public | Refresh access token |
| `/api/auth/logout` | POST | Private | Đăng xuất |
| `/api/auth/profile` | GET | Private | Lấy thông tin user hiện tại |

**Response Format:**
```typescript
{
  success: true,
  data: result,
  message: 'Registration successful' // hoặc 'Login successful', etc.
}
```

---

## 🔒 Auth Middleware (`src/middlewares/auth.middleware.ts`)

**Hàm `authenticate(req, res, next)`** – luồng xác thực:
1. Đọc Authorization header: `"Bearer <token>"`
2. Nếu không có header → `AuthenticationError(401)`
3. Nếu format sai (không phải `"Bearer token"`) → `AuthenticationError(401)`
4. Verify token bằng `jwt.verify()` với `JWT_SECRET`
5. Nếu token hợp lệ → attach payload vào `req.user = { userId, email }`
6. Nếu token sai → `AuthenticationError(401)`

**Hàm `optionalAuth(req, res, next)`** – cho phép request đi qua dù có/không token:
- Nếu có token → attach user vào request
- Nếu không có hoặc token sai → vẫn cho đi qua (không throw error)

---

## ⚠️ Error Handling (`src/middlewares/errorHandler.ts`)

**Các lớp error đã tạo:**

| Error Class | Status Code | Dùng khi |
|-------------|-------------|----------|
| `AppError` | Base class | Tất cả error ứng dụng |
| `ValidationError` | 400 | Validate input thất bại |
| `AuthenticationError` | 401 | Không có token / token sai |
| `AuthorizationError` | 403 | Không có quyền truy cập |
| `NotFoundError` | 404 | Không tìm thấy resource |
| `ConflictError` | 409 | Email/username đã tồn tại |

**Async Handler Helper:**
```typescript
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**Luồng xử lý:**
1. Error được throw từ controller/service
2. Mặc định không được catch → chạy qua errorHandler
3. Nếu là `AppError` → trả về status + message
4. Nếu là `ZodError` (validate) → trả về 400 + danh sách lỗi
5. Nếu là unknown error → trả về 500 (hidden in production)

---

## 🗄️ Cấu hình Database (`src/config/database.ts`)

Sử dụng Prisma với PostgreSQL adapter:

```typescript
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

**Đặc điểm:**
- Kết nối PostgreSQL qua connection pool (`pg Pool`)
- Sử dụng Prisma adapter pattern
- Chế độ log: development (query + error + warn) / production (error only)

---

## 🚀 App & Entry (`src/app.ts` & `src/index.ts`)

**Cấu hình middleware trong `app.ts`:**

```typescript
app.use(helmet());                           // Security headers
app.use(cors(corsOptions));                   // CORS cho frontend
app.use(express.json({ limit: '10kb' }));    // Parse JSON body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
```

**CORS Configuration:**
```typescript
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

**Health Check:**
```typescript
app.get('/health', (_req: Request, res: Response<ApiResponse>) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});
```

**Server startup trong `index.ts`:**
1. Load `.env` bằng dotenv
2. Kết nối database (Prisma.$connect)
3. Nếu thành công → Listen PORT 4000
4. Nếu lỗi → exit(1)
5. Hỗ trợ Graceful Shutdown (SIGINT, SIGTERM)

---

## 🔄 Luồng hoạt động đầy đủ

### ĐĂNG KÝ (Register)

```
Client → POST /api/auth/register
  Body: { email, password, username }

Server:
  1. Controller nhận body
  2. Validate bằng Zod
  3. Gọi AuthService.register()
     - Kiểm tra email tồn tại
     - Hash password (bcrypt) → lưu vào passwordHash
     - Tạo User trong DB
  4. Tạo access token (15m) + refresh token (7d)
  5. Trả về 201:
     {
       success: true,
       message: "Registration successful",
       data: {
         user: { id, email, username, avatarUrl, createdAt },
         tokens: { accessToken, refreshToken }
       }
     }
```

---

### ĐĂNG NHẬP (Login)

```
Client → POST /api/auth/login
  Body: { email, password }

Server:
  1. Validate input bằng Zod
  2. Gọi AuthService.login()
     - Tìm user theo email
     - Compare password (bcrypt.compare) với passwordHash
  3. Nếu đúng → Tạo tokens mới
  4. Trả về 200 + user + tokens
```

---

### LẤY PROFILE (Private Route)

```
Client → GET /api/auth/profile
  Headers: Authorization: Bearer <accessToken>

Server:
  1. authenticate middleware chạy đầu tiên
     - Đọc token từ header
     - Verify token
     - Attach req.user = { userId, email }
  2. Controller nhận req.user
  3. Gọi AuthService.getUserById(req.user.userId)
  4. Trả về thông tin user
```

---

### REFRESH TOKEN

```
Client → POST /api/auth/refresh
  Body: { refreshToken }

Server:
  1. Validate refreshToken bằng Zod
  2. Gọi AuthService.refreshToken()
     - Verify refresh token với JWT_REFRESH_SECRET
     - Tìm user trong DB
     - Tạo access token mới + refresh token mới
  3. Trả về tokens mới
```

---

### ĐĂNG XUẤT (Logout)

```
Client → POST /api/auth/logout
  Headers: Authorization: Bearer <token>

Server:
  1. authenticate middleware
  2. Controller gọi AuthService.logout()
     - (Stateless: chỉ log)
  3. Trả về 200 { success: true, message: "Logout successful" }

→ Client cần xóa token khỏi localStorage/cookie
```

---

## 🔑 JWT Flow Diagram

```
┌─────────────┐                                  ┌──────────────┐
│   Frontend  │                                  │   Backend    │
└──────┬──────┘                                  └──────┬───────┘
       │                                                 │
       │ POST /api/auth/register                        │
       │ {email, password, username}                    │
       ├────────────────────────────────────────────────>│
       │                                                 │
       │            Hash password (bcrypt)              │
       │            Save to DB (passwordHash)           │
       │            Generate:                            │
       │            - accessToken (15m)                  │
       │            - refreshToken (7d)                  │
       │                                                 │
       │ 201 { user, tokens }                           │
       │<────────────────────────────────────────────────┤
       │                                                 │
       │ Lưu accessToken vào localStorage               │
       │ Lưu refreshToken vào localStorage             │
       │                                                 │
       ├────────────────────────────────────────────────>│ GET /api/auth/profile
       │                                                 │ Headers: Bearer <accessToken>
       │                                                 │
       │            Verify token                         │
       │            req.user = { userId, email }         │
       │            Get user from DB                     │
       │                                                 │
       │ 200 { user }                                   │
       │<────────────────────────────────────────────────┤
       │                                                 │
       │ Access token hết hạn (15m)                     │
       │                                                 │
       ├────────────────────────────────────────────────>│ POST /api/auth/refresh
       │                                                 │ { refreshToken }
       │                                                 │
       │            Verify refresh token                 │
       │            Generate NEW tokens                  │
       │                                                 │
       │ 200 { accessToken, refreshToken }              │
       │<────────────────────────────────────────────────┤
       │                                                 │
       │ Cập nhật tokens mới                            │
       │                                                 │
       ├────────────────────────────────────────────────>│ POST /api/auth/logout
       │                                                 │ Headers: Bearer <token>
       │                                                 │
       │            200 { message: "Logout successful" } │
       │<────────────────────────────────────────────────┤
```

---

## 🛡️ Bảo mật đã áp dụng

- **Password hashing**: bcrypt với salt rounds = 12, lưu vào trường `passwordHash`
- **JWT**: 2 loại token (access + refresh) với secret khác nhau
  - Access Token: 15 phút
  - Refresh Token: 7 ngày
- **Helmet.js**: Security headers (XSS, CSRF protection hints)
- **CORS**: Chỉ cho phép origin cụ thể (localhost:5173), credentials enabled
- **Input validation**: Zod schema cho mọi endpoint
- **Body size limit**: 10kb limit cho JSON và URL-encoded bodies
- **SQL Injection**: Đã phòng ngừa qua Prisma ORM
- **Graceful Shutdown**: Xử lý SIGINT/SIGTERM để đóng kết nối database an toàn

---

## 📝 Cách chạy hệ thống

```bash
cd backend
npm install

# Generate Prisma Client
npx prisma generate

# Chạy migration để tạo bảng users
npx prisma migrate dev --name init

# Hoặc chạy tất cả với Docker
docker-compose up -d

# Chạy dev server
npm run dev
```

API sẽ chạy tại: **http://localhost:4000**

---

## 📚 Các Types quan trọng (`src/types/index.ts`)

```typescript
// Auth Types
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface RegisterDto {
  email: string;
  password: string;
  username: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// User Types
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface UserDetailResponse extends UserResponse {
  phone: string | null;
  dateOfBirth: Date | null;
  bio: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// HTTP Status
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;
```
