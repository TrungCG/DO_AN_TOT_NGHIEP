# BÀI THUYẾT TRÌNH DEMO SẢN PHẨM
# HỆ THỐNG QUẢN LÝ CÔNG VIỆC VÀ DỰ ÁN TRÊN NỀN TẢNG WEB
## (Task Management System)

---

## 📋 MỤC LỤC THUYẾT TRÌNH

| STT | Nội dung | Thời gian |
|-----|----------|-----------|
| 1 | Giới thiệu đề tài & Bối cảnh | 3 phút |
| 2 | Mục tiêu & Phạm vi | 2 phút |
| 3 | Công nghệ sử dụng | 3 phút |
| 4 | Kiến trúc hệ thống | 3 phút |
| 5 | Thiết kế cơ sở dữ liệu (ERD) | 3 phút |
| 6 | DEMO các chức năng chính | 15 phút |
| 7 | Những điểm nổi bật & Kỹ thuật đáng chú ý | 3 phút |
| 8 | Kết luận & Hướng phát triển | 3 phút |
| **Tổng** | | **~35 phút** |

---

## SLIDE 1: TRANG BÌA

```
ĐỒ ÁN TỐT NGHIỆP

HỆ THỐNG QUẢN LÝ CÔNG VIỆC VÀ DỰ ÁN TRÊN NỀN TẢNG WEB
(Task Management System)

Sinh viên thực hiện: [Họ tên]
MSSV: [Mã số]
Giảng viên hướng dẫn: [Họ tên GVHD]
Ngành: [Tên ngành]
Khóa: [Khóa]
```

---

## SLIDE 2: ĐẶT VẤN ĐỀ & BỐI CẢNH

### Thực trạng hiện nay:
- Trong môi trường làm việc hiện đại, **quản lý công việc và cộng tác nhóm** là nhu cầu thiết yếu
- Các vấn đề thường gặp:
  - ❌ Phân công công việc bằng **email, tin nhắn rời rạc** → dễ bỏ sót
  - ❌ **Không theo dõi được tiến độ** thực tế của từng task
  - ❌ **Thiếu hệ thống thông báo** khi có thay đổi → phản ứng chậm
  - ❌ **Không có lịch sử hoạt động** → khó truy vết khi có vấn đề
  - ❌ Công cụ nước ngoài (Trello, Jira, Asana) **giá cao**, rào cản ngôn ngữ

### Nhu cầu thị trường:
- Doanh nghiệp vừa và nhỏ cần giải pháp quản lý công việc **đơn giản, hiệu quả, chi phí thấp**
- Sinh viên, nhóm dự án cần công cụ **cộng tác nhóm** trực quan

### → Giải pháp: Xây dựng **Task Management System** — một hệ thống quản lý công việc toàn diện trên nền tảng Web

---

## SLIDE 3: MỤC TIÊU DỰ ÁN

### Mục tiêu chính:
1. **Xây dựng hệ thống quản lý công việc Full-stack** hoàn chỉnh từ Backend đến Frontend
2. **Áp dụng kiến trúc RESTful API** chuẩn công nghiệp
3. **Tích hợp bảo mật JWT** và hệ thống phân quyền chặt chẽ
4. **Mô phỏng nghiệp vụ thực tế** của các công cụ chuyên nghiệp (Trello, Jira, Asana)

### Mục tiêu kỹ thuật:
- ✅ Backend API hoàn chỉnh với Django REST Framework
- ✅ Frontend SPA hiện đại với Next.js 14 + TypeScript
- ✅ Giao diện Kanban Board kéo thả trực quan
- ✅ Hệ thống email thông báo tự động (Celery + Redis)
- ✅ Đăng nhập Google OAuth2
- ✅ Hỗ trợ Dark/Light mode và đa ngôn ngữ (i18n)

---

## SLIDE 4: PHẠM VI ĐỀ TÀI

### Các chức năng chính:

| Module | Chức năng |
|--------|-----------|
| **Xác thực** | Đăng ký, Đăng nhập (JWT), Google OAuth2, Quên/Đặt lại mật khẩu |
| **Quản lý dự án** | CRUD dự án, Thêm/Xóa thành viên, Phân quyền Owner/Member |
| **Quản lý công việc** | Task dự án + Task cá nhân, Kanban Board, Lọc & Tìm kiếm |
| **Cộng tác** | Bình luận trên Task, Đính kèm file, Giao việc cho thành viên |
| **Thông báo** | Thông báo in-app, Email tự động, Cảnh báo task quá hạn |
| **Nhật ký hoạt động** | Ghi nhận mọi thao tác, Theo dõi lịch sử dự án/task |
| **Quản trị** | Admin quản lý user (khóa/mở khóa, phân quyền) |
| **Giao diện** | Dark/Light mode, Đa ngôn ngữ, Responsive, Nhiều chế độ xem |

### Đối tượng sử dụng:
- **Quản lý dự án (Owner)**: Tạo dự án, phân công, theo dõi tiến độ
- **Thành viên nhóm (Member)**: Nhận task, cập nhật tiến độ, bình luận
- **Cá nhân**: Quản lý task cá nhân riêng tư
- **Quản trị viên (Admin)**: Quản lý toàn bộ hệ thống

---

## SLIDE 5: CÔNG NGHỆ SỬ DỤNG

### Kiến trúc tổng quan: **Full-stack Web Application**

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Client)                       │
│         Next.js 14 + TypeScript + React 18                  │
│         shadcn/ui + Tailwind CSS + @dnd-kit                 │
│         Axios (HTTP Client) + React Hook Form               │
└──────────────────────────┬──────────────────────────────────┘
                           │ RESTful API (JSON)
                           │ JWT Authentication
┌──────────────────────────▼──────────────────────────────────┐
│                     BACKEND (Server)                        │
│         Django 5.2 + Django REST Framework 3.16             │
│         SimpleJWT + Google OAuth2 + drf-spectacular          │
│         django-filter + django-cors-headers                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │  Gmail SMTP  │
│  (Database)  │  │  (Message    │  │  (Email      │
│              │  │   Broker)    │  │   Service)   │
└──────────────┘  └──────┬───────┘  └──────────────┘
                         │
                  ┌──────▼───────┐
                  │   Celery     │
                  │ (Background  │
                  │   Tasks)     │
                  └──────────────┘
```

### Chi tiết công nghệ:

| Tầng | Công nghệ | Lý do chọn |
|------|-----------|------------|
| **Frontend** | Next.js 14 + TypeScript | SSR/CSR linh hoạt, Type-safe, hiệu năng cao |
| **UI Library** | shadcn/ui + Tailwind CSS | Component đẹp, tùy chỉnh cao, responsive |
| **Drag & Drop** | @dnd-kit | Thư viện kéo thả hiện đại, nhẹ, accessible |
| **Backend** | Django 5.2 + DRF 3.16 | Framework Python mạnh mẽ, bảo mật, rapid development |
| **Database** | PostgreSQL 15 | RDBMS mạnh mẽ, hỗ trợ JSON, full-text search |
| **Authentication** | JWT (SimpleJWT) | Stateless auth, phù hợp SPA, tích hợp refresh token |
| **Social Login** | Google OAuth2 | UX tốt, giảm rào cản đăng ký |
| **Task Queue** | Celery + Redis | Xử lý background job (email, kiểm tra quá hạn) |
| **Email** | Gmail SMTP | Template HTML đẹp, gửi thông báo tự động |
| **API Docs** | drf-spectacular (Swagger) | Tự động generate API docs chuẩn OpenAPI 3.0 |
| **Containerization** | Docker Compose | Đóng gói database, dễ triển khai |

---

## SLIDE 6: KIẾN TRÚC HỆ THỐNG

### Luồng hoạt động chính:

```
┌────────────┐     HTTP Request      ┌──────────────┐
│            │ ──────────────────────→│              │
│  Browser   │     (Axios + JWT)      │  Django REST │
│  (Next.js) │ ←──────────────────────│  Framework   │
│            │     JSON Response      │              │
└────────────┘                        └──────┬───────┘
                                             │
                    ┌────────────────────────┬┼────────────────────────┐
                    │                        ││                        │
              ┌─────▼─────┐          ┌───────▼▼──────┐         ┌──────▼──────┐
              │ Permission│          │   Serializer   │         │   Model     │
              │  Check    │          │ (Validate &    │         │ (Database   │
              │           │          │  Transform)    │         │   Query)    │
              └───────────┘          └────────────────┘         └─────────────┘
```

### Kiến trúc Backend (MVC Pattern):

| Layer | File | Vai trò |
|-------|------|---------|
| **URL Router** | `urls.py` | Định tuyến request đến đúng View |
| **View (Controller)** | `views.py` | Xử lý business logic |
| **Serializer** | `serializers.py` | Validate input, transform output (JSON ↔ Object) |
| **Model** | `models.py` | Định nghĩa cấu trúc dữ liệu, tương tác database |
| **Permission** | `permissions.py` | Kiểm tra quyền truy cập (RBAC) |
| **Filter** | `filters.py` | Lọc và tìm kiếm dữ liệu |
| **Email Utils** | `email_utils.py` | Gửi email thông báo (HTML template) |
| **Celery Tasks** | `tasks.py` | Xử lý tác vụ nền (kiểm tra quá hạn) |

### Kiến trúc Frontend (Component-Based):

| Layer | Thư mục | Vai trò |
|-------|---------|---------|
| **Pages** | `app/` | Các trang (Next.js file-based routing) |
| **Components** | `components/` | UI components tái sử dụng |
| **Services** | `services/` | Gọi API từ backend |
| **Types** | `types/` | TypeScript interfaces |
| **Hooks** | `hooks/` | Custom React hooks |
| **Lib** | `lib/` | Utilities, config, i18n |

---

## SLIDE 7: THIẾT KẾ CƠ SỞ DỮ LIỆU (ERD)

### Sơ đồ quan hệ thực thể:

**8 thực thể chính:**

| Thực thể | Vai trò | Quan hệ chính |
|----------|---------|---------------|
| **User** | Người dùng hệ thống | AbstractUser (Django built-in) |
| **Project** | Dự án | Owner (1-N), Members (M-N) |
| **Task** | Công việc | Thuộc Project hoặc Personal |
| **Comment** | Bình luận | Thuộc Task, viết bởi User |
| **Attachment** | File đính kèm | Thuộc Task, upload bởi User |
| **ActivityLog** | Nhật ký hoạt động | Ghi nhận action trên Project/Task |
| **Notification** | Thông báo | Gửi cho User, liên quan Project/Task |
| **PasswordResetToken** | Token reset mật khẩu | Thuộc User, có thời hạn |

### Các quan hệ quan trọng:

```
User ──(1:N)──→ Project (owner)
User ──(M:N)──→ Project (members)
Project ──(1:N)──→ Task
User ──(1:N)──→ Task (created_by)
User ──(1:N)──→ Task (assignee)
Task ──(1:N)──→ Comment
Task ──(1:N)──→ Attachment
Task ──(1:N)──→ ActivityLog
User ──(1:N)──→ Notification
```

### Thiết kế Task linh hoạt:
- `is_personal = True` → Task cá nhân (không thuộc project)
- `is_personal = False` → Task dự án (bắt buộc có project)
- `project` cho phép `null` → Hỗ trợ cả 2 loại task trong 1 model

---

## SLIDE 8–22: DEMO CÁC CHỨC NĂNG CHÍNH

---

### 🔐 DEMO 1: XÁC THỰC NGƯỜI DÙNG (AUTHENTICATION)

**[Mở trình duyệt → Truy cập http://localhost:3000]**

#### 1.1. Trang Landing Page
> "Đây là trang chủ của hệ thống, được thiết kế responsive với giao diện modern. User chưa đăng nhập sẽ thấy trang giới thiệu sản phẩm."

#### 1.2. Đăng ký tài khoản
> **Thao tác:** Nhấn "Đăng ký" → Nhập username, email, password

**Điểm kỹ thuật cần nhấn mạnh:**
- ✅ Validate phía **Frontend** (React Hook Form + Zod): kiểm tra format email, độ dài password
- ✅ Validate phía **Backend** (DRF Serializer): kiểm tra trùng username/email
- ✅ Password được **hash** bằng Django's PBKDF2 (không lưu plaintext)
- ✅ Trả về JWT token ngay sau đăng ký (auto login)

#### 1.3. Đăng nhập
> **Thao tác:** Nhập username + password → Đăng nhập

**Điểm kỹ thuật:**
- ✅ Sử dụng **JWT (JSON Web Token)** — access token (30 phút) + refresh token (7 ngày)
- ✅ Token lưu trong **cookies** (HttpOnly) cho middleware kiểm tra
- ✅ Axios interceptor **tự động refresh** token khi access_token hết hạn
- ✅ `is_staff` được embed vào JWT payload → phân biệt admin/user

#### 1.4. Đăng nhập Google OAuth2
> **Thao tác:** Nhấn nút "Đăng nhập bằng Google"

**Luồng hoạt động:**
```
User chọn Google → Google OAuth consent → Nhận ID Token
→ Frontend gửi token → Backend verify với Google API
→ Tạo/tìm User → Trả JWT token → Tự động đăng nhập
```

**Điểm hay:**
- Nếu email Google đã tồn tại → link vào account cũ
- Nếu chưa có → tạo account mới (random password)
- User Google có thể **đặt mật khẩu** sau (SetPasswordView)

#### 1.5. Quên mật khẩu
> **Thao tác:** Nhấn "Quên mật khẩu" → Nhập email → Kiểm tra email

**Điểm bảo mật:**
- ✅ Token reset dùng **UUID4** (không đoán được)
- ✅ Token có **thời hạn** (expires_at)
- ✅ Token chỉ **dùng 1 lần** (is_used)
- ✅ Không tiết lộ email có tồn tại hay không (chống enumeration)
- ✅ Email gửi bằng **HTML template** đẹp mắt

---

### 📁 DEMO 2: QUẢN LÝ DỰ ÁN (PROJECT MANAGEMENT)

**[Chuyển sang trang Dashboard]**

#### 2.1. Dashboard
> "Sau khi đăng nhập, user thấy Dashboard hiển thị tổng quan các dự án đang tham gia."

**Điểm cần chỉ ra:**
- Card dự án hiển thị: tên, mô tả, số thành viên, vai trò (Owner/Member)
- Sidebar điều hướng với các menu chức năng
- Chuông thông báo (Notification Bell) ở header
- Mục truy cập gần đây (Recent Items)

#### 2.2. Tạo dự án mới
> **Thao tác:** Nhấn "Tạo dự án" → Nhập tên + mô tả → Lưu

**Điểm kỹ thuật:**
- ✅ User tạo dự án tự động trở thành **Owner**
- ✅ Owner tự động được thêm vào **members list**
- ✅ Chỉ Owner mới có quyền **sửa/xóa** dự án
- ✅ ActivityLog ghi nhận "Tạo dự án"

#### 2.3. Thêm thành viên vào dự án
> **Thao tác:** Mở Dialog "Thêm thành viên" → Tìm kiếm user → Chọn → Thêm

**Điểm kỹ thuật:**
- ✅ Tìm kiếm user theo **username hoặc email**
- ✅ Không cho thêm user đã là thành viên
- ✅ Gửi **email thông báo lời mời** cho member mới (HTML template)
- ✅ Tạo **Notification** in-app
- ✅ Ghi nhận vào **ActivityLog**

#### 2.4. Xóa thành viên
> **Thao tác:** Mở cài đặt dự án → Chọn thành viên → Xóa

**Điểm kỹ thuật:**
- ✅ Chỉ **Owner** mới có quyền xóa thành viên
- ✅ Owner **không thể tự xóa mình**
- ✅ Gửi **email thông báo** cho người bị xóa
- ✅ Task được giao cho member bị xóa → assignee reset về null

---

### ✅ DEMO 3: QUẢN LÝ CÔNG VIỆC (TASK MANAGEMENT) — *PHẦN QUAN TRỌNG NHẤT*

**[Chuyển sang trang Board dự án]**

#### 3.1. Kanban Board — Giao diện kéo thả
> "Đây là tính năng cốt lõi — bảng Kanban giống Trello với 3 cột: TODO, IN PROGRESS, DONE"

**Thao tác demo:**
1. Tạo task mới → điền tiêu đề, mô tả, ưu tiên, ngày hết hạn, người được giao
2. **Kéo task** từ TODO → IN PROGRESS → DONE
3. Xem thay đổi status tự động

**Điểm kỹ thuật nổi bật:**
- ✅ Sử dụng **@dnd-kit** (thư viện kéo thả hàng đầu của React)
- ✅ Kéo thả task **giữa các cột** → tự động update status qua API
- ✅ Giao diện **responsive** — hoạt động trên mobile
- ✅ Mỗi lần thay đổi status → gửi **email thông báo** cho assignee
- ✅ Ghi nhận vào **ActivityLog**

#### 3.2. Nhiều chế độ xem (View Modes)
> **Thao tác:** Chuyển đổi giữa các chế độ xem

| Chế độ xem | Mô tả | Use case |
|------------|--------|----------|
| **Kanban Board** | Bảng kéo thả (mặc định) | Quản lý workflow trực quan |
| **List View** | Dạng bảng danh sách | Xem tổng quát nhiều task |
| **Timeline View** | Dạng timeline/Gantt | Theo dõi lịch trình |
| **Member Board** | Nhóm theo thành viên | Xem workload từng người |

#### 3.3. Tạo Task với đầy đủ thông tin
> **Thao tác:** Nhấn "Tạo task" → Điền form

**Các trường thông tin:**
- 📝 **Tiêu đề** (bắt buộc)
- 📄 **Mô tả** (tùy chọn)
- 📊 **Trạng thái**: TODO / IN_PROGRESS / DONE
- 🔥 **Độ ưu tiên**: LOW (xanh) / MEDIUM (vàng) / HIGH (đỏ)
- 📅 **Ngày bắt đầu** + **Ngày hết hạn**
- 👤 **Người được giao** (chọn từ members)

**Khi tạo task và giao cho ai đó:**
- ✅ Gửi **email thông báo "Task Assigned"** cho assignee
- ✅ Tạo **Notification** in-app
- ✅ Ghi vào **ActivityLog**: "User A đã tạo task XYZ"

#### 3.4. Task cá nhân (Personal Tasks)
> **Thao tác:** Chuyển sang trang "Task cá nhân" (My Tasks)

**Điểm khác biệt với Task dự án:**
- ✅ Không thuộc project nào (`project = null, is_personal = true`)
- ✅ Chỉ người tạo mới thấy và quản lý
- ✅ Có Kanban Board riêng
- ✅ Hỗ trợ đầy đủ: lọc, tìm kiếm, thay đổi status

#### 3.5. Bộ lọc & Tìm kiếm (Task Filters)
> **Thao tác:** Sử dụng thanh lọc trên board

**Các filter có sẵn:**
- 🔍 **Tìm kiếm** theo tiêu đề task
- 📊 **Lọc theo status**: TODO, IN_PROGRESS, DONE
- 🔥 **Lọc theo priority**: LOW, MEDIUM, HIGH
- 👤 **Lọc theo assignee**: "Assigned to me" hoặc chọn người cụ thể
- 📅 **Lọc theo due_date**: Range ngày

**Điểm kỹ thuật:**
- Backend sử dụng **django-filter** → query tối ưu
- Frontend lưu filter state → giữ khi chuyển trang

#### 3.6. Chi tiết Task (Task Detail Modal)
> **Thao tác:** Click vào task → Mở modal chi tiết

**Trong modal hiển thị:**
- Thông tin đầy đủ của task
- Tab **Bình luận** (Comments)
- Tab **File đính kèm** (Attachments)
- Tab **Lịch sử hoạt động** (Activity Log)
- Nút **Sửa** / **Xóa** task

---

### 💬 DEMO 4: BÌNH LUẬN & FILE ĐÍNH KÈM

#### 4.1. Bình luận trên Task
> **Thao tác:** Mở task → Viết bình luận → Gửi

**Điểm kỹ thuật:**
- ✅ Khi có comment mới → gửi **email thông báo** cho:
  - Assignee (người được giao)
  - Creator (người tạo task)
  - Project Owner
- ✅ Chỉ **tác giả** hoặc **Project Owner** mới được sửa/xóa comment
- ✅ Hiển thị avatar + tên + thời gian comment

#### 4.2. File đính kèm
> **Thao tác:** Upload file vào task

**Điểm kỹ thuật:**
- ✅ Hỗ trợ **nhiều loại file** (image, document, pdf...)
- ✅ Lưu vào thư mục `attachments/` trên server
- ✅ Chỉ **người upload** hoặc **Project Owner** mới được xóa

---

### 🔔 DEMO 5: HỆ THỐNG THÔNG BÁO (NOTIFICATIONS)

#### 5.1. Thông báo In-App
> **Thao tác:** Click vào chuông thông báo ở header

**Hiển thị:**
- Danh sách thông báo (mới nhất lên đầu)
- Badge **số thông báo chưa đọc**
- Click vào thông báo → đánh dấu đã đọc
- Nút "Đánh dấu tất cả đã đọc"

**Các loại thông báo:**

| Sự kiện | Người nhận | Nội dung |
|---------|-----------|----------|
| Task được giao | Assignee | "Bạn được giao task XYZ" |
| Thêm vào dự án | New Member | "Bạn được mời vào dự án ABC" |
| Deadline thay đổi | Assignee | "Deadline task XYZ đã thay đổi" |
| Comment mới | Liên quan | "User A đã bình luận trên task XYZ" |
| Task bị xóa | Assignee | "Task XYZ đã bị xóa" |
| Status thay đổi | Assignee | "Task XYZ chuyển sang DONE" |
| Bị xóa khỏi dự án | Member | "Bạn đã bị xóa khỏi dự án ABC" |
| Task quá hạn | All Members | "Task XYZ đã quá hạn" |

#### 5.2. Email thông báo tự động
> **Thao tác:** Mở email → Show các email nhận được

**Điểm kỹ thuật nổi bật:**
- ✅ Email sử dụng **HTML template** đẹp mắt (9 template riêng biệt)
- ✅ Gửi qua **Gmail SMTP** (cấu hình App Password)
- ✅ Xử lý **bất đồng bộ** → không block request chính

#### 5.3. Kiểm tra Task quá hạn tự động (Celery)
> **Giải thích:** Hệ thống tự động kiểm tra task quá hạn

**Luồng hoạt động:**
```
Celery Beat (Scheduler) → Mỗi 1 giờ trigger
  → Celery Worker thực thi check_overdue_tasks_periodic()
    → Query Task: due_date < now AND status != DONE
    → Kiểm tra đã gửi notification trong 24h chưa? (tránh spam)
    → Gửi email + tạo Notification in-app
```

**Điểm kỹ thuật:**
- ✅ Sử dụng **Celery Beat** chạy periodic task mỗi giờ
- ✅ **Redis** làm message broker
- ✅ Thông minh: **tránh gửi trùng** trong 24h (check Notification history)
- ✅ Xử lý cả **task dự án** và **task cá nhân**

---

### 📊 DEMO 6: NHẬT KÝ HOẠT ĐỘNG (ACTIVITY LOG)

> **Thao tác:** Mở Dialog "Lịch sử hoạt động" trong dự án

**Ghi nhận các sự kiện:**
- Tạo/sửa/xóa task
- Thêm/xóa thành viên
- Thay đổi trạng thái task
- Tạo bình luận
- Upload/xóa file đính kèm
- Thay đổi deadline

**Điểm kỹ thuật:**
- ✅ Mỗi ActivityLog ghi: **ai** làm **gì**, trên **task nào**, **khi nào**
- ✅ Xem theo **dự án** hoặc theo **từng task**
- ✅ Sắp xếp theo **thời gian giảm dần** (mới nhất lên đầu)

---

### 🛡️ DEMO 7: PHÂN QUYỀN (PERMISSIONS)

> **Thao tác:** Demo bằng cách đăng nhập các tài khoản khác nhau

#### Bảng phân quyền chi tiết:

| Hành động | Owner | Member | Assignee | Không phải thành viên |
|-----------|-------|--------|----------|-----------------------|
| Xem dự án | ✅ | ✅ | — | ❌ |
| Sửa/Xóa dự án | ✅ | ❌ | — | ❌ |
| Thêm/Xóa thành viên | ✅ | ❌ | — | ❌ |
| Tạo task | ✅ | ✅ | — | ❌ |
| Sửa task | ✅ | ✅ | ✅ | ❌ |
| Xóa task | ✅ | ❌ | ❌ | ❌ |
| Giao task (assign) | ✅ | ❌ | ❌ | ❌ |
| Bình luận | ✅ | ✅ | ✅ | ❌ |
| Sửa/Xóa bình luận | Tác giả + Owner | Tác giả | Tác giả | ❌ |
| Upload file | ✅ | ✅ | ✅ | ❌ |
| Xóa file | Uploader + Owner | Uploader | Uploader | ❌ |

**Điểm kỹ thuật:**
- ✅ Phân quyền tại **Backend** (Permission classes) — không phụ thuộc Frontend
- ✅ Admin (`is_staff=True`) có **full quyền** trên mọi resource
- ✅ Sử dụng pattern **RBAC** (Role-Based Access Control)

---

### 👤 DEMO 8: QUẢN LÝ HỒ SƠ CÁ NHÂN & ADMIN

#### 8.1. Hồ sơ cá nhân
> **Thao tác:** Vào trang Profile → Sửa thông tin

- Cập nhật họ tên, email
- Đổi mật khẩu
- User Google: có thể đặt mật khẩu

#### 8.2. Trang Admin quản lý User
> **Thao tác:** Đăng nhập bằng tài khoản Admin → Vào trang quản lý user

**Chức năng Admin:**
- ✅ Xem **danh sách tất cả** user
- ✅ **Khóa/Mở khóa** tài khoản (`is_active`)
- ✅ **Phân quyền Admin** cho user khác (`is_staff`)
- ✅ Chỉ user có `is_staff = True` mới truy cập được

---

### 🌙 DEMO 9: GIAO DIỆN & TRẢI NGHIỆM (UI/UX)

#### 9.1. Dark Mode / Light Mode
> **Thao tác:** Nhấn nút đổi theme

- ✅ Sử dụng **next-themes** + Tailwind dark mode
- ✅ Lưu preference vào **localStorage**

#### 9.2. Đa ngôn ngữ (i18n)
> **Thao tác:** Nhấn nút đổi ngôn ngữ (VN ↔ EN)

- ✅ Hỗ trợ **Tiếng Việt** và **Tiếng Anh**
- ✅ Custom i18n system (không dùng thư viện nặng)

#### 9.3. Responsive Design
> **Thao tác:** Mở DevTools → Đổi kích thước màn hình

- ✅ Hoạt động tốt trên **Desktop, Tablet, Mobile**
- ✅ Sidebar **ẩn tự động** trên mobile
- ✅ Kanban board **cuộn ngang** trên mobile

---

## SLIDE 23: NHỮNG ĐIỂM NỔI BẬT & KỸ THUẬT ĐÁNG CHÚ Ý

### 1. Kiến trúc Clean & Maintainable
- ✅ Tách biệt rõ ràng **Frontend / Backend / Database**
- ✅ RESTful API chuẩn (đúng HTTP method, status code)
- ✅ Code có **documentation** đầy đủ (Swagger auto-gen)

### 2. Bảo mật chặt chẽ (Security)
- ✅ JWT Authentication — không lưu session trên server
- ✅ CORS configured — chỉ cho phép frontend origin
- ✅ Permission class — phân quyền tại backend (không tin frontend)
- ✅ Password hashing (PBKDF2) — không lưu plaintext
- ✅ Token reset dùng UUID4 + thời hạn + dùng 1 lần
- ✅ Middleware bảo vệ route — chuyển hướng nếu chưa đăng nhập

### 3. Email System chuyên nghiệp
- ✅ **9 template HTML** cho 9 loại sự kiện khác nhau
- ✅ Gửi email **bất đồng bộ** qua Celery (bao gồm cả việc kiểm tra quá hạn)
- ✅ **Tránh spam**: check thông báo gần nhất trong 24h

### 4. Background Processing (Celery + Redis)
- ✅ Kiểm tra task quá hạn **tự động mỗi giờ**
- ✅ Xử lý cả task dự án và task cá nhân
- ✅ Scalable: có thể thêm worker khi cần

### 5. Frontend hiện đại
- ✅ TypeScript — **type-safe**, ít bug runtime
- ✅ shadcn/ui — component đẹp, accessible, tùy chỉnh cao
- ✅ @dnd-kit — kéo thả mượt mà, hỗ trợ touch
- ✅ Axios interceptor — tự động refresh token, xử lý lỗi

### 6. So sánh với các sản phẩm tương tự

| Tính năng | Hệ thống này | Trello (Free) | Jira (Free) |
|-----------|-------------|---------------|-------------|
| Kanban Board | ✅ | ✅ | ✅ |
| Task cá nhân | ✅ | ❌ | ❌ |
| Email thông báo | ✅ | ❌ (trả phí) | ✅ (giới hạn) |
| Kiểm tra quá hạn tự động | ✅ | ❌ | ❌ |
| Timeline View | ✅ | ❌ (trả phí) | ✅ |
| Đa ngôn ngữ (Vi/En) | ✅ | ❌ | ❌ |
| Dark Mode | ✅ | ❌ | ❌ |
| Google OAuth | ✅ | ✅ | ✅ |
| Hoàn toàn miễn phí | ✅ | Giới hạn | Giới hạn |
| Tự host (Self-hosted) | ✅ | ❌ | ❌ |

---

## SLIDE 24: KẾT LUẬN

### Kết quả đạt được:
- ✅ Xây dựng **Full-stack web application** hoàn chỉnh từ thiết kế đến triển khai
- ✅ Backend API **40+ endpoints** RESTful chuẩn công nghiệp
- ✅ Frontend **11 trang**, **30+ components** UI hiện đại
- ✅ Hệ thống phân quyền **8 Permission classes** chặt chẽ
- ✅ **9 email templates** HTML chuyên nghiệp
- ✅ Background job processing với **Celery + Redis**
- ✅ Tích hợp **Google OAuth2**, **JWT Authentication**
- ✅ Giao diện **Dark/Light mode**, **đa ngôn ngữ**, **responsive**

### Hạn chế:
- Chưa có **real-time notification** (WebSocket)
- Chưa có chức năng **chat** nhóm/cá nhân
- Chưa optimize cho **high traffic** (chưa caching, chưa pagination tối ưu)

### Hướng phát triển:
1. 🔌 **WebSocket** — thông báo real-time (Django Channels)
2. 💬 **Chat System** — chat nhóm + Direct Message
3. 📱 **Mobile App** — React Native / Flutter
4. 📊 **Dashboard Analytics** — biểu đồ thống kê dự án
5. 🔐 **2FA** — xác thực hai yếu tố
6. ☁️ **Cloud Deployment** — AWS/GCP/Azure với CI/CD

---

## SLIDE 25: CẢM ƠN & HỎI ĐÁP

```
CẢM ƠN QUÝ THẦY/CÔ ĐÃ LẮNG NGHE!

Em xin sẵn sàng trả lời các câu hỏi.
```

---

---

# 📌 PHỤ LỤC: CÂU HỎI PHẢN BIỆN DỰ KIẾN & CÁCH TRẢ LỜI

## Câu hỏi 1: "Tại sao chọn Django + Next.js mà không dùng các framework khác?"

> **Trả lời:**
> - **Django**: Framework Python mạnh mẽ nhất cho web, có ORM tốt, bảo mật built-in (CSRF, XSS, SQL Injection protection), admin panel, và hệ sinh thái packages phong phú. DRF (Django REST Framework) là chuẩn công nghiệp cho RESTful API.
> - **Next.js 14**: Framework React hàng đầu, hỗ trợ Server-Side Rendering (SSR), file-based routing đơn giản, TypeScript native, và hiệu năng tối ưu. Được Vercel phát triển, cộng đồng lớn.
> - **TypeScript**: Giúp code **type-safe**, phát hiện lỗi compile-time, intellisense tốt → giảm bug khi dự án lớn.
> - So với **Spring Boot (Java)**: Django phát triển nhanh hơn (rapid development), code ngắn gọn hơn.
> - So với **Express.js**: Django có nhiều tính năng built-in hơn (ORM, admin, auth), không cần cài thêm nhiều package.

## Câu hỏi 2: "Tại sao dùng JWT mà không dùng Session-based authentication?"

> **Trả lời:**
> - JWT phù hợp với kiến trúc **SPA (Single Page Application)** — frontend và backend tách biệt hoàn toàn.
> - **Stateless**: server không cần lưu session → scalable hơn khi cần nhiều server.
> - **Cross-domain**: JWT gửi qua header, không phụ thuộc cookie domain → dễ tích hợp mobile app sau này.
> - **Refresh token mechanism**: access token ngắn hạn (30 phút) + refresh token dài hạn (7 ngày) → cân bằng giữa bảo mật và UX.
> - Dùng **HttpOnly cookie** lưu token để chống XSS attack.

## Câu hỏi 3: "Hệ thống phân quyền hoạt động như thế nào?"

> **Trả lời:**
> - Sử dụng **Django REST Framework Permission classes** — mỗi API endpoint có 1 hoặc nhiều permission class.
> - Pattern **RBAC** (Role-Based Access Control):
>   - **Admin** (`is_staff=True`): full quyền trên mọi resource
>   - **Owner**: full quyền trên project mình sở hữu
>   - **Member**: đọc + sửa task + bình luận
>   - **Assignee**: sửa task được giao
> - Phân quyền kiểm tra tại **Backend** — dù frontend có bị bypass, backend vẫn chặn.
> - Ví dụ: `IsProjectOwnerOrMember` → kiểm tra user có phải owner hoặc member trước khi cho truy cập.

## Câu hỏi 4: "Celery + Redis hoạt động như thế nào trong hệ thống?"

> **Trả lời:**
> - **Celery** là task queue framework — cho phép chạy tác vụ nặng ở background, không block web request.
> - **Redis** là message broker — trung gian giữa web server và Celery worker.
> - Trong hệ thống, Celery dùng cho:
>   - **Celery Beat**: scheduler chạy `check_overdue_tasks_periodic()` mỗi 1 giờ
>   - Kiểm tra tất cả task có `due_date < now` và `status != DONE`
>   - Gửi email + tạo notification cho các task quá hạn
>   - **Anti-spam**: check notification gần nhất trong 24h, nếu đã gửi thì skip
> - Luồng: `Celery Beat → Redis → Celery Worker → Execute Task → Send Email`

## Câu hỏi 5: "Làm sao đảm bảo bảo mật cho hệ thống?"

> **Trả lời:**
> Hệ thống áp dụng nhiều lớp bảo mật:
> 1. **Authentication**: JWT token có thời hạn, refresh token mechanism
> 2. **Authorization**: Permission classes kiểm tra quyền trên mỗi request
> 3. **Password Security**: Hash bằng PBKDF2 (Django built-in), không lưu plaintext
> 4. **CORS**: Chỉ cho phép origin từ frontend (localhost:3000)
> 5. **Input Validation**: Validate tại cả Frontend (Zod) và Backend (Serializer)
> 6. **SQL Injection**: Django ORM tự động parameterize query
> 7. **XSS Protection**: Django auto-escape template, React auto-escape JSX
> 8. **Password Reset**: Token UUID4 + thời hạn + dùng 1 lần
> 9. **Middleware**: Next.js middleware chặn truy cập trang protected khi chưa login

## Câu hỏi 6: "Tại sao dùng PostgreSQL mà không dùng MySQL hay MongoDB?"

> **Trả lời:**
> - **PostgreSQL** là RDBMS tiên tiến nhất:
>   - Hỗ trợ **JSONB** — lưu data bán cấu trúc khi cần
>   - **Full-text search** tốt hơn MySQL
>   - **Concurrency** xử lý tốt (MVCC)
>   - Performance với **complex queries** tốt hơn
> - Không chọn **MongoDB** vì:
>   - Dữ liệu có quan hệ rõ ràng (User-Project-Task-Comment) → RDBMS phù hợp hơn
>   - Django ORM hỗ trợ PostgreSQL tốt nhất
> - Docker Compose đóng gói PostgreSQL → dễ setup cho development

## Câu hỏi 7: "Kanban Board kéo thả được implement như thế nào?"

> **Trả lời:**
> - Sử dụng thư viện **@dnd-kit** (Dnd Kit) — thư viện kéo thả hiện đại nhất cho React:
>   - Lightweight, performant, accessible (hỗ trợ keyboard)
>   - Hỗ trợ **touch events** cho mobile
> - **Kiến trúc**:
>   - `KanbanBoard` component chứa 3 `KanbanColumn` (TODO, IN_PROGRESS, DONE)
>   - Mỗi column chứa nhiều `DraggableTaskCard`
>   - Khi drop task vào column khác → gọi API `updateTask` với status mới
>   - Optimistic update: UI thay đổi ngay, nếu API fail thì revert

## Câu hỏi 8: "Hệ thống xử lý thông báo email như thế nào? Có bị spam không?"

> **Trả lời:**
> - Hệ thống có **9 loại email** với 9 **HTML template** riêng biệt
> - Anti-spam cho task quá hạn:
>   - Check `Notification` table: nếu title chứa "[QUÁ HẠN]" và `created_at` trong 24h → skip
>   - Mỗi task quá hạn chỉ gửi **tối đa 1 email/24h**
> - Email gửi qua Celery → **không block** web request
> - Nếu gửi email fail → log lỗi nhưng **không crash** ứng dụng (try-catch)

## Câu hỏi 9: "Middleware của Next.js hoạt động như thế nào?"

> **Trả lời:**
> - Middleware chạy **trước mỗi request** ở edge (trước khi render page)
> - Kiểm tra `access_token` trong cookies:
>   - Chưa có token + truy cập trang protected → redirect về `/login`
>   - Có token + truy cập trang login/signup → redirect về `/dashboard`
>   - Có token + truy cập landing page (`/`) → redirect về `/dashboard`
> - Matcher config: bỏ qua các path: `_next/static`, `_next/image`, `favicon.ico`, `api`
> - Đây là **lớp bảo vệ phía client**, backend vẫn có permission riêng.

## Câu hỏi 10: "Dự án có thể mở rộng (scale) như thế nào?"

> **Trả lời:**
> Hệ thống được thiết kế sẵn sàng cho scale:
> 1. **Horizontal scaling**: Thêm Celery worker khi cần xử lý nhiều background job
> 2. **Database**: PostgreSQL hỗ trợ connection pooling, read replicas
> 3. **Caching**: Có thể thêm Redis cache cho API responses
> 4. **CDN**: Static files có thể đẩy lên CDN (Cloudflare, AWS CloudFront)
> 5. **Containerization**: Docker Compose sẵn sàng → dễ chuyển sang Kubernetes
> 6. **API versioning**: Có thể thêm prefix `/api/v2/` cho version mới
> 7. **Microservices**: Nếu cần, có thể tách notification service, email service riêng

## Câu hỏi 11: "Google OAuth2 hoạt động như thế nào? Có bảo mật không?"

> **Trả lời:**
> - Frontend sử dụng `@react-oauth/google` để hiển thị nút Google Sign-In
> - Luồng: User chọn tài khoản Google → Google trả **ID Token** (JWT chứa email, tên)
> - Frontend gửi ID token → Backend **verify token với Google API** (google-auth library)
> - Backend tạo/tìm User → trả JWT token riêng của hệ thống
> - **Bảo mật**: 
>   - Token Google chỉ được verify **server-side**
>   - Không tin token từ client → phải verify với Google
>   - Nếu email đã tồn tại → link account, không tạo duplicate

## Câu hỏi 12: "Tại sao lại thiết kế Task cá nhân và Task dự án trong cùng 1 model?"

> **Trả lời:**
> - **Đơn giản hóa** codebase — 1 model Task duy nhất, phân biệt bằng flag `is_personal`
> - **Tái sử dụng** logic: cùng serializer, cùng filter, cùng view pattern
> - Trường `project` cho phép `null` → task cá nhân không cần project
> - **AssignedTasksView** có thể trả **cả 2 loại** task trong 1 API call
> - Nếu tách 2 model → phải duplicate nhiều code (serializer, view, filter, permission)
> - Trade-off: hơi phức tạp ở permission logic, nhưng tổng thể code ngắn gọn hơn

---

# 📌 CHECKLIST TRƯỚC KHI DEMO

### Chuẩn bị dữ liệu:
- [ ] Tạo sẵn **2-3 dự án** với tên có ý nghĩa
- [ ] Mỗi dự án có **3-5 thành viên**
- [ ] Mỗi dự án có **5-10 task** ở các trạng thái khác nhau (TODO, IN_PROGRESS, DONE)
- [ ] Có **task quá hạn** để demo thông báo
- [ ] Có **bình luận** trên một số task
- [ ] Có **file đính kèm** trên một số task
- [ ] Chuẩn bị **2-3 tài khoản**: 1 Admin, 1 Owner, 1 Member
- [ ] Có **task cá nhân** trên trang My Tasks

### Chuẩn bị kỹ thuật:
- [ ] Backend đang chạy (`python manage.py runserver`)
- [ ] Frontend đang chạy (`npm run dev`)
- [ ] PostgreSQL đang chạy (Docker)
- [ ] Redis đang chạy (cho Celery)
- [ ] Celery Worker đang chạy
- [ ] Celery Beat đang chạy
- [ ] Email hoạt động (kiểm tra trước)
- [ ] Mở sẵn Swagger UI (`/api/docs/`)

### Chuẩn bị trình bày:
- [ ] Mở sẵn **2 tab trình duyệt** (1 tài khoản Owner, 1 tài khoản Member)
- [ ] Mở sẵn **email** để show thông báo
- [ ] Mở sẵn **terminal** để show Celery logs (nếu cần)
- [ ] Chuẩn bị **kịch bản demo** chi tiết (tránh mất thời gian tìm kiếm)

---

# 📌 MẸO THUYẾT TRÌNH ĂN ĐIỂM

### 1. Mở đầu ấn tượng
- Bắt đầu bằng **câu hỏi**: "Thầy/cô có bao giờ gặp khó khăn khi theo dõi tiến độ công việc nhóm không?"
- Hoặc đưa ra **vấn đề thực tế**: "Theo khảo sát, 60% dự án thất bại do thiếu công cụ quản lý phù hợp"

### 2. Trong khi demo
- **Nói trước, làm sau**: Giải thích sẽ làm gì trước khi thao tác
- **Nhấn mạnh điểm kỹ thuật**: Mỗi khi demo tính năng, nói thêm về backend logic
- **Show email thật**: Mở email để chứng minh hệ thống thông báo hoạt động
- **So sánh**: "Tính năng này tương tự Trello, nhưng em bổ sung thêm..."

### 3. Khi trả lời câu hỏi phản biện
- **Không nói "Em không biết"** → Nói "Em chưa tìm hiểu kỹ về phần này, nhưng theo em hiểu thì..."
- **Thành thật về hạn chế**: Nếu biết hạn chế, nói rõ và đề xuất hướng cải thiện
- **Đưa ra trade-off**: "Em chọn giải pháp A thay vì B vì... tuy A có nhược điểm... nhưng phù hợp hơn với yêu cầu dự án"

### 4. Kết thúc mạnh mẽ
- Tóm tắt **3 điểm nổi bật nhất**
- Nêu **hướng phát triển** cụ thể (không nói chung chung)
- Cảm ơn ngắn gọn, chuyên nghiệp
