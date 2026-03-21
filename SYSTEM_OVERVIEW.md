# HỆ THỐNG QUẢN LÝ CÔNG VIỆC — CG SOFTWARE TASK MANAGER

## 1. BÀI TOÁN

### 1.1. Vấn đề thực tế

Trong môi trường làm việc nhóm, việc quản lý công việc thủ công (qua email, Excel, nhắn tin) dẫn đến:
- Không theo dõi được tiến độ task
- Không biết ai đang làm gì, task nào quá hạn
- Thiếu hệ thống phân quyền rõ ràng
- Không có lịch sử hoạt động để audit

### 1.2. Giải pháp

Xây dựng hệ thống **Task Management System** (tương tự Trello/Jira) cho phép:
- Quản lý dự án theo nhóm, phân quyền Owner/Member
- Theo dõi công việc qua Kanban Board (kéo thả)
- Tự động gửi email khi task quá hạn, thay đổi trạng thái
- Hỗ trợ cả **task dự án** (nhóm) và **task cá nhân** (riêng tư)

### 1.3. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| **Backend** | Django 5.2.7 + Django REST Framework |
| **Frontend** | Next.js 14 (TypeScript + React) |
| **Database** | PostgreSQL |
| **Task nền** | Celery + Redis |
| **UI** | shadcn/ui + Tailwind CSS |
| **Xác thực** | JWT (SimpleJWT) + Google OAuth2 |
| **Email** | Gmail SMTP |
| **API Docs** | Swagger UI (drf-spectacular) |

### 1.4. Kiến trúc hệ thống

```
Client (React/Next.js, port 3000)
  → Gọi API qua Axios (tự gắn JWT token, auto refresh)
  → Django REST Framework (port 8000)
  → Xử lý logic (views.py) + Phân quyền (permissions.py)
  → Validate dữ liệu (serializers.py)
  → Truy vấn PostgreSQL (models.py)
  → Trả về JSON
  → Frontend render UI (components/)
```

---

## 2. DATABASE (Cơ sở dữ liệu)

### 2.1. Sơ đồ tổng quan — 9 bảng

```
┌─────────────────────────────────────────────────────────────┐
│                     USER (AbstractUser)                      │
│  id | username | email | password | is_staff | is_active     │
└──┬──────┬──────────┬──────────┬──────────┬──────────────────┘
   │      │          │          │          │
   │   owns(1-N)     │      creates    assigned
   │      │          │          │          │
   │  ┌───▼──────────▼────┐  ┌─▼──────────▼───┐
   │  │      PROJECT       │  │      TASK       │
   │  │  id                │←─│  id              │
   │  │  name              │  │  title           │
   │  │  description       │  │  description     │
   │  │  owner (FK→User)   │  │  status (TODO/   │
   │  │  created_at        │  │    INPR/DONE)    │
   │  │  updated_at        │  │  priority (LOW/  │
   │  └───────┬────────────┘  │    MED/HIGH)     │
   │          │               │  start_date      │
   │          │               │  due_date        │
   │   ┌──────▼──────────┐   │  project (FK)    │
   │   │ PROJECT_MEMBERS  │   │  is_personal     │
   │   │ (Bảng trung gian)│   │  created_by (FK) │
   └──►│  id              │   │  assignee (FK)   │
       │  project_id (FK) │   └──┬───┬───┬───────┘
       │  user_id (FK)    │      │   │   │
       └─────────────────┘      │   │   │
                                │   │   │
     ┌──────────────┐    ┌──────▼┐ ┌▼───▼────────┐  ┌───────────────┐
     │ ACTIVITY_LOG │    │COMMENT│ │ ATTACHMENT   │  │ NOTIFICATION  │
     │ id           │    │id     │ │ id           │  │ id            │
     │ action_desc  │    │body   │ │ file         │  │ title         │
     │ actor (FK)   │    │author │ │ description  │  │ message       │
     │ project (FK) │    │task   │ │ uploader(FK) │  │ recipient(FK) │
     │ task (FK)    │    │created│ │ task (FK)    │  │ project (FK)  │
     │ timestamp    │    │updated│ │ uploaded_at  │  │ task (FK)     │
     └──────────────┘    └───────┘ └─────────────┘  │ is_read       │
                                                     │ created_at    │
                  ┌──────────────────────┐           └───────────────┘
                  │ PASSWORD_RESET_TOKEN │
                  │ id                   │
                  │ user (FK→User)       │
                  │ token (unique)       │
                  │ created_at           │
                  │ expires_at           │
                  │ is_used              │
                  └──────────────────────┘
```

### 2.2. Chi tiết từng bảng

#### Bảng 1: USER (Kế thừa Django AbstractUser)

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | Integer | PK, Auto Increment | Khóa chính |
| `username` | VARCHAR(150) | UNIQUE, NOT NULL | Tên đăng nhập |
| `password` | VARCHAR(128) | NOT NULL | Mật khẩu (đã hash) |
| `email` | VARCHAR(254) | NOT NULL | Email |
| `first_name` | VARCHAR(150) | | Họ |
| `last_name` | VARCHAR(150) | | Tên |
| `is_staff` | Boolean | DEFAULT False | Là admin? |
| `is_active` | Boolean | DEFAULT True | Tài khoản hoạt động? |
| `date_joined` | DateTime | Auto | Ngày tạo tài khoản |

#### Bảng 2: PROJECT (Dự án)

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | Integer | PK, Auto Increment | Khóa chính |
| `name` | VARCHAR(255) | NOT NULL | Tên dự án |
| `description` | TEXT | NULL cho phép | Mô tả dự án |
| `owner_id` | Integer | FK → User, ON DELETE CASCADE | Chủ dự án |
| `created_at` | DateTime | Auto (khi tạo) | Ngày tạo |
| `updated_at` | DateTime | Auto (khi sửa) | Ngày cập nhật |

#### Bảng 3: PROJECT_MEMBERS (Bảng trung gian — Django tự sinh từ ManyToManyField)

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | Integer | PK, Auto Increment | Khóa chính |
| `project_id` | Integer | FK → Project, ON DELETE CASCADE | Dự án |
| `user_id` | Integer | FK → User, ON DELETE CASCADE | Thành viên |

> **UNIQUE(project_id, user_id)** — Mỗi user chỉ được thêm vào 1 project 1 lần.

#### Bảng 4: TASK (Công việc)

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | Integer | PK, Auto Increment | Khóa chính |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề |
| `description` | TEXT | NULL cho phép | Mô tả chi tiết |
| `status` | VARCHAR(4) | DEFAULT 'TODO' | Trạng thái: `TODO` / `INPR` / `DONE` |
| `priority` | VARCHAR(4) | DEFAULT 'MED' | Ưu tiên: `LOW` / `MED` / `HIGH` |
| `start_date` | DateTime | NULL cho phép | Ngày bắt đầu |
| `due_date` | DateTime | NULL cho phép | Ngày hết hạn |
| `project_id` | Integer | FK → Project, **NULL cho phép**, ON DELETE CASCADE | Dự án (NULL = task cá nhân) |
| `is_personal` | Boolean | DEFAULT False | Đánh dấu task cá nhân |
| `created_by_id` | Integer | FK → User, ON DELETE CASCADE | Người tạo task |
| `assignee_id` | Integer | FK → User, **NULL cho phép**, ON DELETE SET NULL | Người được giao |
| `created_at` | DateTime | Auto (khi tạo) | Ngày tạo |
| `updated_at` | DateTime | Auto (khi sửa) | Ngày cập nhật |

> **Task cá nhân:** `project_id = NULL`, `is_personal = True`  
> **Task dự án:** `project_id ≠ NULL`, `is_personal = False`

#### Bảng 5: COMMENT (Bình luận)

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | Integer | PK, Auto Increment | Khóa chính |
| `body` | TEXT | NOT NULL | Nội dung bình luận |
| `task_id` | Integer | FK → Task, ON DELETE CASCADE | Task được bình luận |
| `author_id` | Integer | FK → User, ON DELETE CASCADE | Người viết |
| `created_at` | DateTime | Auto | Ngày tạo |
| `updated_at` | DateTime | Auto | Ngày sửa |

#### Bảng 6: ATTACHMENT (Tệp đính kèm)

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | Integer | PK, Auto Increment | Khóa chính |
| `file` | FileField | NOT NULL | Đường dẫn file (upload tới `attachments/`) |
| `description` | VARCHAR(255) | NULL cho phép | Mô tả file |
| `task_id` | Integer | FK → Task, ON DELETE CASCADE | Task chứa file |
| `uploader_id` | Integer | FK → User, **ON DELETE SET NULL** | Người upload |
| `uploaded_at` | DateTime | Auto | Ngày upload |

#### Bảng 7: ACTIVITY_LOG (Nhật ký hoạt động)

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | Integer | PK, Auto Increment | Khóa chính |
| `action_description` | VARCHAR(255) | NOT NULL | Hành động (VD: "Tạo task X") |
| `actor_id` | Integer | FK → User, **ON DELETE SET NULL** | Người thực hiện |
| `project_id` | Integer | FK → Project, **ON DELETE SET NULL**, NULL cho phép | Dự án liên quan |
| `task_id` | Integer | FK → Task, **ON DELETE SET NULL**, NULL cho phép | Task liên quan |
| `timestamp` | DateTime | Auto | Thời gian |

#### Bảng 8: NOTIFICATION (Thông báo)

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | Integer | PK, Auto Increment | Khóa chính |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề thông báo |
| `message` | TEXT | NOT NULL | Nội dung |
| `recipient_id` | Integer | FK → User, ON DELETE CASCADE | Người nhận |
| `project_id` | Integer | FK → Project, NULL cho phép, ON DELETE CASCADE | Dự án liên quan |
| `task_id` | Integer | FK → Task, NULL cho phép, ON DELETE CASCADE | Task liên quan |
| `is_read` | Boolean | DEFAULT False | Đã đọc chưa |
| `created_at` | DateTime | Auto | Ngày tạo |

> **ordering = ['-created_at']** — Mới nhất hiện trước.

#### Bảng 9: PASSWORD_RESET_TOKEN (Token đặt lại mật khẩu)

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | Integer | PK, Auto Increment | Khóa chính |
| `user_id` | Integer | FK → User, ON DELETE CASCADE | User yêu cầu reset |
| `token` | VARCHAR(100) | UNIQUE, DEFAULT uuid4 | Token ngẫu nhiên |
| `created_at` | DateTime | Auto | Ngày tạo |
| `expires_at` | DateTime | NOT NULL | Hết hạn lúc (24h) |
| `is_used` | Boolean | DEFAULT False | Đã dùng chưa |

### 2.3. Quan hệ giữa các bảng

```
USER ──(1:N)──► PROJECT          (owner_id: 1 user sở hữu nhiều project)
USER ──(M:N)──► PROJECT          (qua bảng PROJECT_MEMBERS)
USER ──(1:N)──► TASK             (created_by_id: 1 user tạo nhiều task)
USER ──(1:N)──► TASK             (assignee_id: 1 user được giao nhiều task)
USER ──(1:N)──► COMMENT          (author_id)
USER ──(1:N)──► ATTACHMENT       (uploader_id)
USER ──(1:N)──► ACTIVITY_LOG     (actor_id)
USER ──(1:N)──► NOTIFICATION     (recipient_id)
USER ──(1:N)──► PASSWORD_RESET_TOKEN (user_id)

PROJECT ──(1:N)──► TASK          (project_id)
PROJECT ──(1:N)──► ACTIVITY_LOG  (project_id)
PROJECT ──(1:N)──► NOTIFICATION  (project_id)

TASK ──(1:N)──► COMMENT          (task_id)
TASK ──(1:N)──► ATTACHMENT       (task_id)
TASK ──(1:N)──► ACTIVITY_LOG     (task_id)
TASK ──(1:N)──► NOTIFICATION     (task_id)
```

**Tổng cộng: 9 bảng, 14 quan hệ khóa ngoại (FK), 1 quan hệ nhiều-nhiều (M:N).**

---

## 3. CHỨC NĂNG VÀ LUỒNG HOẠT ĐỘNG CHI TIẾT

---

### 3.1. ĐĂNG KÝ TÀI KHOẢN

**Chức năng:** Cho phép người dùng mới tạo tài khoản để sử dụng hệ thống.  
**API:** `POST /api/signup/`  
**Quyền:** Ai cũng truy cập được (AllowAny)

**Luồng hoạt động:**
```
User bấm "Đăng ký"
  │
  ▼
React Component (signup/page.tsx)
  │ gọi authService.signup(data)
  ▼
Service Layer (services/auth.ts)
  │ api.post("/signup/", {username, email, password, confirm_password, first_name, last_name})
  ▼
Axios Instance (lib/api.ts)
  │ Header: Content-Type: application/json
  │ (Không gắn JWT — chưa đăng nhập)
  ▼
HTTP POST → http://localhost:8000/api/signup/
  │
  ▼
Django URL Router (API/urls.py)
  │ path("signup/", SignupView.as_view())
  ▼
SignupView (API/views.py)
  │ permission_classes = [AllowAny]
  │ authentication_classes = []
  ▼
SignupSerializer.validate() (API/serializers.py)
  │ ├─ Check username trùng? → User.objects.filter(username=x).exists()
  │ ├─ Check email trùng? → UniqueValidator(queryset=User.objects.all())
  │ ├─ Check password >= 8 ký tự?
  │ ├─ Check password == confirm_password?
  │ └─ Check first_name, last_name không rỗng?
  │
  │ Nếu FAIL → return 400 + lỗi cụ thể
  ▼
SignupSerializer.create()
  │ User.objects.create_user(username, email, password, first_name, last_name)
  ▼
PostgreSQL
  │ INSERT INTO api_user
  │   (username, email, password, first_name, last_name, is_staff, is_active, date_joined)
  │ VALUES ('trung', 'trung@gmail.com', 'pbkdf2_sha256$...hash...', 'Trung', 'CG', False, True, now)
  │
  │ ⚠️ password được hash bằng PBKDF2-SHA256 (KHÔNG LƯU PLAINTEXT)
  ▼
Response JSON
  │ HTTP 201 Created
  │ Body: {id: 5, username: "trung", email: "trung@gmail.com", first_name: "Trung", last_name: "CG"}
  │ (KHÔNG trả password)
  ▼
Axios nhận response
  │ status === 201 → Thành công
  ▼
React Component
  │ toast("Đăng ký thành công!")
  │ router.push("/login")
  ▼
User thấy trang Login
```

---

### 3.2. ĐĂNG NHẬP (Username + Password)

**Chức năng:** Xác thực user và cấp JWT token để truy cập các API protected.  
**API:** `POST /api/login/`  
**Quyền:** AllowAny

**Luồng hoạt động:**
```
User bấm "Đăng nhập"
  │
  ▼
React Component (login/page.tsx)
  │ gọi authService.login({username, password})
  ▼
Service Layer (services/auth.ts)
  │ api.post("/login/", {username, password})
  ▼
Axios Instance (lib/api.ts)
  │ (Không gắn JWT — chưa đăng nhập)
  ▼
HTTP POST → http://localhost:8000/api/login/
  │
  ▼
Django URL Router (API/urls.py)
  │ path("login/", LoginView.as_view())
  ▼
LoginView (kế thừa TokenObtainPairView)
  │ permission_classes = [AllowAny]
  ▼
CustomTokenObtainPairSerializer.validate() (API/serializers.py)
  │
  ├─ [Bước 1] Tìm user theo username:
  │   │ SELECT * FROM api_user WHERE username = 'trung'
  │   ├─ Không thấy → Thử tìm theo email:
  │   │   SELECT * FROM api_user WHERE email = 'trung'
  │   └─ Vẫn không thấy → raise 401 "No active account found"
  │
  ├─ [Bước 2] check_password(password):
  │   │ So sánh hash(input) với password trong DB
  │   ├─ SAI → raise 401 "No active account found"
  │   └─ ĐÚNG → kiểm tra is_active
  │
  ├─ [Bước 3] Kiểm tra is_active:
  │   ├─ is_active = False → raise 400 "Tài khoản đã bị khóa"
  │   └─ is_active = True → Tiếp
  │
  └─ [Bước 4] Tạo JWT Token:
      │ CustomTokenObtainPairSerializer.get_token(user)
      │ payload = {user_id: 5, username: "trung", is_staff: false}
      │ access_token = sign(payload, SECRET_KEY, exp=30min)
      │ refresh_token = sign(payload, SECRET_KEY, exp=7days)
      ▼
Response JSON
  │ HTTP 200 OK
  │ Body: {access: "eyJhbG...", refresh: "eyJhbG...", is_staff: false}
  ▼
authService.login() xử lý response
  │ ├─ localStorage.setItem("access_token", access)   ← Cho Axios interceptor
  │ ├─ localStorage.setItem("refresh_token", refresh)  ← Cho auto-refresh
  │ └─ document.cookie = "access_token=eyJ...; max-age=604800"  ← Cho middleware.ts
  ▼
router.push("/dashboard")
  │
  ▼
Next.js Middleware (middleware.ts)
  │ Đọc cookie "access_token"
  │ Có token → NextResponse.next() (cho phép truy cập)
  ▼
User thấy Dashboard
```

---

### 3.3. ĐĂNG NHẬP GOOGLE (OAuth2)

**Chức năng:** Cho phép user đăng nhập bằng tài khoản Google, không cần tạo tài khoản thủ công.  
**API:** `POST /api/google-login/`  
**Quyền:** AllowAny

**Luồng hoạt động:**
```
User bấm "Đăng nhập bằng Google"
  │
  ▼
Google SDK (chạy trên trình duyệt)
  │ Mở popup chọn tài khoản Google
  │ User chọn account → Google xác thực
  │ Google trả id_token (JWT chứa email, name...)
  ▼
React Component nhận id_token từ Google
  │ gọi authService.googleLogin(idToken)
  ▼
Service Layer (services/auth.ts)
  │ api.post("/google-login/", {id_token: "eyJ..."})
  ▼
Axios Instance → HTTP POST
  │
  ▼
Django URL Router
  │ path("google-login/", GoogleLoginView.as_view())
  ▼
GoogleLoginView.post() (API/views.py)
  │
  ├─ [Bước 1] Verify token với Google API:
  │   │ google.oauth2.id_token.verify_oauth2_token(token, Request(), GOOGLE_CLIENT_ID)
  │   │ → Google server xác nhận: token hợp lệ, chưa hết hạn, đúng client_id
  │   ├─ KHÔNG HỢP LỆ → ValueError → 400 "Token không hợp lệ"
  │   └─ HỢP LỆ → trả idinfo = {email, given_name, family_name, email_verified}
  │
  ├─ [Bước 2] Kiểm tra email_verified:
  │   ├─ False → 400 "Email Google chưa được xác thực"
  │   └─ True → Tiếp
  │
  ├─ [Bước 3] Tìm/Tạo user trong DB:
  │   │ User.objects.get_or_create(email=email)
  │   │
  │   ├─ USER MỚI (created=True):
  │   │   │ INSERT INTO api_user:
  │   │   │   username = "trung_ab3f" (email prefix + 4 char random)
  │   │   │   email = "trung@gmail.com"
  │   │   │   first_name, last_name = từ Google
  │   │   │ user.set_unusable_password()  ← KHÔNG THỂ login bằng password
  │   │   │ user.save()
  │   │   ▼
  │   │   PostgreSQL: INSERT INTO api_user (...) VALUES (...)
  │   │
  │   └─ USER ĐÃ CÓ (created=False):
  │       │ UPDATE api_user SET first_name=..., last_name=... WHERE email=...
  │       ▼
  │       PostgreSQL: UPDATE (nếu name thay đổi)
  │
  └─ [Bước 4] Tạo JWT:
      │ RefreshToken.for_user(user)
      │ access_token + refresh_token
      ▼
Response JSON
  │ HTTP 200 OK
  │ Body: {access, refresh, user: {id, username, email, first_name, last_name}}
  ▼
authService → Lưu token (localStorage + cookie)
  ▼
router.push("/dashboard")
  ▼
User thấy Dashboard
```

---

### 3.4. ĐẶT MẬT KHẨU (cho user Google)

**Chức năng:** Cho phép user Google thêm password để đăng nhập bằng cả email+password.  
**API:** `POST /api/set-password/`  
**Quyền:** IsAuthenticated (phải đăng nhập)

**Luồng hoạt động:**
```
User Google bấm "Đặt mật khẩu"
  │
  ▼
React Component (profile/page.tsx)
  │ gọi authService.setPassword({new_password, confirm_password})
  ▼
Service Layer (services/auth.ts)
  │ api.post("/set-password/", {new_password, confirm_password})
  ▼
Axios Instance (lib/api.ts)
  │ Tự gắn: Authorization: Bearer eyJ...
  ▼
HTTP POST → http://localhost:8000/api/set-password/
  │
  ▼
Django URL Router
  │ path("set-password/", SetPasswordView.as_view())
  ▼
SetPasswordView.post() (API/views.py)
  │ permission_classes = [IsAuthenticated]
  │ → JWT decode → lấy user_id → tìm User trong DB
  │
  ├─ [Bước 1] Kiểm tra has_usable_password():
  │   ├─ True (ĐÃ CÓ password) → 400 "Tài khoản đã có mật khẩu"
  │   └─ False (Google user, chưa có) → Tiếp
  │
  ├─ [Bước 2] Validate: new_password == confirm_password?
  │   ├─ KHÔNG khớp → 400 "Mật khẩu xác nhận không khớp"
  │   └─ KHỚP → Tiếp
  │
  └─ [Bước 3] Đặt mật khẩu:
      │ user.set_password("newpass123")  ← Hash PBKDF2
      │ user.save()
      ▼
PostgreSQL
  │ UPDATE api_user SET password = 'pbkdf2_sha256$...' WHERE id = 5
  ▼
Response: HTTP 200 "Thiết lập mật khẩu thành công"
  ▼
React Component → toast("Mật khẩu đã được thiết lập")
  ▼
User giờ có thể login bằng cả Google VÀ email+password
```

---

### 3.5. QUÊN MẬT KHẨU

**Chức năng:** Cho user quên mật khẩu → nhận email link reset.  
**API:** `POST /api/forgot-password/`  
**Quyền:** AllowAny

**Luồng hoạt động:**
```
User bấm "Quên mật khẩu" → nhập email → bấm "Gửi"
  │
  ▼
React Component (forgot-password/page.tsx)
  │ gọi authService.forgotPassword(email)
  ▼
Service Layer (services/auth.ts)
  │ api.post("/forgot-password/", {email: "trung@gmail.com"})
  ▼
Axios Instance → HTTP POST (không JWT)
  │
  ▼
Django URL Router
  │ path("forgot-password/", ForgotPasswordView.as_view())
  ▼
ForgotPasswordView.post() (API/views.py)
  │ permission_classes = [AllowAny]
  │
  ├─ [Bước 1] Validate email format (ForgotPasswordSerializer)
  │
  ├─ [Bước 2] Tìm user:
  │   │ User.objects.get(email="trung@gmail.com")
  │   ├─ KHÔNG TÌM THẤY → Vẫn trả 200 (bảo mật: không lộ email nào tồn tại)
  │   └─ TÌM THẤY → Tiếp
  │
  ├─ [Bước 3] Kiểm tra Google user:
  │   ├─ has_usable_password() == False → 400 "Tài khoản đăng ký bằng Google"
  │   └─ True → Tiếp
  │
  ├─ [Bước 4] Xóa token cũ:
  │   │ PasswordResetToken.objects.filter(user=user, is_used=False).delete()
  │   ▼
  │   PostgreSQL: DELETE FROM api_passwordresettoken WHERE user_id=5 AND is_used=False
  │
  ├─ [Bước 5] Tạo token mới:
  │   │ PasswordResetToken.objects.create(user=user, expires_at=now+24h)
  │   ▼
  │   PostgreSQL: INSERT INTO api_passwordresettoken
  │     (user_id, token, created_at, expires_at, is_used)
  │     VALUES (5, "a1b2c3d4-uuid-...", now, now+24h, False)
  │
  ├─ [Bước 6] Tạo link reset:
  │   │ reset_link = "http://localhost:3000/reset-password?token=a1b2c3d4-..."
  │
  └─ [Bước 7] GỬI EMAIL:
      │ django.core.mail.send_mail()
      ▼
  Gmail SMTP Server (smtp.gmail.com:587)
      │ ├─ Kết nối TLS
      │ ├─ Xác thực: EMAIL_HOST_USER + EMAIL_HOST_PASSWORD
      │ ├─ Subject: "Đặt lại mật khẩu"
      │ ├─ Body: HTML chứa link reset
      │ └─ Gửi tới: trung@gmail.com
      ▼
Response: HTTP 200 "Email đã được gửi"
  ▼
User nhận email trong hộp thư Gmail
```

---

### 3.6. RESET MẬT KHẨU

**Chức năng:** Đặt lại mật khẩu mới bằng token từ email.  
**API:** `POST /api/reset-password/`  
**Quyền:** AllowAny

**Luồng hoạt động:**
```
User click link trong email → /reset-password?token=a1b2c3d4-...
  │
  ▼
Next.js Middleware (middleware.ts)
  │ /reset-password nằm trong publicRoutes → Cho phép truy cập
  ▼
React Component (reset-password/page.tsx)
  │ Đọc ?token từ URL: useSearchParams().get("token")
  │ User nhập new_password + confirm_password → bấm "Đặt lại"
  │ gọi authService.resetPassword(token, new_password, confirm_password)
  ▼
Service Layer (services/auth.ts)
  │ api.post("/reset-password/", {token, new_password, confirm_password})
  ▼
Axios Instance → HTTP POST (không JWT)
  │
  ▼
Django URL Router
  │ path("reset-password/", ResetPasswordView.as_view())
  ▼
ResetPasswordView.post() (API/views.py)
  │
  ├─ [Bước 1] Validate: new_password == confirm_password?
  │   ├─ KHÔNG → 400 "Mật khẩu xác nhận không khớp"
  │   └─ KHỚP → Tiếp
  │
  ├─ [Bước 2] Tìm token trong DB:
  │   │ PasswordResetToken.objects.get(token="a1b2c3d4-...", is_used=False)
  │   ▼
  │   PostgreSQL: SELECT * FROM api_passwordresettoken
  │     WHERE token='a1b2c3d4-...' AND is_used=False
  │   ├─ KHÔNG TÌM THẤY → 400 "Token không hợp lệ"
  │   └─ TÌM THẤY → Tiếp
  │
  ├─ [Bước 3] Kiểm tra hết hạn:
  │   ├─ expires_at < now → 400 "Token đã hết hạn"
  │   └─ expires_at >= now → Tiếp
  │
  ├─ [Bước 4] Đổi mật khẩu:
  │   │ reset_token.user.set_password("newpass123")
  │   │ reset_token.user.save()
  │   ▼
  │   PostgreSQL: UPDATE api_user SET password='pbkdf2_sha256$...' WHERE id=5
  │
  └─ [Bước 5] Đánh dấu token đã dùng:
      │ reset_token.is_used = True
      │ reset_token.save()
      ▼
      PostgreSQL: UPDATE api_passwordresettoken SET is_used=True WHERE token='a1b2c3d4-...'
      ▼
Response: HTTP 200 "Đặt lại mật khẩu thành công"
  ▼
React Component → toast("Thành công") → router.push("/login")
  ▼
User đăng nhập bằng mật khẩu mới
```

---

### 3.7. XEM DANH SÁCH DỰ ÁN

**Chức năng:** Hiển thị tất cả dự án mà user tham gia (là owner hoặc member).  
**API:** `GET /api/projects/?search=xxx&role=owner`  
**Quyền:** IsAuthenticated + CanViewProjectList

**Luồng hoạt động:**
```
User vào trang /my-projects
  │
  ▼
Next.js Middleware (middleware.ts)
  │ Đọc cookie "access_token"
  │ ├─ Không có → Redirect /login?redirect=/my-projects
  │ └─ Có → NextResponse.next()
  ▼
React Component (my-projects/page.tsx)
  │ useEffect → gọi projectService.getAll(params)
  ▼
Service Layer (services/project.ts)
  │ api.get("/projects/", {params: {search: "CG", role: "owner"}})
  ▼
Axios Request Interceptor (lib/api.ts)
  │ const token = localStorage.getItem("access_token")
  │ config.headers.Authorization = "Bearer eyJ..."
  ▼
HTTP GET → http://localhost:8000/api/projects/?search=CG&role=owner
  │
  ▼
Django URL Router (API/urls.py)
  │ path("projects/", ProjectListView.as_view())
  ▼
JWTAuthentication (SimpleJWT)
  │ Decode "Bearer eyJ..." → payload = {user_id: 5, is_staff: false}
  │ → User.objects.get(id=5) → request.user = User(5)
  │ ├─ Token hết hạn → 401 Unauthorized
  │ └─ Token hợp lệ → Tiếp
  ▼
Permission: CanViewProjectList (API/permissions.py)
  │ filter_queryset():
  │ ├─ user.is_staff == True (Admin):
  │ │   → queryset = Project.objects.all()   ← TẤT CẢ
  │ └─ user.is_staff == False (User thường):
  │     → queryset = Project.objects.filter(
  │         Q(owner=user) | Q(members=user)
  │       ).distinct()                       ← CHỈ project mình thuộc
  ▼
ProjectFilter (API/filters.py)
  │ ├─ ?search=CG → queryset.filter(name__icontains="CG")
  │ └─ ?role=owner → queryset.filter(owner=user)
  ▼
PostgreSQL
  │ SELECT DISTINCT p.* FROM api_project p
  │   LEFT JOIN api_project_members pm ON p.id = pm.project_id
  │   WHERE (p.owner_id = 5 OR pm.user_id = 5)
  │   AND p.name ILIKE '%CG%'
  │   AND p.owner_id = 5
  ▼
ProjectSerializer (API/serializers.py)
  │ Serialize queryset → JSON:
  │ [{
  │   id: 10, name: "CG Software", description: "...",
  │   owner: {id: 5, username: "trung"},
  │   members: [{id: 5, username: "trung"}, {id: 8, username: "member1"}],
  │   created_at: "2026-03-20T10:00:00Z"
  │ }]
  ▼
Response: HTTP 200 + JSON array
  ▼
Axios Response Interceptor (lib/api.ts)
  │ status === 200 → return response
  ▼
React Component
  │ setProjects(response.data)
  │ Re-render → Hiển thị danh sách ProjectCard
  ▼
User thấy danh sách dự án trên UI
```

---

### 3.8. TẠO DỰ ÁN

**Chức năng:** Cho phép user tạo dự án mới, tự động thêm admin vào dự án.  
**API:** `POST /api/projects/`  
**Quyền:** IsAuthenticated

**Luồng hoạt động:**
```
User bấm "Tạo dự án" → nhập name, description → bấm "Tạo"
  │
  ▼
React Component
  │ gọi projectService.create({name: "CG Software", description: "..."})
  ▼
Service Layer (services/project.ts)
  │ api.post("/projects/", {name, description})
  ▼
Axios Interceptor → gắn JWT → HTTP POST
  │
  ▼
Django URL Router → ProjectListView.post()
  │
  ▼
JWTAuthentication → request.user = User(5)
  ▼
Permission: IsAuthenticated → OK
  ▼
ProjectSerializer.validate()
  │ ├─ name: bắt buộc, không rỗng
  │ └─ description: tùy chọn
  ▼
ProjectSerializer.create() + View perform_create()
  │
  ├─ [Bước 1] Tạo project:
  │   ▼
  │   PostgreSQL: INSERT INTO api_project
  │     (name, description, owner_id, created_at, updated_at)
  │     VALUES ('CG Software', '...', 5, now, now)
  │     → RETURNING id = 10
  │
  ├─ [Bước 2] Tự thêm owner vào members:
  │   ▼
  │   PostgreSQL: INSERT INTO api_project_members (project_id, user_id)
  │     VALUES (10, 5)
  │
  ├─ [Bước 3] Tự thêm TẤT CẢ admin vào dự án:
  │   │ admins = User.objects.filter(is_staff=True).exclude(id=5)
  │   ▼
  │   PostgreSQL: SELECT id FROM api_user WHERE is_staff=True AND id != 5
  │   → Mỗi admin_id:
  │     INSERT INTO api_project_members (project_id, user_id) VALUES (10, admin_id)
  │
  └─ [Bước 4] Ghi Activity Log:
      │ create_activity_log(actor=user, project=project, description="Tạo dự án mới: CG Software")
      ▼
      PostgreSQL: INSERT INTO api_activitylog
        (action_description, actor_id, project_id, task_id, timestamp)
        VALUES ('Tạo dự án mới: CG Software', 5, 10, NULL, now)
      ▼
Response: HTTP 201 + Project data
  ▼
React Component → thêm project mới vào state → Re-render UI
  ▼
User thấy project mới trong danh sách
```

---

### 3.9. SỬA DỰ ÁN

**Chức năng:** Owner cập nhật thông tin dự án.  
**API:** `PUT/PATCH /api/projects/{id}/`  
**Quyền:** IsProjectOwnerOrMember (chỉ Owner mới sửa, Member chỉ xem)

**Luồng hoạt động:**
```
Owner sửa tên/mô tả dự án → bấm "Lưu"
  │
  ▼
React Component
  │ gọi projectService.update(10, {name: "CG Software v2"})
  ▼
Service Layer → api.patch("/projects/10/", {name: "CG Software v2"})
  ▼
Axios Interceptor → gắn JWT → HTTP PATCH
  │
  ▼
Django URL Router → ProjectDetailView.partial_update(pk=10)
  ▼
JWTAuthentication → request.user = User(5)
  ▼
View.get_object()
  │ Project.objects.get(pk=10)
  ▼
  PostgreSQL: SELECT * FROM api_project WHERE id = 10
  │ ├─ Không tìm thấy → 404 Not Found
  │ └─ Tìm thấy → project object
  ▼
Permission: IsProjectOwnerOrMember (API/permissions.py)
  │ request.method = "PATCH" (KHÔNG phải SAFE method)
  │ → Kiểm tra: request.user == project.owner?
  │ ├─ User(5) == project.owner(5) → ĐÚNG → Cho phép
  │ └─ User(8) != project.owner(5) → KHÔNG → 403 Forbidden
  ▼
ProjectSerializer.update()
  │
  ├─ [Bước 1] Cập nhật project:
  │   ▼
  │   PostgreSQL: UPDATE api_project
  │     SET name='CG Software v2', updated_at=now
  │     WHERE id = 10
  │
  └─ [Bước 2] Ghi Activity Log:
      ▼
      PostgreSQL: INSERT INTO api_activitylog
        (action_description, actor_id, project_id, timestamp)
        VALUES ('đã cập nhật thông tin dự án CG Software v2', 5, 10, now)
      ▼
Response: HTTP 200 + Project data mới
  ▼
React Component → cập nhật state → Re-render UI
```

---

### 3.10. XÓA DỰ ÁN

**Chức năng:** Owner xóa dự án, CASCADE xóa toàn bộ dữ liệu liên quan.  
**API:** `DELETE /api/projects/{id}/`  
**Quyền:** Chỉ Owner

**Luồng hoạt động:**
```
Owner bấm "Xóa dự án" → xác nhận dialog
  │
  ▼
React Component
  │ gọi projectService.delete(10)
  ▼
Service Layer → api.delete("/projects/10/")
  ▼
Axios Interceptor → gắn JWT → HTTP DELETE
  │
  ▼
Django URL Router → ProjectDetailView.destroy(pk=10)
  ▼
JWTAuthentication → request.user = User(5)
  ▼
Permission: IsProjectOwnerOrMember
  │ method = DELETE → Phải là owner
  │ ├─ Không phải owner → 403
  │ └─ Là owner → Cho phép
  ▼
View.perform_destroy()
  │
  ├─ [Bước 1] Ghi Activity Log (TRƯỚC khi xóa):
  │   ▼
  │   PostgreSQL: INSERT INTO api_activitylog (...) VALUES ('đã xóa dự án CG Software', ...)
  │
  └─ [Bước 2] Xóa project:
      ▼
      PostgreSQL: DELETE FROM api_project WHERE id = 10
        │
        │ ON DELETE CASCADE tự động xóa:
        ├─ DELETE FROM api_project_members WHERE project_id = 10
        ├─ DELETE FROM api_task WHERE project_id = 10
        │   ├─ DELETE FROM api_comment WHERE task_id IN (tasks bị xóa)
        │   ├─ DELETE FROM api_attachment WHERE task_id IN (tasks bị xóa)
        │   └─ Xóa file vật lý trong thư mục attachments/
        ├─ DELETE FROM api_activitylog WHERE project_id = 10
        └─ DELETE FROM api_notification WHERE project_id = 10
      ▼
Response: HTTP 204 No Content
  ▼
React Component → xóa project khỏi state → Re-render
  ▼
User thấy project biến mất khỏi danh sách
```

---

### 3.11. THÊM THÀNH VIÊN VÀO DỰ ÁN

**Chức năng:** Owner mời user khác vào dự án, gửi email + thông báo.  
**API:** `POST /api/projects/{id}/add_member/`  
**Quyền:** IsProjectOwnerOnly (CHỈ Owner)

**Luồng hoạt động:**
```
Owner mở dialog "Thêm thành viên" → tìm user → bấm "Thêm"
  │
  ▼
═══ BƯỚC A: TÌM KIẾM USER ═══
  │
React Component
  │ userService.search("trung")
  ▼
Service Layer → api.get("/users/?search=trung")
  ▼
Axios → JWT → HTTP GET
  ▼
Django → UserListView.get()
  ▼
UserFilter (API/filters.py)
  │ ?search=trung → username__icontains="trung" OR email__icontains="trung"
  ▼
PostgreSQL: SELECT * FROM api_user
  WHERE username ILIKE '%trung%' OR email ILIKE '%trung%'
  ▼
Response: HTTP 200 + [{id: 8, username: "member1", email: "member1@gmail.com"}, ...]
  ▼
React Component → Hiển thị dropdown kết quả
  │
  ▼
═══ BƯỚC B: THÊM MEMBER ═══
  │
Owner chọn user(id=8) → bấm "Thêm"
  │
React Component
  │ projectService.addMember(10, 8)
  ▼
Service Layer → api.post("/projects/10/add_member/", {user_id: 8})
  ▼
Axios → JWT → HTTP POST
  │
  ▼
Django URL Router → AddMemberView.post(pk=10)
  ▼
JWTAuthentication → request.user = User(5)
  ▼
Permission: IsProjectOwnerOnly (API/permissions.py)
  │ request.user.id == project.owner_id?
  │ ├─ 5 == 5 → Đúng → Cho phép
  │ └─ 8 != 5 → Sai → 403 Forbidden "Chỉ chủ dự án mới có quyền"
  ▼
AddMemberView.post() logic
  │
  ├─ [Bước 1] Tìm project:
  │   │ Project.objects.get(pk=10)
  │   ▼ PostgreSQL: SELECT * FROM api_project WHERE id=10
  │
  ├─ [Bước 2] Tìm user:
  │   │ User.objects.get(pk=8)
  │   ▼ PostgreSQL: SELECT * FROM api_user WHERE id=8
  │   ├─ Không thấy → 404 "Không tìm thấy user"
  │   └─ Thấy → Tiếp
  │
  ├─ [Bước 3] Check đã là member chưa:
  │   ▼ PostgreSQL: SELECT 1 FROM api_project_members WHERE project_id=10 AND user_id=8
  │   ├─ ĐÃ CÓ → return 200 "Người dùng đã là thành viên"
  │   └─ CHƯA CÓ → Tiếp
  │
  ├─ [Bước 4] Thêm vào members:
  │   │ project.members.add(user)
  │   ▼ PostgreSQL: INSERT INTO api_project_members (project_id, user_id) VALUES (10, 8)
  │
  ├─ [Bước 5] Ghi Activity Log:
  │   ▼ PostgreSQL: INSERT INTO api_activitylog (...)
  │     VALUES ('Thêm thành viên member1 vào dự án CG Software', 5, 10, NULL, now)
  │
  ├─ [Bước 6] Tạo Notification:
  │   │ create_notification(recipient=user(8), title="Bạn đã được thêm vào dự án mới", ...)
  │   ▼ PostgreSQL: INSERT INTO api_notification
  │     (recipient_id, title, message, project_id, task_id, is_read, created_at)
  │     VALUES (8, 'Bạn đã được thêm vào dự án mới', '...CG Software', 10, NULL, False, now)
  │
  └─ [Bước 7] GỬI EMAIL:
      │ send_project_invitation_notification(member=user(8), project=project)
      ▼
  Email Utils (API/email_utils.py)
      │ Render template: templates/emails/project_invitation.html
      │ Subject: "[Thêm vào dự án] Bạn đã được thêm vào dự án: CG Software"
      ▼
  Gmail SMTP (smtp.gmail.com:587)
      │ Kết nối TLS → Xác thực → Gửi HTML email
      │ To: member1@gmail.com
      ▼
Response: HTTP 200 "Đã thêm member1 vào dự án"
  ▼
React Component → cập nhật danh sách members
  ▼
User member1:
  ├─ Nhận email HTML trong hộp thư
  └─ Đăng nhập hệ thống → Thấy chuông đỏ (Notification)
```

---

### 3.12. XÓA THÀNH VIÊN KHỎI DỰ ÁN

**Chức năng:** Owner xóa member khỏi dự án, gửi email + thông báo.  
**API:** `POST /api/projects/{id}/remove_member/`  
**Quyền:** IsProjectOwnerOnly

**Luồng hoạt động:**
```
Owner chọn member → bấm "Xóa khỏi dự án"
  │
  ▼
React Component
  │ projectService.removeMember(10, 8)
  ▼
Service Layer → api.post("/projects/10/remove_member/", {user_id: 8})
  ▼
Axios → JWT → HTTP POST
  │
  ▼
Django → RemoveMemberView.post(pk=10)
  ▼
Permission: IsProjectOwnerOnly → owner?
  ▼
RemoveMemberView.post() logic
  │
  ├─ [Bước 1] Xóa chủ dự án?
  │   ├─ user_id == project.owner_id → 400 "Không thể xóa chủ dự án"
  │   └─ Không → Tiếp
  │
  ├─ [Bước 2] Kiểm tra có phải member không:
  │   ▼ PostgreSQL: SELECT 1 FROM api_project_members WHERE project_id=10 AND user_id=8
  │   ├─ KHÔNG PHẢI → 200 "Người dùng không phải thành viên"
  │   └─ LÀ MEMBER → Tiếp
  │
  ├─ [Bước 3] Xóa khỏi members:
  │   │ project.members.remove(user)
  │   ▼ PostgreSQL: DELETE FROM api_project_members WHERE project_id=10 AND user_id=8
  │
  ├─ [Bước 4] Ghi Activity Log:
  │   ▼ PostgreSQL: INSERT INTO api_activitylog (...)
  │
  ├─ [Bước 5] Tạo Notification:
  │   ▼ PostgreSQL: INSERT INTO api_notification
  │     (recipient_id=8, title='Bạn đã bị xóa khỏi dự án', message='...CG Software', ...)
  │
  └─ [Bước 6] GỬI EMAIL:
      │ send_member_removed_notification(member, project)
      ▼ Template: emails/member_removed.html
      ▼ Gmail SMTP → Subject: "[Xóa khỏi dự án] CG Software"
      ▼ To: member1@gmail.com
      ▼
Response: HTTP 200 "Đã xóa"
  ▼
React Component → cập nhật danh sách members
```

---

### 3.13. XEM TASK DỰ ÁN (Kanban Board)

**Chức năng:** Hiển thị tất cả task của dự án trên bảng Kanban 3 cột.  
**API:** `GET /api/projects/{id}/tasks/?status=TODO&priority=HIGH&assignee=me&search=abc`  
**Quyền:** CanViewTaskList (Owner hoặc Member)

**Luồng hoạt động:**
```
User vào trang /projects/10
  │
  ▼
Next.js Middleware → check cookie → OK
  ▼
React Component (projects/[id]/page.tsx)
  │ gọi taskService.getByProject(10, filters)
  ▼
Service Layer (services/task.ts)
  │ api.get("/projects/10/tasks/", {params: {status, priority, assignee, search}})
  ▼
Axios Interceptor → gắn JWT
  ▼
HTTP GET → http://localhost:8000/api/projects/10/tasks/?status=TODO&priority=HIGH&assignee=me
  │
  ▼
Django URL Router → TaskListView.get(pk=10)
  ▼
JWTAuthentication → request.user = User(5)
  ▼
Permission: CanViewTaskList (API/permissions.py)
  │ filter_queryset():
  │ ├─ Admin → Task.objects.filter(project_id=10, is_personal=False)  ← Tất cả task dự án
  │ └─ User thường:
  │     → Task.objects.filter(
  │         project_id=10, is_personal=False,
  │         project__in=Project.objects.filter(Q(owner=user) | Q(members=user))
  │       )
  │     → CHỈ task thuộc dự án mà mình là member
  ▼
TaskFilter (API/filters.py)
  │ ├─ ?status=TODO    → .filter(status='TODO')
  │ ├─ ?priority=HIGH  → .filter(priority='HIGH')
  │ ├─ ?assignee=me    → .filter(assignee=request.user)
  │ ├─ ?assignee=8     → .filter(assignee_id=8)
  │ ├─ ?search=fix     → .filter(title__icontains='fix')
  │ ├─ ?due_date_after=2026-03-20  → .filter(due_date__gte='2026-03-20')
  │ └─ ?due_date_before=2026-03-25 → .filter(due_date__lte='2026-03-25')
  ▼
PostgreSQL
  │ SELECT * FROM api_task
  │   WHERE project_id = 10
  │   AND is_personal = False
  │   AND status = 'TODO'
  │   AND priority = 'HIGH'
  │   AND assignee_id = 5
  │   AND title ILIKE '%fix%'
  ▼
TaskSerializer → JSON:[{id,title,status,priority,assignee:{},due_date,created_by:{}}]
  ▼
Response: HTTP 200 + JSON array
  ▼
React Component (kanban-board.tsx)
  │ Nhận tasks[] → Chia thành 3 cột:
  │ ├─ col_todo = tasks.filter(t => t.status === 'TODO')
  │ ├─ col_inpr = tasks.filter(t => t.status === 'INPR')
  │ └─ col_done = tasks.filter(t => t.status === 'DONE')
  │
  │ Mỗi task render → draggable-task-card.tsx (thẻ có thể kéo thả)
  ▼
User thấy Kanban Board 3 cột với các thẻ task
```

---

### 3.14. TẠO TASK TRONG DỰ ÁN

**Chức năng:** Tạo task mới trong dự án, giao cho thành viên, gửi email nếu có assignee.  
**API:** `POST /api/projects/{id}/tasks/`  
**Quyền:** Owner hoặc Member

**Luồng hoạt động:**
```
User bấm "+" trên Kanban → nhập thông tin → bấm "Tạo"
  │
  ▼
React Component (create-task-dialog.tsx)
  │ data = {title: "Fix bug login", priority: "HIGH", assignee_id: 8, due_date: "2026-03-25"}
  │ gọi taskService.create(10, data)
  ▼
Service Layer → api.post("/projects/10/tasks/", data)
  ▼
Axios → JWT → HTTP POST
  │
  ▼
Django → TaskListView.post(pk=10)
  ▼
JWTAuthentication → request.user = User(5)
  ▼
TaskListView.post() logic
  │
  ├─ [Bước 1] Tìm project(10):
  │   ▼ PostgreSQL: SELECT * FROM api_project WHERE id=10
  │
  ├─ [Bước 2] Kiểm tra quyền tạo task:
  │   │ User là owner hoặc member?
  │   ▼ PostgreSQL: SELECT 1 FROM api_project
  │     WHERE id=10 AND (owner_id=5 OR id IN
  │       (SELECT project_id FROM api_project_members WHERE user_id=5))
  │   ├─ KHÔNG → 403 "Không có quyền tạo task"
  │   └─ CÓ → Tiếp
  │
  ├─ [Bước 3] TaskSerializer validate + create:
  │   ▼ PostgreSQL: INSERT INTO api_task
  │     (title, description, status, priority, start_date, due_date,
  │      project_id, is_personal, created_by_id, assignee_id, created_at, updated_at)
  │     VALUES ('Fix bug login', NULL, 'TODO', 'HIGH', NULL, '2026-03-25',
  │      10, False, 5, 8, now, now)
  │     → RETURNING id = 42
  │
  ├─ [Bước 4] Ghi Activity Log:
  │   ▼ PostgreSQL: INSERT INTO api_activitylog (...)
  │     VALUES ('Tạo công việc Fix bug login', 5, 10, 42, now)
  │
  └─ [Bước 5] Kiểm tra assignee → GỬI EMAIL:
      │ task.assignee_id(8) != request.user.id(5) → KHÁC NGƯỜI → CẦN GỬI
      │ send_task_assigned_notification(task, assigner=User(5))
      ▼
  Email Utils (API/email_utils.py)
      │ Render template: templates/emails/task_assigned.html
      │ Subject: "[Giao việc] Bạn được giao công việc: Fix bug login"
      │ Body HTML: tên task, dự án, người giao, deadline
      ▼
  Gmail SMTP → Gửi email tới member1@gmail.com
      ▼
Response: HTTP 201 + Task data {id: 42, title: "Fix bug login", ...}
  ▼
React Component → thêm task vào cột "VIỆC CẦN LÀM" trên Kanban
  ▼
User thấy task mới + member1 nhận email
```

---

### 3.15. KÉO THẢ TASK (Đổi trạng thái Kanban)

**Chức năng:** User kéo thẻ task từ cột này sang cột khác → thay đổi trạng thái.  
**API:** `PATCH /api/tasks/{id}/`  
**Quyền:** IsTaskPermission (Owner/Member/Assignee)

**Luồng hoạt động:**
```
User kéo task "Fix bug login" từ cột TODO → thả vào cột IN PROGRESS
  │
  ▼
kanban-board.tsx bắt sự kiện onDragEnd
  │ source.droppableId = "TODO", destination.droppableId = "INPR"
  │ taskId = 42, newStatus = "INPR"
  │
  │ [Optimistic Update] Cập nhật UI TRƯỚC (UX mượt)
  │ → Di chuyển thẻ sang cột mới lập tức
  │
  │ gọi taskService.update(42, {status: "INPR"})
  ▼
Service Layer → api.patch("/tasks/42/", {status: "INPR"})
  ▼
Axios → JWT → HTTP PATCH
  │
  ▼
Django → TaskDetailView.partial_update(pk=42)
  ▼
JWTAuthentication → request.user = User(5)
  ▼
View.get_object() → Task.objects.get(pk=42)
  ▼
Permission: IsTaskPermission (API/permissions.py)
  │ task.is_personal == False → Task dự án
  │ ├─ User là owner/member/assignee?
  │ ├─ Chỉ đổi status (không đổi assignee) → Owner/Member/Assignee đều OK
  │ └─ Cho phép
  ▼
TaskDetailView.partial_update() logic
  │
  ├─ [Bước 1] LƯU GIÁ TRỊ CŨ (trước khi update):
  │   old_status = "TODO"
  │   old_assignee = User(8)
  │   old_due_date = "2026-03-25"
  │
  ├─ [Bước 2] Cập nhật:
  │   ▼ PostgreSQL: UPDATE api_task SET status='INPR', updated_at=now WHERE id=42
  │
  ├─ [Bước 3] SO SÁNH CŨ vs MỚI → Quyết định gửi email gì:
  │   │
  │   ├─ old_assignee(8) == new_assignee(8)? → BẰNG → Không gửi email assign
  │   ├─ old_due_date == new_due_date? → BẰNG → Không gửi email due_date
  │   └─ old_status("TODO") != new_status("INPR")? → KHÁC → GỬI EMAIL STATUS:
  │       │
  │       │ Xác định recipients (dùng set{} tránh trùng):
  │       │ ├─ task.assignee(8) ≠ request.user(5) → THÊM User(8)
  │       │ ├─ task.created_by(5) == request.user(5) → KHÔNG thêm (tự mình)
  │       │ └─ project.members.all() → thêm tất cả (trừ request.user)
  │       │ → recipients = {User(8), User(9), ...}
  │       │
  │       │ send_task_status_changed_notification():
  │       ▼
  │   Email Utils
  │       │ Template: emails/task_status_changed.html
  │       │ Subject: "[Thay đổi trạng thái] Fix bug login"
  │       │ Body: "trung đã thay đổi trạng thái: To Do → In Progress"
  │       ▼
  │   Gmail SMTP → Gửi email cho từng recipient
  │
  └─ [Bước 4] Ghi Activity Log:
      ▼ PostgreSQL: INSERT INTO api_activitylog (...)
        VALUES ('đã cập nhật một phần công việc Fix bug login', 5, 10, 42, now)
      ▼
Response: HTTP 200 + Task data mới {id: 42, status: "INPR", ...}
  ▼
React Component
  │ Optimistic update đã đúng → Giữ nguyên UI
  │ (Nếu server lỗi → Rollback: đưa thẻ về cột cũ)
  ▼
User thấy task nằm ở cột "ĐANG TIẾN HÀNH"
```

---

### 3.16. CẬP NHẬT TASK (Sửa chi tiết)

**Chức năng:** Sửa thông tin task: title, description, priority, assignee, due_date. Gửi email khi thay đổi assignee/due_date/status.  
**API:** `PUT/PATCH /api/tasks/{id}/`  
**Quyền:** IsTaskPermission

**Luồng hoạt động:**
```
User mở task modal → sửa assignee, due_date → bấm "Lưu"
  │
  ▼
React Component (task-detail-modal.tsx)
  │ data = {assignee_id: 9, due_date: "2026-03-28"}
  │ gọi taskService.update(42, data)
  ▼
Service Layer → api.patch("/tasks/42/", data)
  ▼
Axios → JWT → HTTP PATCH
  │
  ▼
Django → TaskDetailView.partial_update(pk=42)
  ▼
Permission: IsTaskPermission
  │ Kiểm tra ĐỔI ASSIGNEE:
  │ ├─ "assignee_id" in request.data? → CÓ
  │ ├─ request.user == project.owner? → CÓ → Cho phép
  │ └─ Nếu KHÔNG phải owner → 403 "Chỉ chủ dự án mới được giao việc"
  ▼
TaskDetailView logic
  │
  ├─ [Bước 1] LƯU GIÁ TRỊ CŨ:
  │   old_assignee = User(8), old_due_date = "2026-03-25", old_status = "INPR"
  │
  ├─ [Bước 2] Cập nhật:
  │   ▼ PostgreSQL: UPDATE api_task
  │     SET assignee_id=9, due_date='2026-03-28', updated_at=now
  │     WHERE id=42
  │
  ├─ [Bước 3] SO SÁNH → Gửi email:
  │   │
  │   ├─ old_assignee(8) != new_assignee(9) → ĐỔI ASSIGNEE:
  │   │   │ send_task_assigned_notification(task, assigner)
  │   │   ▼ Template: emails/task_assigned.html
  │   │   ▼ Gmail SMTP → Gửi email cho User(9)
  │   │     Subject: "[Giao việc] Fix bug login"
  │   │
  │   ├─ old_due_date("03-25") != new_due_date("03-28") → ĐỔI DEADLINE:
  │   │   │ send_task_due_date_changed_notification(task, old_due_date)
  │   │   ▼ Template: emails/task_due_date_changed.html
  │   │   ▼ Gmail SMTP → Gửi cho tất cả members (trừ người sửa)
  │   │     Subject: "[Thay đổi hạn] Fix bug login"
  │   │     Body: "Hạn cũ: 25/03/2026 → Hạn mới: 28/03/2026"
  │   │
  │   └─ old_status == new_status → KHÔNG ĐỔI → Không gửi email status
  │
  └─ [Bước 4] Ghi Activity Log
      ▼
Response: HTTP 200 + Task data mới
  ▼
React Component → cập nhật UI
```

---

### 3.17. XÓA TASK

**Chức năng:** Owner xóa task, gửi email thông báo cho tất cả người liên quan.  
**API:** `DELETE /api/tasks/{id}/`  
**Quyền:** Chỉ Owner dự án

**Luồng hoạt động:**
```
Owner bấm "Xóa task" → xác nhận
  │
  ▼
React Component
  │ gọi taskService.delete(42)
  ▼
Service Layer → api.delete("/tasks/42/")
  ▼
Axios → JWT → HTTP DELETE
  │
  ▼
Django → TaskDetailView.destroy(pk=42)
  ▼
Permission: IsTaskPermission
  │ method = DELETE
  │ ├─ Task cá nhân → Chỉ creator
  │ └─ Task dự án → Chỉ project owner
  │     ├─ Không phải owner → 403
  │     └─ Là owner → OK
  ▼
TaskDetailView.destroy() logic
  │
  ├─ [Bước 1] Thu thập danh sách người nhận email:
  │   │ recipients = set()
  │   │ ├─ task.assignee → thêm (nếu khác request.user)
  │   │ ├─ task.created_by → thêm (nếu khác request.user)
  │   │ └─ project.members.all() → thêm tất cả (trừ request.user)
  │   ▼
  │   PostgreSQL: SELECT u.* FROM api_user u
  │     JOIN api_project_members pm ON u.id=pm.user_id
  │     WHERE pm.project_id=10
  │
  ├─ [Bước 2] GỬI EMAIL cho từng recipient:
  │   │ send_task_deleted_notification(task_title, project, recipients)
  │   ▼ Template: emails/task_deleted.html
  │   ▼ Gmail SMTP → Subject: "[Đã xóa] Công việc: Fix bug login"
  │   ▼ Gửi lần lượt cho mỗi recipient
  │
  ├─ [Bước 3] Ghi Activity Log (TRƯỚC khi xóa):
  │   ▼ PostgreSQL: INSERT INTO api_activitylog (...)
  │     VALUES ('đã xóa công việc Fix bug login', 5, 10, NULL, now)
  │
  └─ [Bước 4] Xóa task:
      ▼ PostgreSQL: DELETE FROM api_task WHERE id=42
        │ CASCADE:
        ├─ DELETE FROM api_comment WHERE task_id=42
        ├─ DELETE FROM api_attachment WHERE task_id=42
        │   └─ File vật lý trên disk bị xóa (attachment.file.delete())
        ├─ DELETE FROM api_activitylog WHERE task_id=42
        └─ DELETE FROM api_notification WHERE task_id=42
      ▼
Response: HTTP 204 No Content
  ▼
React Component → xóa task khỏi Kanban Board
```

---

### 3.18. TASK CÁ NHÂN — XEM DANH SÁCH

**Chức năng:** Cho phép user xem task riêng tư, chỉ mình mình thấy.  
**API:** `GET /api/my-tasks/`  
**Quyền:** IsAuthenticated

**Luồng hoạt động:**
```
User vào trang /my-tasks
  │
  ▼
Next.js Middleware → check cookie → OK
  ▼
React Component (my-tasks/page.tsx)
  │ gọi taskService.getPersonal(filters)
  ▼
Service Layer → api.get("/my-tasks/", {params})
  ▼
Axios → JWT → HTTP GET
  │
  ▼
Django → PersonalTaskListView.get()
  ▼
JWTAuthentication → request.user = User(5)
  ▼
Permission: IsAuthenticated → OK
  ▼
PersonalTaskListView.get_queryset()
  │ Task.objects.filter(created_by=request.user, is_personal=True)
  │
  │ ⚠️ BẢO MẬT: Chỉ trả task CỦA CHÍNH MÌNH
  │ User khác KHÔNG THỂ xem task cá nhân của người khác
  ▼
TaskFilter (nếu có params)
  │ ?status=TODO, ?priority=HIGH, ?search=...
  ▼
PostgreSQL
  │ SELECT * FROM api_task
  │   WHERE created_by_id = 5
  │   AND is_personal = True
  │   ORDER BY created_at DESC
  ▼
TaskSerializer → JSON
  ▼
Response: HTTP 200 + [{id, title, status, priority, due_date, ...}]
  ▼
React Component → render danh sách task cá nhân
```

---

### 3.19. TASK CÁ NHÂN — TẠO MỚI

**Chức năng:** Tạo task riêng tư, không thuộc dự án nào.  
**API:** `POST /api/my-tasks/`  
**Quyền:** IsAuthenticated

**Luồng hoạt động:**
```
User bấm "Tạo việc cá nhân" → nhập thông tin → bấm "Tạo"
  │
  ▼
React Component
  │ gọi taskService.createPersonal({title: "Học React", priority: "MED", due_date: "..."})
  ▼
Service Layer → api.post("/my-tasks/", data)
  ▼
Axios → JWT → HTTP POST
  │
  ▼
Django → PersonalTaskListView.post()
  ▼
PersonalTaskListView.perform_create()
  │
  │ Tự động gán:
  │ ├─ created_by = request.user (người tạo)
  │ ├─ assignee = request.user (giao cho chính mình)
  │ ├─ is_personal = True
  │ └─ project = NULL (không thuộc dự án nào)
  ▼
PostgreSQL: INSERT INTO api_task
  (title, status, priority, due_date, project_id, is_personal, created_by_id, assignee_id)
  VALUES ('Học React', 'TODO', 'MED', '...', NULL, True, 5, 5)
                                                 ↑      ↑       ↑     ↑
                                            Không dự án  Cá nhân  Mình tạo  Giao mình
  ▼
Response: HTTP 201
  ▼
React Component → thêm task mới vào danh sách
  ▼
KHÔNG GỬI EMAIL (task cá nhân, tự giao cho mình)
```

---

### 3.20. XEM TẤT CẢ TASK ĐƯỢC GIAO

**Chức năng:** Tổng hợp tất cả task được giao + task cá nhân.  
**API:** `GET /api/assigned-tasks/`  
**Quyền:** IsAuthenticated

**Luồng hoạt động:**
```
User vào Dashboard
  │
  ▼
React Component (dashboard/page.tsx)
  │ gọi taskService.getAssigned(filters)
  ▼
Service Layer → api.get("/assigned-tasks/", {params})
  ▼
Axios → JWT → HTTP GET
  │
  ▼
Django → AssignedTasksView.get()
  ▼
AssignedTasksView.get_queryset()
  │ Task.objects.filter(
  │   Q(assignee=request.user) |            ← Task dự án được giao
  │   Q(created_by=request.user, is_personal=True)  ← Task cá nhân
  │ ).distinct()
  ▼
PostgreSQL
  │ SELECT DISTINCT * FROM api_task
  │   WHERE assignee_id = 5
  │   OR (created_by_id = 5 AND is_personal = True)
  │   ORDER BY created_at DESC
  ▼
TaskFilter → filter thêm nếu có params
  ▼
Response: HTTP 200 + JSON array (tổng hợp task dự án + cá nhân)
  ▼
React Component → render danh sách tổng hợp trên Dashboard
```

---

### 3.21. BÌNH LUẬN — XEM

**Chức năng:** Cho phép thành viên xem bình luận trên task.  
**API:** `GET /api/tasks/{task_id}/comments/`  
**Quyền:** CanCommentOnTask

**Luồng hoạt động:**
```
User mở task modal → tab Comments
  │
  ▼
React Component (task-detail-modal.tsx)
  │ gọi commentService.getAll(42)
  ▼
Service Layer → api.get("/tasks/42/comments/")
  ▼
Axios → JWT → HTTP GET
  │
  ▼
Django → CommentListView.get(task_pk=42)
  ▼
Permission: CanCommentOnTask
  │ ├─ Task cá nhân → Chỉ creator + assignee
  │ └─ Task dự án → Tất cả member dự án
  ▼
PostgreSQL
  │ SELECT c.*, u.username, u.email FROM api_comment c
  │   JOIN api_user u ON c.author_id = u.id
  │   WHERE c.task_id = 42
  │   ORDER BY c.created_at ASC
  ▼
CommentSerializer → JSON
  ▼
Response: HTTP 200 + [{id, body, author: {id, username}, created_at, updated_at}]
  ▼
React Component → hiển thị danh sách bình luận
```

---

### 3.22. BÌNH LUẬN — TẠO MỚI

**Chức năng:** Tạo bình luận trên task, gửi thông báo + email cho người liên quan.  
**API:** `POST /api/tasks/{task_id}/comments/`  
**Quyền:** CanCommentOnTask

**Luồng hoạt động:**
```
User nhập nội dung → bấm "Gửi"
  │
  ▼
React Component
  │ gọi commentService.create(42, "Cần test lại phần login")
  ▼
Service Layer → api.post("/tasks/42/comments/", {body: "Cần test lại phần login"})
  ▼
Axios → JWT → HTTP POST
  │
  ▼
Django → CommentListView.post(task_pk=42)
  ▼
Permission: CanCommentOnTask → OK (member)
  ▼
CommentListView.perform_create() logic
  │
  ├─ [Bước 1] Tạo comment:
  │   ▼ PostgreSQL: INSERT INTO api_comment
  │     (body, task_id, author_id, created_at, updated_at)
  │     VALUES ('Cần test lại phần login', 42, 5, now, now)
  │     → RETURNING id = 20
  │
  ├─ [Bước 2] Ghi Activity Log:
  │   ▼ PostgreSQL: INSERT INTO api_activitylog (...)
  │     VALUES ('Thêm bình luận vào Fix bug login', 5, 10, 42, now)
  │
  ├─ [Bước 3] Xác định người nhận thông báo:
  │   │ recipients = set()
  │   │ ├─ task.assignee(8) != request.user(5) → THÊM User(8)
  │   │ ├─ task.created_by(5) == request.user(5) → KHÔNG thêm (tự mình)
  │   │ └─ project → owner != request.user? → thêm nếu khác
  │   │ → recipients = {User(8)}
  │   ▼
  │
  ├─ [Bước 4] Tạo Notification cho mỗi recipient:
  │   ▼ PostgreSQL: INSERT INTO api_notification
  │     (recipient_id, title, message, project_id, task_id, is_read, created_at)
  │     VALUES (8, 'Bình luận mới trong Fix bug login',
  │       'trung đã bình luận: "Cần test lại phần login"', 10, 42, False, now)
  │
  └─ [Bước 5] GỬI EMAIL:
      │ send_task_comment_notification(comment, task, recipients)
      ▼ Template: emails/task_comment.html
      ▼ Gmail SMTP → Subject: "[Bình luận mới] Fix bug login"
      ▼ Body: trung đã bình luận: "Cần test lại phần login"
      ▼ To: member1@gmail.com
      ▼
Response: HTTP 201 + Comment data
  ▼
React Component → thêm comment mới vào danh sách
  ▼
User member1:
  ├─ Nhận email
  └─ Chuông đỏ trên header (Notification)
```

---

### 3.23. BÌNH LUẬN — SỬA / XÓA

**Chức năng:** Sửa/xóa bình luận của mình hoặc owner có quyền xóa.  
**API:** `PUT/DELETE /api/tasks/{task_id}/comments/{id}/`  
**Quyền:** IsCommentOrAttachmentOwner

**Luồng hoạt động:**
```
═══ SỬA ═══
User bấm "Sửa" trên comment của mình
  │
  ▼
Service Layer → api.put("/tasks/42/comments/20/", {body: "Nội dung mới"})
  ▼
Django → CommentDetailView.update(task_pk=42, pk=20)
  ▼
Permission: IsCommentOrAttachmentOwner
  │ ├─ request.user == comment.author? → Cho phép
  │ ├─ request.user == project.owner? → Cho phép (owner có toàn quyền)
  │ └─ Người khác → 403 Forbidden
  ▼
PostgreSQL: UPDATE api_comment SET body='Nội dung mới', updated_at=now WHERE id=20
  ▼
Response: HTTP 200

═══ XÓA ═══
User bấm "Xóa" trên comment
  │
  ▼
Service Layer → api.delete("/tasks/42/comments/20/")
  ▼
Permission: IsCommentOrAttachmentOwner → OK
  ▼
PostgreSQL: DELETE FROM api_comment WHERE id=20
  ▼
Ghi Activity Log
  ▼
Response: HTTP 204
```

---

### 3.24. TỆP ĐÍNH KÈM — UPLOAD

**Chức năng:** Upload file đính kèm trên task.  
**API:** `POST /api/tasks/{task_id}/attachments/`  
**Quyền:** IsTaskPermission

**Luồng hoạt động:**
```
User mở task modal → chọn file → bấm Upload
  │
  ▼
React Component
  │ const formData = new FormData()
  │ formData.append("file", fileObject)
  │ formData.append("description", "Ảnh chụp lỗi")
  │ gọi attachmentService.upload(42, fileObject, "Ảnh chụp lỗi")
  ▼
Service Layer → api.post("/tasks/42/attachments/", formData,
  │ {headers: {"Content-Type": "multipart/form-data"}})
  ▼
Axios → JWT + Content-Type: multipart/form-data → HTTP POST
  │
  ▼
Django → AttachmentListView.post(task_pk=42)
  │ parser_classes = [MultiPartParser, FormParser]  ← Xử lý file upload
  ▼
Permission: IsTaskPermission → OK
  ▼
AttachmentListView.perform_create()
  │
  ├─ [Bước 1] Lưu file vật lý:
  │   ▼ Django FileField lưu file vào: attachments/screenshot.png (trên server disk)
  │
  ├─ [Bước 2] Tạo record trong DB:
  │   ▼ PostgreSQL: INSERT INTO api_attachment
  │     (file, description, task_id, uploader_id, uploaded_at)
  │     VALUES ('attachments/screenshot.png', 'Ảnh chụp lỗi', 42, 5, now)
  │     → RETURNING id = 3
  │
  └─ [Bước 3] Ghi Activity Log:
      ▼ PostgreSQL: INSERT INTO api_activitylog (...)
        VALUES ('Tải lên tệp cho Fix bug login', 5, 10, 42, now)
      ▼
Response: HTTP 201 + {id, file: "/attachments/screenshot.png", description, uploaded_at}
  ▼
React Component → thêm file vào danh sách đính kèm
```

---

### 3.25. TỆP ĐÍNH KÈM — XÓA

**Chức năng:** Xóa file đính kèm (uploader hoặc project owner).  
**API:** `DELETE /api/tasks/{task_id}/attachments/{id}/`  
**Quyền:** IsCommentOrAttachmentOwner

**Luồng hoạt động:**
```
User bấm "Xóa" trên file đính kèm
  │
  ▼
Service Layer → api.delete("/tasks/42/attachments/3/")
  ▼
Axios → JWT → HTTP DELETE
  │
  ▼
Django → AttachmentDetailView.destroy(task_pk=42, pk=3)
  ▼
Permission: IsCommentOrAttachmentOwner
  │ ├─ Uploader → OK
  │ ├─ Project owner → OK
  │ └─ Người khác → 403
  ▼
AttachmentDetailView.destroy()
  │
  ├─ [Bước 1] Xóa file vật lý:
  │   │ attachment.file.delete(save=False)
  │   ▼ OS: Xóa file attachments/screenshot.png trên disk
  │
  ├─ [Bước 2] Xóa record DB:
  │   ▼ PostgreSQL: DELETE FROM api_attachment WHERE id=3
  │
  └─ [Bước 3] Ghi Activity Log
      ▼
Response: HTTP 204 No Content
  ▼
React Component → xóa file khỏi UI
```

---

### 3.26. NHẬT KÝ HOẠT ĐỘNG (Activity Log)

**Chức năng:** Xem lịch sử hoạt động theo dự án hoặc theo task.  
**API:** `GET /api/projects/{id}/activity/` (theo dự án)  
**API:** `GET /api/tasks/{id}/activity/` (theo task)  
**Quyền:** CanViewActivityLog

**Luồng hoạt động:**
```
User mở dialog "Lịch sử hoạt động"
  │
  ▼
═══ THEO DỰ ÁN ═══
Service Layer → api.get("/projects/10/activity/")
  ▼
Django → ActivityLogProjectView.get(pk=10)
  ▼
Permission: CanViewActivityLog
  │ Phải là owner hoặc member
  ▼
PostgreSQL: SELECT al.*, u.username FROM api_activitylog al
  JOIN api_user u ON al.actor_id = u.id
  WHERE al.project_id = 10
  ORDER BY al.timestamp DESC
  ▼
Response: HTTP 200 + [
  {actor: "trung", action: "Tạo công việc Fix bug login", timestamp: "2026-03-21 14:00"},
  {actor: "member1", action: "Thêm bình luận vào Fix bug login", timestamp: "14:30"},
  {actor: "trung", action: "đã cập nhật công việc Fix bug login", timestamp: "15:00"}
]
  ▼
React Component → hiển thị timeline lịch sử

═══ THEO TASK ═══
Service Layer → api.get("/tasks/42/activity/")
  ▼
Django → ActivityLogTaskView.get(pk=42)
  ▼
PostgreSQL: SELECT * FROM api_activitylog WHERE task_id=42 ORDER BY timestamp DESC
  ▼
Response: HTTP 200 + logs chỉ liên quan task 42
```

---

### 3.27. THÔNG BÁO — XEM

**Chức năng:** Hiển thị chuông thông báo trên header.  
**API:** `GET /api/notifications/`  
**Quyền:** IsAuthenticated

**Luồng hoạt động:**
```
User click chuông thông báo trên header
  │
  ▼
React Component (notification-bell.tsx)
  │ gọi notificationService.getAll()
  ▼
Service Layer → api.get("/notifications/")
  ▼
Axios → JWT → HTTP GET
  │
  ▼
Django → NotificationListView.get()
  ▼
NotificationListView.get_queryset()
  │ Notification.objects.filter(recipient=request.user)
  │ → ordering = ['-created_at'] (mới nhất trước)
  ▼
PostgreSQL
  │ SELECT * FROM api_notification
  │   WHERE recipient_id = 5
  │   ORDER BY created_at DESC
  │
  │ Đếm unread:
  │ SELECT COUNT(*) FROM api_notification
  │   WHERE recipient_id = 5 AND is_read = False
  ▼
NotificationSerializer → JSON
  ▼
Response: HTTP 200 + {
  unread_count: 3,
  notifications: [
    {id: 15, title: "Bình luận mới trong Fix bug login", message: "...", is_read: false, created_at: "..."},
    {id: 14, title: "Bạn được giao công việc", message: "...", is_read: true, created_at: "..."},
    ...
  ]
}
  ▼
React Component
  │ Chuông hiển thị badge đỏ: "3"
  │ Click chuông → Dropdown danh sách thông báo
  │ ├─ Chưa đọc: bold, nền sáng
  │ └─ Đã đọc: font thường, nền mờ
```

---

### 3.28. THÔNG BÁO — ĐÁNH DẤU ĐÃ ĐỌC

**Chức năng:** Đánh dấu 1 hoặc tất cả thông báo đã đọc.  
**API:** `POST /api/notifications/{id}/read/` (1 cái)  
**API:** `POST /api/notifications/read-all/` (tất cả)  
**Quyền:** IsAuthenticated

**Luồng hoạt động:**
```
═══ ĐÁNH DẤU 1 CÁI ═══
User click vào 1 thông báo
  │
  ▼
notificationService.markAsRead(15)
  ▼
Service Layer → api.post("/notifications/15/read/")
  ▼
Django → NotificationMarkAsReadView.post(pk=15)
  ▼
PostgreSQL: UPDATE api_notification SET is_read=True WHERE id=15 AND recipient_id=5
  │                                                                 ↑ BẢO MẬT: chỉ sửa của mình
  ▼
Response: HTTP 200
  ▼
React → Badge giảm (3 → 2)

═══ ĐÁNH DẤU TẤT CẢ ═══
User bấm "Đánh dấu tất cả đã đọc"
  │
  ▼
notificationService.markAllAsRead()
  ▼
Service Layer → api.post("/notifications/read-all/")
  ▼
Django → NotificationMarkAllAsReadView.post()
  ▼
PostgreSQL: UPDATE api_notification SET is_read=True
  WHERE recipient_id=5 AND is_read=False
  ▼
Response: HTTP 200
  ▼
React → Badge = 0
```

---

### 3.29. KIỂM TRA TASK QUÁ HẠN TỰ ĐỘNG (Celery)

**Chức năng:** Mỗi 1 giờ, Celery tự kiểm tra task quá hạn, gửi email cảnh báo (tránh gửi trùng 24h).  
**Celery Task:** `check_overdue_tasks_periodic()`  
**Lịch chạy:** Mỗi 1 giờ (Celery Beat)

**Luồng hoạt động:**
```
KHÔNG CẦN USER THAO TÁC — HỆ THỐNG TỰ CHẠY

Celery Beat (scheduler, chạy nền liên tục)
  │ Cấu hình: settings.py → CELERY_BEAT_SCHEDULE
  │ Lịch: mỗi 1 giờ (3600 giây)
  │ Task: "API.tasks.check_overdue_tasks_periodic"
  │
  │ Mỗi 1 giờ → Gửi message vào Redis queue
  ▼
Redis Queue (Message Broker)
  │ Queue chứa message: {task: "check_overdue_tasks_periodic", args: []}
  ▼
Celery Worker (consumer, chạy nền liên tục)
  │ Nhận message từ Redis → Thực thi function
  ▼
check_overdue_tasks_periodic() (API/tasks.py)
  │
  ├─ [Bước 1] Lấy thời gian:
  │   now = timezone.now()           ← VD: 2026-03-21 15:00
  │   threshold = now - timedelta(hours=24)  ← 2026-03-20 15:00
  │
  ├─ [Bước 2] Query task quá hạn:
  │   ▼ PostgreSQL: SELECT * FROM api_task
  │     WHERE due_date < '2026-03-21 15:00'   ← Đã quá hạn
  │     AND status IN ('TODO', 'INPR')        ← Chưa hoàn thành (bỏ qua DONE)
  │
  ├─ [Bước 3] Với MỖI task quá hạn → Lặp:
  │   │
  │   ├─ Kiểm tra đã gửi thông báo [QUÁ HẠN] trong 24h chưa (CHỐNG SPAM):
  │   │   ▼ PostgreSQL: SELECT 1 FROM api_notification
  │   │     WHERE title LIKE '%[QUÁ HẠN]%'
  │   │     AND task_id = 42
  │   │     AND created_at >= '2026-03-20 15:00'   ← threshold (24h trước)
  │   │   ├─ CÓ KẾT QUẢ (đã gửi < 24h) → BỎ QUA task này
  │   │   └─ KHÔNG CÓ (chưa gửi hoặc đã > 24h) → GỬI
  │   │
  │   ├─══ TASK DỰ ÁN (is_personal = False):
  │   │   │
  │   │   ├─ Lấy tất cả members:
  │   │   │   ▼ PostgreSQL: SELECT u.* FROM api_user u
  │   │   │     JOIN api_project_members pm ON u.id = pm.user_id
  │   │   │     WHERE pm.project_id = 10
  │   │   │
  │   │   ├─ Gửi email cho TỪNG member:
  │   │   │   │ send_overdue_task_notification(task, project, members)
  │   │   │   ▼ Template: emails/overdue_task.html
  │   │   │   ▼ Gmail SMTP → Subject: "[Cảnh báo] Công việc quá hạn: Fix bug login"
  │   │   │   ▼ Gửi cho: member1@gmail.com, member2@gmail.com, ...
  │   │   │
  │   │   └─ Tạo Notification cho từng member:
  │   │       ▼ PostgreSQL: INSERT INTO api_notification
  │   │         (recipient_id, title, message, project_id, task_id, is_read, created_at)
  │   │         VALUES (8, '[QUÁ HẠN] Fix bug login', 'Công việc...đã quá hạn', 10, 42, False, now)
  │   │         → title chứa "[QUÁ HẠN]" ← Dùng để check dedup 24h ở trên
  │   │
  │   └─══ TASK CÁ NHÂN (is_personal = True):
  │       │
  │       ├─ Gửi email cho creator duy nhất:
  │       │   │ send_personal_task_overdue_notification(task, creator)
  │       │   ▼ Template: emails/personal_task_overdue.html
  │       │   ▼ Gmail SMTP → Subject: "[Cảnh báo] Việc cá nhân quá hạn: Học React"
  │       │   ▼ To: trung@gmail.com
  │       │
  │       └─ Tạo 1 Notification:
  │           ▼ PostgreSQL: INSERT INTO api_notification
  │             (recipient_id=5, title='[QUÁ HẠN] Học React', ...)
  │
  └─ [Bước 4] Log kết quả:
      │ logger.info("Overdue check: 3 project tasks, 1 personal tasks emails sent")
      ▼
      Output ghi vào Celery worker console

═══ KẾT QUẢ ═══
User KHÔNG thao tác gì → Hệ thống tự:
  ├─ Gửi email cảnh báo quá hạn
  └─ Tạo notification (chuông đỏ khi user đăng nhập)
```

---

### 3.30. QUẢN TRỊ USER (Admin)

**Chức năng:** Admin quản lý tất cả user: xem, khóa/mở, cấp quyền, xóa.  
**API:** `GET/PATCH/DELETE /api/admin/users/`  
**Quyền:** IsAuthenticated + IsAdminUser (is_staff=True)

**Luồng hoạt động:**
```
═══ XEM DANH SÁCH ═══
Admin vào /admin/users
  │
  ▼
React Component (admin/users/page.tsx)
  │ gọi userService.adminGetAll()
  ▼
Service Layer → api.get("/admin/users/")
  ▼
Axios → JWT → HTTP GET
  │
  ▼
Django → AdminUserListView.get()
  ▼
Permission: IsAuthenticated + IsAdminUser
  │ ├─ is_staff == True → Cho phép
  │ └─ is_staff == False → 403 Forbidden
  ▼
PostgreSQL: SELECT * FROM api_user ORDER BY date_joined DESC
  ▼
Response: HTTP 200 + [{id, username, email, is_active, is_staff, date_joined}, ...]
  ▼
React Component → Render bảng user


═══ KHÓA TÀI KHOẢN ═══
Admin chọn user(8) → bấm "Khóa"
  │
  ▼
userService.adminUpdateUser(8, {is_active: false})
  ▼
Service Layer → api.patch("/admin/users/8/", {is_active: false})
  ▼
Django → AdminUserDetailView.partial_update(pk=8)
  ▼
Permission: IsAdminUser → OK
  ▼
AdminUserDetailView logic
  │ ├─ Khóa chính mình? (pk == request.user.id)
  │ │   → 400 "Không thể thay đổi quyền của chính mình"
  │ └─ User khác → OK
  ▼
PostgreSQL: UPDATE api_user SET is_active=False WHERE id=8
  ▼
Response: HTTP 200
  ▼
Hậu quả: User(8) đăng nhập lần sau:
  → CustomTokenObtainPairSerializer kiểm tra is_active
  → is_active=False → 400 "Tài khoản của bạn đã bị khóa"


═══ CẤP QUYỀN ADMIN ═══
api.patch("/admin/users/8/", {is_staff: true})
  ▼
PostgreSQL: UPDATE api_user SET is_staff=True WHERE id=8
  ▼
User(8) giờ:
  ├─ Xem được TẤT CẢ project/task
  ├─ Truy cập /admin/users
  └─ Tự động được thêm vào mọi dự án mới


═══ XÓA USER ═══
Admin bấm "Xóa" user(8)
  │
  ▼
userService.adminDeleteUser(8)
  ▼
Service Layer → api.delete("/admin/users/8/")
  ▼
Django → AdminUserDetailView.destroy(pk=8)
  ▼
Permission: IsAdminUser → OK
  ▼
AdminUserDetailView logic
  │ ├─ Xóa chính mình? → 400 "Không thể xóa chính mình"
  │ └─ OK → Tiếp
  ▼
PostgreSQL: DELETE FROM api_user WHERE id=8
  │ CASCADE:
  ├─ DELETE projects owned bởi user(8)
  │   └─ CASCADE: tasks, comments, attachments...
  ├─ DELETE FROM api_project_members WHERE user_id=8
  ├─ DELETE FROM api_comment WHERE author_id=8
  ├─ SET NULL: api_task.assignee_id WHERE assignee_id=8
  ├─ SET NULL: api_attachment.uploader_id WHERE uploader_id=8
  ├─ SET NULL: api_activitylog.actor_id WHERE actor_id=8
  ├─ DELETE FROM api_notification WHERE recipient_id=8
  └─ DELETE FROM api_passwordresettoken WHERE user_id=8
  ▼
Response: HTTP 204 No Content
  ▼
React Component → xóa user khỏi bảng
```

---

### 3.31. AUTO REFRESH JWT TOKEN (Luồng nền trên Frontend)

**Chức năng:** Tự động làm mới token khi hết hạn, user không bị gián đoạn.  
**File:** `frontend/src/lib/api.ts`

**Luồng hoạt động:**
```
KHÔNG CẦN USER THAO TÁC — AXIOS TỰ XỬ LÝ

User đang sử dụng hệ thống, access_token hết hạn (sau 30 phút)
  │
  ▼
User click bất kỳ nút nào → API call
  ▼
Axios gửi request + Header: Authorization: Bearer eyJ...(hết hạn)
  ▼
Django → JWTAuthentication → Token expired → 401 Unauthorized
  ▼
Axios Response Interceptor (lib/api.ts) bắt lỗi 401
  │
  ├─ [Bước 1] Lấy refresh_token:
  │   │ localStorage.getItem("refresh_token")
  │   ├─ KHÔNG CÓ → logout() → Redirect /login
  │   └─ CÓ → Tiếp
  │
  ├─ [Bước 2] Gọi API refresh:
  │   │ api.post("/token/refresh/", {refresh: "eyJ..."})
  │   ▼
  │   Django → TokenRefreshView (SimpleJWT built-in)
  │   │ Decode refresh_token → Chưa hết hạn (< 7 ngày)
  │   │ Tạo access_token MỚI (exp = now + 30min)
  │   ▼
  │   Response: 200 + {access: "eyJMỚI..."}
  │
  ├─ [Bước 3] Cập nhật token:
  │   │ localStorage.setItem("access_token", "eyJMỚI...")
  │   │ setCookie("access_token", "eyJMỚI...", 7)
  │
  └─ [Bước 4] RETRY request cũ:
      │ Gắn token mới vào request cũ
      │ Gửi lại request → Server nhận token mới → 200 OK
      ▼
User KHÔNG BIẾT GÌ — trải nghiệm liền mạch
```

---

### 3.32. MIDDLEWARE BẢO VỆ ROUTE (Luồng nền trên Frontend)

**Chức năng:** Tự động kiểm tra xác thực mỗi khi user chuyển trang.  
**File:** `frontend/src/middleware.ts`

**Luồng hoạt động:**
```
CHẠY TỰ ĐỘNG MỖI KHI USER CHUYỂN TRANG

User gõ URL hoặc click link
  │
  ▼
Next.js Middleware (middleware.ts)
  │ Chạy TRƯỚC khi render page
  │
  ├─ Đọc cookie "access_token" từ request
  │
  ├─ TRANG PUBLIC: /, /login, /signup, /forgot-password, /reset-password
  │   ├─ CÓ token (đã login) + vào /login hoặc /signup:
  │   │   → Redirect /dashboard (không cần login nữa)
  │   ├─ CÓ token + vào / (landing):
  │   │   → Redirect /dashboard
  │   └─ KHÔNG CÓ token:
  │       → NextResponse.next() (cho phép vào trang public)
  │
  └─ TRANG PROTECTED: /dashboard, /my-projects, /my-tasks, /projects/*, /admin/users, /profile
      ├─ CÓ token → NextResponse.next() (cho phép)
      └─ KHÔNG CÓ token:
          → Redirect /login?redirect=/my-projects
          → Sau khi login → redirect về trang cũ
```

---

## 4. QUẢN TRỊ HỆ THỐNG

### 4.1. Phân quyền (4 cấp độ)

| Vai trò | Quyền hạn |
|---|---|
| **Admin** (`is_staff=True`) | Xem tất cả project/task, quản lý user (khóa/mở/xóa), tự động được thêm vào mọi dự án mới |
| **Project Owner** | CRUD project, thêm/xóa member, giao task (đổi assignee), xóa task/comment/attachment của bất kỳ ai |
| **Project Member** | Xem task, tạo task, sửa status/priority/description/due_date, comment, upload file. KHÔNG được đổi assignee, KHÔNG được xóa task |
| **Task Creator** (cá nhân) | Toàn quyền trên task cá nhân của mình, không ai khác thấy |

### 4.2. Hệ thống email tự động

| STT | Sự kiện | Template email | Người nhận |
|---|---|---|---|
| 1 | Giao task mới | `task_assigned.html` | Assignee |
| 2 | Mời vào dự án | `project_invitation.html` | User được mời |
| 3 | Đổi deadline task | `task_due_date_changed.html` | Tất cả member |
| 4 | Comment mới | `task_comment.html` | Assignee + Creator |
| 5 | Xóa task | `task_deleted.html` | Tất cả member |
| 6 | Đổi trạng thái task | `task_status_changed.html` | Tất cả member |
| 7 | Xóa thành viên | `member_removed.html` | User bị xóa |
| 8 | Task dự án quá hạn | `overdue_task.html` | Tất cả member |
| 9 | Task cá nhân quá hạn | `personal_task_overdue.html` | Creator |

### 4.3. Bộ lọc dữ liệu

| Filter | Trường lọc | VD |
|---|---|---|
| TaskFilter | status, priority, assignee (me/id), due_date range, search (title) | `?status=TODO&priority=HIGH&assignee=me&search=fix` |
| ProjectFilter | name (search), role (owner/member) | `?search=CG&role=owner` |
| UserFilter | username, email | `?search=trung` |

---

## 5. CÁC TRANG GIAO DIỆN

| Trang | URL | File |
|---|---|---|
| Trang chủ (Landing) | `/` | `frontend/src/app/page.tsx` |
| Đăng nhập | `/login` | `frontend/src/app/(auth)/login/page.tsx` |
| Đăng ký | `/signup` | `frontend/src/app/(auth)/signup/page.tsx` |
| Quên mật khẩu | `/forgot-password` | `frontend/src/app/(auth)/forgot-password/page.tsx` |
| Đặt lại mật khẩu | `/reset-password` | `frontend/src/app/(auth)/reset-password/page.tsx` |
| Dashboard | `/dashboard` | `frontend/src/app/(main)/dashboard/page.tsx` |
| Dự án của tôi | `/my-projects` | `frontend/src/app/(main)/my-projects/page.tsx` |
| Task cá nhân | `/my-tasks` | `frontend/src/app/(main)/my-tasks/page.tsx` |
| Board dự án (Kanban) | `/projects/{id}` | `frontend/src/app/(main)/projects/[id]/page.tsx` |
| Hồ sơ cá nhân | `/profile` | `frontend/src/app/(main)/profile/page.tsx` |
| Quản lý user (Admin) | `/admin/users` | `frontend/src/app/(main)/admin/users/page.tsx` |

---

## 6. LỆNH PHÁT TRIỂN

```bash
# Backend
cd d:\TaskManagementSystem_DoAn
.\env\Scripts\Activate.ps1                                # Kích hoạt virtual environment
python manage.py runserver                                 # Chạy backend (port 8000)
python manage.py makemigrations                            # Tạo migration sau khi sửa models
python manage.py migrate                                   # Áp dụng migration vào DB
celery -A TaskManagementSystem worker -l info              # Chạy Celery worker
celery -A TaskManagementSystem beat -l info                # Chạy Celery beat (scheduler)

# Frontend
cd frontend
npm install                                                # Cài dependencies
npm run dev                                                # Chạy frontend (port 3000)
npm run build                                              # Build production

# API Documentation
# Truy cập: http://localhost:8000/api/docs/
```

---

## 7. TỔNG KẾT LUỒNG TỔNG QUÁT

```
Client (React/Next.js)
  → Service Layer (Axios + JWT auto-attach)
  → HTTP Request (GET/POST/PATCH/DELETE)
  → Django URL Router (urls.py)
  → View (views.py — xử lý logic)
  → Permission (permissions.py — phân quyền)
  → Serializer (serializers.py — validate + transform)
  → Model (models.py — DB query)
  → Database (PostgreSQL)
  → [Email Utils nếu cần] (email_utils.py → Gmail SMTP)
  → [Notification nếu cần] (tạo record trong DB)
  → [ActivityLog nếu cần] (ghi lịch sử)
  → Response JSON
  → Axios nhận
  → Component render UI
  → [Celery chạy nền kiểm tra quá hạn mỗi giờ]
```
