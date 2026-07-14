# Hướng Dẫn Deploy Nextalk Lên Production (Render & Vercel)

Tài liệu này hướng dẫn chi tiết từng bước để deploy ứng dụng **Nextalk** lên môi trường Production sử dụng **Render** (cho Backend và Database PostgreSQL) và **Vercel** (cho Frontend React + Vite).

---

## 1. Phân Tích Công Nghệ & Ràng Buộc Hệ Thống

Trước khi thực hiện deploy, cần hiểu rõ cấu trúc của Nextalk để cấu hình chính xác:

### Backend (Node.js + Express 5 + Socket.io + Prisma)
*   **Database**: Sử dụng PostgreSQL. Trong production, Prisma client sẽ sử dụng driver adapter `@prisma/adapter-pg` cùng với thư viện `pg` (Pool) để quản lý kết nối hiệu quả.
*   **TypeScript**: Code backend sẽ được biên dịch bằng lệnh `npm run build` (`tsc`). Output sẽ được đặt trong thư mục `backend/dist/src/index.js` (không phải `dist/index.js` do cấu hình `rootDir: "."` và bao gồm cả thư mục `generated`).
*   **WebSockets**: Socket.io chạy trực tiếp trên HTTP server. Điều này yêu cầu nền tảng hosting backend phải hỗ trợ giao thức WebSockets (Render Web Services hỗ trợ hoàn toàn giao thức này).
*   **Authentication & Cookies**: 
    *   Hệ thống sử dụng cơ chế JWT song song (Access Token & Refresh Token) được lưu trữ qua cookie trình duyệt hoặc LocalStorage.
    *   Trong production (`NODE_ENV=production`), cookie được thiết lập với thuộc tính `secure: true` và `sameSite: "none"` để hỗ trợ truyền cookie qua các tên miền khác nhau (cross-origin giữa Vercel và Render).
    *   Yêu cầu bắt buộc: CORS trên backend phải chỉ định chính xác domain frontend (không được dùng `*`), và kích hoạt `credentials: true`.

### Frontend (React 19 + Vite + TailwindCSS 4)
*   **Routing**: Sử dụng React Router v7 (Single Page Application - SPA). Khi deploy lên static hosting như Vercel, cần cấu hình chuyển hướng (rewrites) toàn bộ các request về `index.html` để tránh lỗi 404 khi tải lại trang ở các route con (đã cấu hình sẵn trong `vercel.json`).
*   **Peer Dependencies**: Vì React 19 mới ra mắt, một số thư viện có thể cảnh báo xung đột peer dependencies. Lệnh install cần có thêm cờ `--legacy-peer-deps` (đã cấu hình sẵn trong `vercel.json`).

---

## 2. Bước 1: Khởi Tạo Database PostgreSQL Trên Render

Do Backend của chúng ta chạy migrations và truy vấn dữ liệu từ PostgreSQL, bước đầu tiên là tạo một cơ sở dữ liệu.

1.  Truy cập vào [Render Dashboard](https://dashboard.render.com/) và đăng nhập.
2.  Click vào nút **New** (màu tím) -> chọn **PostgreSQL**.
3.  Điền các thông tin cấu hình:
    *   **Name**: `nextalk-db`
    *   **Database Name**: `nextalk`
    *   **User**: `postgres` (hoặc để mặc định)
    *   **Region**: Chọn region gần người dùng nhất (ví dụ: `Singapore` nếu ở Việt Nam).
    *   **Instance Type**: Chọn `Free` (hoặc nâng cấp tùy nhu cầu).
4.  Click **Create Database**.
5.  Sau khi database được khởi tạo thành công, hãy lưu ý hai thông tin cực kỳ quan trọng ở mục **Connections**:
    *   **Internal Database URL**: Dùng để kết nối nội bộ giữa các service chạy trên Render (Nhanh hơn, bảo mật hơn và **không tốn phí băng thông**). Định dạng: `postgres://...`
    *   **External Database URL**: Dùng để kết nối từ bên ngoài (ví dụ: từ máy local của bạn để debug hoặc chạy migration thủ công).

---

## 3. Bước 2: Deploy Backend Lên Render (Web Service)

Chúng ta sẽ deploy Express API và Socket.io Server dưới dạng một **Web Service** trên Render.

1.  Tại Render Dashboard, click **New** -> **Web Service**.
2.  Kết nối với Git Repository của dự án Nextalk.
3.  Cấu hình chi tiết cho Web Service:
    *   **Name**: `nextalk-backend`
    *   **Region**: Chọn **cùng một Region** với Database đã tạo ở Bước 1 (ví dụ: `Singapore`) để tối ưu hóa tốc độ kết nối database nội bộ.
    *   **Branch**: `main` (hoặc branch bạn muốn deploy).
    *   **Root Directory**: `backend` *(Cực kỳ quan trọng: Dự án của chúng ta là dạng monorepo, thiết lập này giúp Render chạy các lệnh cài đặt và build trực tiếp trong thư mục `backend`)*.
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install --include=dev && npx prisma generate && npm run build` *(Sử dụng cờ `--include=dev` để cài đặt đầy đủ các thư viện devDependencies cần thiết cho quá trình biên dịch TypeScript khi biến môi trường `NODE_ENV` được đặt là `production`)*.
    *   **Start Command**: `npm start` *(Lệnh này sẽ tự động chạy `prisma migrate deploy` để cập nhật database schema trước khi khởi động Node server từ `dist/src/index.js`)*.
    *   **Instance Type**: Chọn `Free` (hoặc nâng cấp).
4.  Mở rộng phần **Advanced** và thêm các biến môi trường (**Environment Variables**):

| Tên Biến | Giá trị đề xuất | Ý nghĩa |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Kích hoạt tối ưu hóa production và bảo mật cookie (`secure: true`, `sameSite: 'none'`). |
| `DATABASE_URL` | *Dán **Internal Database URL** lấy từ Bước 1* | Kết nối tốc độ cao nội bộ đến PostgreSQL. |
| `JWT_SECRET` | *Một chuỗi ký tự ngẫu nhiên dài (tối thiểu 32 ký tự)* | Dùng để ký và xác thực Access Token. |
| `JWT_REFRESH_SECRET`| *Một chuỗi ký tự ngẫu nhiên khác (tối thiểu 32 ký tự)* | Dùng để ký và xác thực Refresh Token. |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` | **Tạm thời điền tạm một giá trị** (ví dụ: `http://localhost:5173`). Chúng ta sẽ cập nhật lại địa chỉ chính xác sau khi hoàn thành deploy Frontend trên Vercel. |
| `CLOUDINARY_CLOUD_NAME` | *Cloud Name của bạn* | Lưu trữ ảnh upload từ chat / avatar. |
| `CLOUDINARY_API_KEY` | *API Key từ Cloudinary* | Xác thực tải ảnh. |
| `CLOUDINARY_API_SECRET`| *API Secret từ Cloudinary* | Xác thực bảo mật tải ảnh. |

5.  Click **Create Web Service**.
6.  Đợi Render tiến hành build và deploy. Khi trạng thái chuyển sang **Live**, hãy copy lại URL của backend (ví dụ: `https://nextalk-backend.onrender.com`).

---

## 4. Bước 3: Deploy Frontend Lên Vercel

Frontend được phát triển bằng React + Vite, phù hợp nhất khi deploy lên Vercel.

1.  Truy cập vào [Vercel Dashboard](https://vercel.com/) và đăng nhập.
2.  Click **Add New** -> **Project** và chọn Git Repository của dự án.
3.  Cấu hình Project:
    *   **Project Name**: `nextalk-frontend` (hoặc tên bất kỳ).
    *   **Framework Preset**: Chọn `Vite` (Vercel thường sẽ tự động nhận diện).
    *   **Root Directory**: Click *Edit* và chọn thư mục `frontend` *(Rất quan trọng để Vercel build đúng vị trí)*.
    *   **Build and Development Settings**: Giữ nguyên mặc định. Vercel sẽ tự động đọc cấu hình build từ file [vercel.json](file:///d:/DevTools/projects/nextalk/frontend/vercel.json) đã được cấu hình sẵn trong mã nguồn. Cấu hình này giúp:
        *   Cài đặt dependency bằng lệnh: `npm install --legacy-peer-deps` để tránh lỗi React 19.
        *   Tự động điều hướng (rewrites) toàn bộ các trang về `index.html` nhằm hỗ trợ React Router SPA.
4.  Mở rộng phần **Environment Variables** và cấu hình các biến môi trường sau:

| Tên Biến | Giá trị | Lưu ý |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://nextalk-backend.onrender.com` | URL của backend trên Render (không chứa dấu `/` ở cuối và không có `/api`). |
| `VITE_SOCKET_URL` | `https://nextalk-backend.onrender.com` | URL Socket server (trùng với URL backend trên Render). |

5.  Click **Deploy**.
6.  Quá trình deploy sẽ diễn ra trong vòng 1-2 phút. Sau khi hoàn thành, bạn sẽ nhận được địa chỉ URL chính thức của Frontend (ví dụ: `https://nextalk-frontend.vercel.app`).

---

## 5. Bước 4: Cập Nhật CORS Trên Backend (Bắt Buộc)

Để hệ thống đăng nhập, đồng bộ cookie và kết nối WebSocket hoạt động bình thường, chúng ta cần liên kết ngược địa chỉ Frontend vào cấu hình CORS của Backend.

1.  Quay lại **Render Dashboard** -> Chọn Web Service `nextalk-backend`.
2.  Vào mục **Environment** ở menu bên trái.
3.  Tìm biến `CORS_ORIGIN` và sửa giá trị của nó thành URL chính thức của Frontend trên Vercel (ví dụ: `https://nextalk-frontend.vercel.app`).
    *   *Mẹo*: Nếu bạn sử dụng custom domain hoặc chạy thử nghiệm ở nhiều trang web, bạn có thể nhập danh sách ngăn cách bởi dấu phẩy, ví dụ: `https://nextalk-frontend.vercel.app,https://nextalk.com`.
4.  Click **Save Changes**.
5.  Render sẽ tự động trigger một đợt deploy mới để cập nhật biến môi trường này. Sau khi deploy hoàn tất, ứng dụng đã sẵn sàng hoạt động ổn định trên môi trường Production!

---

## 6. Các Lưu Ý Quan Trọng Khi Chạy Production

*   **Render Free Tier (Thời gian khởi động nguội)**:
    Nếu bạn sử dụng gói Free của Render cho Backend, service sẽ tự động "ngủ" (spin down) sau 15 phút liên tục không có request. Khi người dùng truy cập lại lần đầu tiên:
    *   Backend sẽ mất khoảng **50 - 90 giây** để khởi động lại (cold start). Trong thời gian này, các kết nối API đầu tiên từ Frontend sẽ bị chậm hoặc tạm thời báo lỗi chờ.
    *   Socket.io client trên Frontend đã được cấu hình cơ chế tự động kết nối lại (`autoConnect: true` và reconnect handler), do đó khi backend hoạt động trở lại, kết nối real-time sẽ tự động phục hồi mà không cần tải lại trang.

*   **Giới Hạn Kết Nối PostgreSQL trên Render Free**:
    Cơ sở dữ liệu PostgreSQL gói Free trên Render giới hạn tối đa **97 kết nối đồng thời**. Do backend Nextalk sử dụng Connection Pool thông qua thư viện `pg` (được cấu hình mặc định trong [database.ts](file:///d:/DevTools/projects/nextalk/backend/src/config/database.ts)), bạn nên lưu ý không tăng số lượng kết nối tối đa của pool quá cao nếu scale ứng dụng lên nhiều instance để tránh cạn kiệt connection pool của DB.

*   **Vấn Đề Đăng Nhập Trên Trình Duyệt Safari / iOS**:
    Trình duyệt Safari và iOS có cơ chế bảo mật cookie bên thứ ba (ITP - Intelligent Tracking Prevention) rất nghiêm ngặt. Khi Frontend chạy trên `vercel.app` và Backend chạy trên `onrender.com`, Safari có thể chặn Cookie được gửi từ Backend.
    *   **Giải pháp tốt nhất**: Trỏ một Custom Domain của bạn cho cả Frontend và Backend dưới dạng subdomain (ví dụ: frontend chạy trên `chat.domain.com` và backend chạy trên `api.domain.com`). Khi đó trình duyệt sẽ coi đây là First-party cookie và chấp nhận hoàn toàn.
