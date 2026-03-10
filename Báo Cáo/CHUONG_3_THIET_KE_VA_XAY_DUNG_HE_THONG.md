# CHƯƠNG 3: THIẾT KẾ VÀ XÂY DỰNG HỆ THỐNG

## 3.1. KIẾN TRÚC HỆ THỐNG

### 3.1.1. Kiến trúc tổng quan

Hệ thống Quản lý Công việc Cá nhân và Nhóm được xây dựng theo mô hình kiến trúc **Client-Server** với việc tách biệt hoàn toàn giữa Frontend và Backend:

```
┌──────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                           │
│                       (Next.js 15 + React 19)                        │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Auth UI   │  │  Dashboard  │  │  Projects   │  │   Tasks     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTPS/REST API
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                            │
│                    (Django 5.2.7 + DRF 3.16)                         │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │    Views    │  │ Serializers │  │ Permissions │  │   Filters   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ ORM
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                 │
│                          (PostgreSQL)                                │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │    Users    │  │  Projects   │  │    Tasks    │  │  Comments   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                                │
┌──────────────────────────────────────────────────────────────────────┐
│                        BACKGROUND SERVICES                           │
│                        (Celery + Redis)                              │
│                                                                      │
│  ┌─────────────────────────┐  ┌─────────────────────────────────┐   │
│  │   Email Notifications   │  │   Scheduled Task Monitoring     │   │
│  └─────────────────────────┘  └─────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.1.2. Công nghệ sử dụng

| Thành phần | Công nghệ | Phiên bản | Mục đích |
|------------|-----------|-----------|----------|
| **Backend** | Django | 5.2.7 | Web framework |
| | Django REST Framework | 3.16+ | Xây dựng RESTful API |
| | SimpleJWT | - | Xác thực JWT Token |
| | Django Filter | - | Lọc và tìm kiếm dữ liệu |
| **Frontend** | Next.js | 15 | React Framework (SSR/SSG) |
| | React | 19 | Thư viện UI |
| | TypeScript | - | Ngôn ngữ lập trình |
| | Tailwind CSS | - | CSS Framework |
| | shadcn/ui | - | Component Library |
| | dnd-kit | - | Drag & Drop |
| **Database** | PostgreSQL | - | Hệ quản trị CSDL |
| **Background Jobs** | Celery | 5.6.2 | Task Queue |
| | Redis | - | Message Broker |
| **Email** | Gmail SMTP | - | Gửi email thông báo |
| **Authentication** | Google OAuth 2.0 | - | Đăng nhập Google |

---

## 3.2. THIẾT KẾ CƠ SỞ DỮ LIỆU

### 3.2.1. Sơ đồ quan hệ thực thể (ERD)

```
                                    ┌─────────────────┐
                                    │      User       │
                                    ├─────────────────┤
                                    │ id (PK)         │
                                    │ username        │
                                    │ email           │
                                    │ password        │
                                    │ first_name      │
                                    │ last_name       │
                                    │ is_staff        │
                                    └────────┬────────┘
                                             │
           ┌─────────────────────────────────┼─────────────────────────────────┐
           │                                 │                                 │
           ▼                                 ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│      Project        │         │        Task         │         │    Notification     │
├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
│ id (PK)             │         │ id (PK)             │         │ id (PK)             │
│ name                │◄────────│ project (FK)        │         │ recipient (FK)      │
│ description         │         │ title               │         │ title               │
│ owner (FK)          │         │ description         │         │ message             │
│ members (M2M)       │         │ status              │         │ project (FK)        │
│ created_at          │         │ priority            │         │ task (FK)           │
│ updated_at          │         │ start_date          │         │ is_read             │
└─────────────────────┘         │ due_date            │         │ created_at          │
           │                    │ is_personal         │         └─────────────────────┘
           │                    │ created_by (FK)     │
           │                    │ assignee (FK)       │
           │                    │ created_at          │
           │                    │ updated_at          │
           │                    └──────────┬──────────┘
           │                               │
           │              ┌────────────────┼────────────────┐
           │              │                │                │
           │              ▼                ▼                ▼
           │    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
           │    │     Comment     │ │   Attachment    │ │   ActivityLog   │
           │    ├─────────────────┤ ├─────────────────┤ ├─────────────────┤
           │    │ id (PK)         │ │ id (PK)         │ │ id (PK)         │
           │    │ task (FK)       │ │ task (FK)       │ │ action_desc     │
           │    │ author (FK)     │ │ file            │ │ actor (FK)      │
           │    │ body            │ │ description     │ │ project (FK)    │
           │    │ created_at      │ │ uploader (FK)   │ │ task (FK)       │
           │    │ updated_at      │ │ uploaded_at     │ │ timestamp       │
           │    └─────────────────┘ └─────────────────┘ └─────────────────┘
           │
           └─────────────────────────────────────────────────────┐
                                                                 │
                                                                 ▼
                                                  ┌─────────────────────────┐
                                                  │   PasswordResetToken    │
                                                  ├─────────────────────────┤
                                                  │ id (PK)                 │
                                                  │ user (FK)               │
                                                  │ token                   │
                                                  │ created_at              │
                                                  │ expires_at              │
                                                  │ is_used                 │
                                                  └─────────────────────────┘
```

### 3.2.2. Mô tả chi tiết các bảng dữ liệu

#### 3.2.2.1. Bảng User (Người dùng)

Kế thừa từ `AbstractUser` của Django với các trường mặc định.

| Trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
|--------|--------------|-------|-----------|
| id | Integer | Khóa chính | PK, Auto Increment |
| username | VARCHAR(150) | Tên đăng nhập | Unique, Not Null |
| email | VARCHAR(254) | Email | Unique |
| password | VARCHAR(128) | Mật khẩu (đã mã hóa) | Not Null |
| first_name | VARCHAR(150) | Tên | - |
| last_name | VARCHAR(150) | Họ | - |
| is_staff | Boolean | Quyền Admin | Default: False |
| is_active | Boolean | Trạng thái hoạt động | Default: True |

#### 3.2.2.2. Bảng Project (Dự án)

| Trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
|--------|--------------|-------|-----------|
| id | Integer | Khóa chính | PK, Auto Increment |
| name | VARCHAR(255) | Tên dự án | Not Null |
| description | Text | Mô tả dự án | Nullable |
| owner | Integer | Quản lý dự án | FK → User, CASCADE |
| members | M2M | Thành viên dự án | M2M → User |
| created_at | DateTime | Ngày tạo | Auto |
| updated_at | DateTime | Ngày cập nhật | Auto |

#### 3.2.2.3. Bảng Task (Công việc)

| Trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
|--------|--------------|-------|-----------|
| id | Integer | Khóa chính | PK, Auto Increment |
| title | VARCHAR(255) | Tiêu đề | Not Null |
| description | Text | Mô tả chi tiết | Nullable |
| status | VARCHAR(4) | Trạng thái | Choices: TODO/INPR/DONE |
| priority | VARCHAR(4) | Độ ưu tiên | Choices: LOW/MED/HIGH |
| start_date | DateTime | Ngày bắt đầu | Nullable |
| due_date | DateTime | Ngày hết hạn | Nullable |
| project | Integer | Dự án | FK → Project, Nullable |
| is_personal | Boolean | Là việc cá nhân | Default: False |
| created_by | Integer | Người tạo | FK → User, CASCADE |
| assignee | Integer | Người được giao | FK → User, Nullable |
| created_at | DateTime | Ngày tạo | Auto |
| updated_at | DateTime | Ngày cập nhật | Auto |

**Các giá trị Status:**
- `TODO`: Cần làm
- `INPR`: Đang thực hiện  
- `DONE`: Hoàn thành

**Các giá trị Priority:**
- `LOW`: Thấp
- `MED`: Trung bình
- `HIGH`: Cao

#### 3.2.2.4. Bảng Comment (Bình luận)

| Trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
|--------|--------------|-------|-----------|
| id | Integer | Khóa chính | PK, Auto Increment |
| task | Integer | Công việc | FK → Task, CASCADE |
| author | Integer | Tác giả | FK → User, CASCADE |
| body | Text | Nội dung | Not Null |
| created_at | DateTime | Ngày tạo | Auto |
| updated_at | DateTime | Ngày cập nhật | Auto |

#### 3.2.2.5. Bảng Attachment (Tập tin đính kèm)

| Trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
|--------|--------------|-------|-----------|
| id | Integer | Khóa chính | PK, Auto Increment |
| task | Integer | Công việc | FK → Task, CASCADE |
| file | FileField | Đường dẫn file | upload_to='attachments/' |
| description | VARCHAR(255) | Mô tả file | Nullable |
| uploader | Integer | Người tải | FK → User, SET_NULL |
| uploaded_at | DateTime | Ngày tải | Auto |

#### 3.2.2.6. Bảng Notification (Thông báo)

| Trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
|--------|--------------|-------|-----------|
| id | Integer | Khóa chính | PK, Auto Increment |
| recipient | Integer | Người nhận | FK → User, CASCADE |
| title | VARCHAR(255) | Tiêu đề | Not Null |
| message | Text | Nội dung | Not Null |
| project | Integer | Dự án liên quan | FK → Project, Nullable |
| task | Integer | Task liên quan | FK → Task, Nullable |
| is_read | Boolean | Đã đọc | Default: False |
| created_at | DateTime | Ngày tạo | Auto |

#### 3.2.2.7. Bảng ActivityLog (Nhật ký hoạt động)

| Trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
|--------|--------------|-------|-----------|
| id | Integer | Khóa chính | PK, Auto Increment |
| action_description | VARCHAR(255) | Mô tả hành động | Not Null |
| actor | Integer | Người thực hiện | FK → User, SET_NULL |
| project | Integer | Dự án | FK → Project, SET_NULL |
| task | Integer | Task | FK → Task, SET_NULL |
| timestamp | DateTime | Thời gian | Auto |

#### 3.2.2.8. Bảng PasswordResetToken

| Trường | Kiểu dữ liệu | Mô tả | Ràng buộc |
|--------|--------------|-------|-----------|
| id | Integer | Khóa chính | PK, Auto Increment |
| user | Integer | Người dùng | FK → User, CASCADE |
| token | VARCHAR(100) | Token reset | Unique |
| created_at | DateTime | Ngày tạo | Auto |
| expires_at | DateTime | Hết hạn lúc | Not Null |
| is_used | Boolean | Đã sử dụng | Default: False |

---

## 3.3. THIẾT KẾ API (BACKEND)

### 3.3.1. Cấu trúc RESTful API

API được thiết kế theo chuẩn RESTful với các nguyên tắc:
- Sử dụng HTTP Methods: GET, POST, PUT, PATCH, DELETE
- Response format: JSON
- Authentication: JWT (JSON Web Token)
- Status codes tuân theo HTTP Standard

### 3.3.2. Danh sách API Endpoints

#### 3.3.2.1. Authentication APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/signup/` | Đăng ký tài khoản | No |
| POST | `/api/login/` | Đăng nhập | No |
| POST | `/api/google-login/` | Đăng nhập Google | No |
| POST | `/api/token/refresh/` | Làm mới Access Token | No |
| POST | `/api/set-password/` | Đặt mật khẩu (OAuth users) | Yes |
| POST | `/api/forgot-password/` | Quên mật khẩu | No |
| POST | `/api/reset-password/` | Reset mật khẩu | No |

#### 3.3.2.2. User APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/users/` | Danh sách users | Yes |
| GET | `/api/users/me/` | Thông tin user hiện tại | Yes |
| GET | `/api/users/<id>/` | Chi tiết user | Yes |

#### 3.3.2.3. Project APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/projects/` | Danh sách dự án | Yes |
| POST | `/api/projects/` | Tạo dự án mới | Yes |
| GET | `/api/projects/<id>/` | Chi tiết dự án | Yes |
| PUT | `/api/projects/<id>/` | Cập nhật dự án | Yes |
| PATCH | `/api/projects/<id>/` | Cập nhật một phần | Yes |
| DELETE | `/api/projects/<id>/` | Xóa dự án | Yes |
| POST | `/api/projects/<id>/add_member/` | Thêm thành viên | Yes |
| POST | `/api/projects/<id>/remove_member/` | Xóa thành viên | Yes |

#### 3.3.2.4. Task APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/projects/<id>/tasks/` | Task trong dự án | Yes |
| POST | `/api/projects/<id>/tasks/` | Tạo task dự án | Yes |
| GET | `/api/my-tasks/` | Task cá nhân | Yes |
| POST | `/api/my-tasks/` | Tạo task cá nhân | Yes |
| GET | `/api/assigned-tasks/` | Tất cả task được giao | Yes |
| GET | `/api/tasks/<id>/` | Chi tiết task | Yes |
| PATCH | `/api/tasks/<id>/` | Cập nhật task | Yes |
| DELETE | `/api/tasks/<id>/` | Xóa task | Yes |

#### 3.3.2.5. Comment & Attachment APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/tasks/<id>/comments/` | Danh sách bình luận | Yes |
| POST | `/api/tasks/<id>/comments/` | Thêm bình luận | Yes |
| GET | `/api/tasks/<id>/attachments/` | Danh sách file đính kèm | Yes |
| POST | `/api/tasks/<id>/attachments/` | Upload file | Yes |

#### 3.3.2.6. Notification APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/notifications/` | Danh sách thông báo | Yes |
| POST | `/api/notifications/<id>/read/` | Đánh dấu đã đọc | Yes |
| POST | `/api/notifications/read-all/` | Đọc tất cả | Yes |

### 3.3.3. Hệ thống phân quyền

#### Permission Classes

```python
# Quyền xem danh sách Project
class CanViewProjectList(BasePermission):
    """
    - Admin: Xem tất cả dự án
    - User: Chỉ xem dự án mà họ là owner hoặc member
    """

# Quyền truy cập Project Detail
class IsProjectOwnerOrMember(BasePermission):
    """
    - Admin: Full quyền
    - Owner: Full quyền (CRUD)
    - Member: Chỉ đọc (GET)
    """

# Quyền truy cập Task
class IsTaskPermission(BasePermission):
    """
    - Task Cá nhân: Chỉ người tạo có quyền
    - Task Dự án:
      + Owner: Full quyền
      + Member/Assignee: Xem + Sửa trạng thái
    """
```

### 3.3.4. JWT Authentication

Hệ thống sử dụng **Simple JWT** với cấu hình:

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),   # Access token: 30 phút
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),      # Refresh token: 7 ngày
    "ROTATE_REFRESH_TOKENS": True,                    # Cấp token mới khi refresh
    "BLACKLIST_AFTER_ROTATION": True,                 # Blacklist token cũ
}
```

**JWT Token Payload:**
```json
{
  "user_id": 1,
  "username": "johndoe",
  "is_staff": false,
  "exp": 1709978400,
  "iat": 1709976600
}
```

---

## 3.4. THIẾT KẾ GIAO DIỆN (FRONTEND)

### 3.4.1. Cấu trúc thư mục Frontend

```
frontend/src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route Group - Authentication
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (main)/                   # Route Group - Protected Routes
│   │   ├── dashboard/            # Trang chủ
│   │   ├── my-projects/          # Quản lý dự án
│   │   ├── my-tasks/             # Công việc cá nhân
│   │   ├── projects/[id]/        # Chi tiết dự án
│   │   └── profile/              # Hồ sơ người dùng
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── dashboard/                # Dashboard components
│   ├── project/                  # Project components
│   │   ├── kanban-board.tsx
│   │   ├── jira-board/
│   │   ├── task-detail-modal.tsx
│   │   └── ...
│   └── layout/                   # Layout components
├── services/                     # API Services
│   ├── auth.ts
│   ├── project.ts
│   ├── task.ts
│   └── user.ts
├── types/                        # TypeScript Types
├── lib/                          # Utilities
│   ├── api.ts                    # Axios instance
│   └── i18n.ts                   # Internationalization
└── hooks/                        # Custom React Hooks
```

### 3.4.2. Các màn hình chính

#### 3.4.2.1. Màn hình Đăng nhập / Đăng ký

- Form đăng nhập với username/password
- Đăng nhập bằng Google OAuth 2.0
- Form đăng ký với validation
- Quên mật khẩu / Reset mật khẩu

#### 3.4.2.2. Dashboard

- Hiển thị tổng quan công việc
- Thống kê số lượng task theo trạng thái
- Danh sách dự án của người dùng
- Quick access đến các chức năng chính

#### 3.4.2.3. Quản lý Dự án

| Chức năng | Mô tả |
|-----------|-------|
| Danh sách dự án | Hiển thị tất cả dự án của user |
| Tạo dự án | Form tạo dự án mới |
| Chi tiết dự án | Xem thông tin và task |
| Cài đặt dự án | Chỉnh sửa, thêm/xóa thành viên |

#### 3.4.2.4. Kanban Board

Giao diện quản lý task theo phong cách Jira với:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECT: My Project                           │
│  [Board] [List] [Calendar] [Timeline] [Summary]                 │
├────────────────┬────────────────┬────────────────┬──────────────┤
│    TODO        │  IN PROGRESS   │     DONE       │              │
├────────────────┼────────────────┼────────────────┤              │
│ ┌────────────┐ │ ┌────────────┐ │ ┌────────────┐ │   FILTERS    │
│ │ Task 1     │ │ │ Task 2     │ │ │ Task 3     │ │              │
│ │ 🔴 HIGH    │ │ │ 🟡 MED     │ │ │ 🟢 LOW     │ │  Assignee    │
│ │ Due: 3/15  │ │ │ Due: 3/20  │ │ │ Due: 3/10  │ │  Priority    │
│ └────────────┘ │ └────────────┘ │ └────────────┘ │  Due Date    │
│                │                │                │              │
│ ┌────────────┐ │                │                │              │
│ │ Task 4     │ │                │                │              │
│ │ 🟡 MED     │ │                │                │              │
│ └────────────┘ │                │                │              │
└────────────────┴────────────────┴────────────────┴──────────────┘
```

**Các tính năng:**
- Kéo thả (Drag & Drop) task giữa các cột
- Lọc theo: Assignee, Priority, Due Date
- Tìm kiếm task
- View modes: Board, List, Calendar, Timeline

### 3.4.3. Component Architecture

#### Task Card Component

```typescript
interface Task {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'INPR' | 'DONE';
  priority: 'LOW' | 'MED' | 'HIGH';
  start_date: string | null;
  due_date: string | null;
  assignee: User | null;
  created_by: number;
  is_personal?: boolean;
  project?: Project | number | null;
}
```

#### Project Component

```typescript
interface Project {
  id: number;
  name: string;
  description: string;
  owner: User;
  members: User[];
  created_at: string;
  updated_at: string;
}
```

### 3.4.4. State Management

Frontend sử dụng **React Hooks** và **Local State** cho state management:

- `useState` - Local component state
- `useEffect` - Side effects và data fetching
- `useContext` - Theme, Language context
- Custom hooks cho logic tái sử dụng

---

## 3.5. HỆ THỐNG THÔNG BÁO

### 3.5.1. Thông báo trong ứng dụng (In-app Notification)

Hệ thống tạo thông báo tự động khi:

| Sự kiện | Người nhận | Nội dung |
|---------|------------|----------|
| Được giao task | Assignee | "Bạn được giao công việc mới" |
| Được thêm vào dự án | Member mới | "Bạn đã được thêm vào dự án" |
| Task quá hạn | Team members | "Công việc đã quá hạn" |
| Comment mới | Assignee | "Có bình luận mới trong task" |

### 3.5.2. Thông báo qua Email

Sử dụng Gmail SMTP với các template HTML:

| Template | Mục đích |
|----------|----------|
| `task_assigned.html` | Thông báo được giao task |
| `project_invitation.html` | Mời vào dự án |
| `task_due_date_changed.html` | Thay đổi deadline |
| `task_comment.html` | Comment mới |
| `task_deleted.html` | Task bị xóa |
| `task_status_changed.html` | Thay đổi trạng thái |
| `overdue_task.html` | Task quá hạn |
| `member_removed.html` | Bị xóa khỏi dự án |

### 3.5.3. Scheduled Tasks (Celery)

Celery Beat thực hiện các tác vụ định kỳ:

```python
# Kiểm tra task quá hạn mỗi ngày
@shared_task
def check_overdue_tasks():
    """
    Quét tất cả task có due_date < now và status != DONE
    Gửi email thông báo cho:
    - Assignee của task
    - Tất cả thành viên dự án (nếu là task dự án)
    """
```

---

## 3.6. BẢO MẬT HỆ THỐNG

### 3.6.1. Authentication

| Phương thức | Mô tả |
|-------------|-------|
| **Password Hashing** | Django PBKDF2 với SHA256 |
| **JWT Token** | Access Token (30 phút) + Refresh Token (7 ngày) |
| **Google OAuth 2.0** | Social login |
| **Token Blacklist** | Vô hiệu hóa token khi refresh |

### 3.6.2. Authorization

- **Role-based**: Admin, Owner, Member
- **Object-level permissions**: Kiểm tra quyền trên từng object
- **Middleware protection**: Middleware kiểm tra token trước khi vào protected routes

### 3.6.3. CORS Configuration

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Frontend dev server
]
```

---

## 3.7. TRIỂN KHAI VÀ VẬN HÀNH

### 3.7.1. Development Environment

```bash
# Backend
cd TaskManagementSystem_DoAn
python -m venv env
.\env\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev

# Celery Worker
celery -A TaskManagementSystem worker -l info

# Celery Beat (Scheduler)
celery -A TaskManagementSystem beat -l info
```

### 3.7.2. Cấu hình môi trường

File `.env`:
```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/taskdb

# Email
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id

# Redis (Celery)
CELERY_BROKER_URL=redis://localhost:6379/0
```

---

## 3.8. TỔNG KẾT CHƯƠNG

Chương 3 đã trình bày chi tiết về thiết kế và xây dựng hệ thống Quản lý Công việc Cá nhân và Nhóm, bao gồm:

1. **Kiến trúc hệ thống**: Mô hình Client-Server với Backend Django REST Framework và Frontend Next.js

2. **Cơ sở dữ liệu**: 8 bảng chính (User, Project, Task, Comment, Attachment, Notification, ActivityLog, PasswordResetToken) với quan hệ được thiết kế chặt chẽ

3. **API Design**: RESTful API với 30+ endpoints, hệ thống phân quyền đa cấp, xác thực JWT

4. **Frontend**: Giao diện hiện đại với Kanban Board, hỗ trợ Drag & Drop, đa ngôn ngữ

5. **Hệ thống thông báo**: In-app notification + Email notification với template HTML

6. **Bảo mật**: JWT Authentication, CORS, Role-based Authorization

Hệ thống được thiết kế với khả năng mở rộng cao, dễ bảo trì và tuân thủ các best practices trong phát triển web hiện đại.
