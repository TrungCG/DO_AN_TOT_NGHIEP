# Task Management System - Tài liệu Dự án

## 1. Tổng quan Hệ thống

Hệ thống quản lý công việc (Task Management) tương tự Trello/Jira, hỗ trợ quản lý dự án nhóm và task cá nhân.

### Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| **Backend** | Django 5.2.7 + Django REST Framework |
| **Frontend** | Next.js 14 (TypeScript + React) |
| **Database** | PostgreSQL |
| **Hàng đợi** | Celery + Redis (kiểm tra task quá hạn) |
| **Email** | Gmail SMTP |
| **UI Library** | shadcn/ui + Tailwind CSS |
| **Auth** | JWT (SimpleJWT) + Google OAuth2 |

### Luồng hoạt động

```
User truy cập web → Next.js (frontend) render trang
  → Gọi API qua Axios (services/) → Django REST (backend)
    → Xử lý logic (views.py) → Truy vấn DB (models.py)
    → Kiểm tra quyền (permissions.py) → Trả về JSON (serializers.py)
  → Frontend nhận data → Render UI (components/)
```

---

## 2. Backend (Django REST API)

### 2.1. Cấu trúc thư mục

```
API/                              ← Code API chính
├── models.py                     ← Cấu trúc dữ liệu (database)
├── views.py                      ← Xử lý logic API
├── urls.py                       ← Đường dẫn API
├── serializers.py                ← Chuyển đổi dữ liệu (request/response)
├── permissions.py                ← Phân quyền truy cập
├── filters.py                    ← Bộ lọc dữ liệu
├── email_utils.py                ← Gửi email thông báo
├── tasks.py                      ← Celery tasks (chạy nền)
├── admin.py                      ← Django Admin config
├── management/commands/           ← Management commands
│   └── check_overdue_tasks.py    ← Kiểm tra task quá hạn
└── templates/emails/              ← Template email HTML
    ├── task_assigned.html
    ├── task_comment.html
    ├── task_deleted.html
    ├── task_due_date_changed.html
    ├── task_status_changed.html
    ├── project_invitation.html
    ├── member_removed.html
    ├── overdue_task.html
    └── personal_task_overdue.html

TaskManagementSystem/             ← Cấu hình Django
├── settings.py                   ← Cài đặt (DB, JWT, Email, CORS...)
├── urls.py                       ← Root URL config
├── celery.py                     ← Cấu hình Celery
├── wsgi.py                       ← WSGI entry point
└── asgi.py                       ← ASGI entry point
```

### 2.2. Models (Cấu trúc dữ liệu) — `API/models.py`

| Model | Chức năng | Các trường chính |
|-------|-----------|-----------------|
| **User** | Người dùng (AbstractUser) | username, email, avatar, is_staff, is_active |
| **Project** | Dự án | name, description, owner, members, created_at |
| **Task** | Công việc | title, description, status, priority, project, assignee, creator, start_date, due_date, is_personal |
| **Comment** | Bình luận trên task | content, task, author, created_at |
| **Attachment** | File đính kèm | file, task, uploaded_by, uploaded_at |
| **ActivityLog** | Lịch sử hoạt động | action, project, task, user, details, created_at |
| **Notification** | Thông báo | user, message, is_read, notification_type, related_project, related_task |
| **PasswordResetToken** | Token đặt lại mật khẩu | user, token, created_at |

**Task Status:** `TODO` | `IN_PROGRESS` | `DONE`  
**Task Priority:** `LOW` | `MEDIUM` | `HIGH`

### 2.3. Views (Xử lý logic API) — `API/views.py`

#### Authentication

| View | Method | Chức năng |
|------|--------|-----------|
| `SignupView` | POST | Đăng ký tài khoản |
| `LoginView` | POST | Đăng nhập (trả JWT token) |
| `GoogleLoginView` | POST | Đăng nhập bằng Google OAuth |
| `SetPasswordView` | POST | Đặt mật khẩu cho user Google |
| `ForgotPasswordView` | POST | Gửi email đặt lại mật khẩu |
| `ResetPasswordView` | POST | Đặt lại mật khẩu bằng token |

#### User Management

| View | Method | Chức năng |
|------|--------|-----------|
| `CurrentUserView` | GET/PUT | Xem/sửa thông tin user hiện tại |
| `UserListView` | GET | Danh sách user (có search) |
| `UserDetailView` | GET | Chi tiết user |
| `AdminUserListView` | GET | Admin: Danh sách tất cả user |
| `AdminUserDetailView` | GET/PUT/DELETE | Admin: Quản lý user |

#### Project Management

| View | Method | Chức năng |
|------|--------|-----------|
| `ProjectListView` | GET/POST | Danh sách/tạo dự án |
| `ProjectDetailView` | GET/PUT/DELETE | Xem/sửa/xóa dự án |
| `AddMemberView` | POST | Thêm thành viên vào dự án |
| `RemoveMemberView` | POST | Xóa thành viên khỏi dự án |

#### Task Management

| View | Method | Chức năng |
|------|--------|-----------|
| `TaskListView` | GET/POST | Danh sách/tạo task trong dự án |
| `PersonalTaskListView` | GET/POST | Danh sách/tạo task cá nhân |
| `AssignedTasksView` | GET | Tất cả task được giao + task cá nhân |
| `TaskDetailView` | GET/PUT/DELETE | Xem/sửa/xóa task (gửi email khi thay đổi) |

#### Comments & Attachments

| View | Method | Chức năng |
|------|--------|-----------|
| `CommentListView` | GET/POST | Danh sách/tạo bình luận |
| `CommentDetailView` | PUT/DELETE | Sửa/xóa bình luận |
| `AttachmentListView` | GET/POST | Danh sách/upload file |
| `AttachmentDetailView` | DELETE | Xóa file đính kèm |

#### Activity & Notifications

| View | Method | Chức năng |
|------|--------|-----------|
| `ActivityLogProjectView` | GET | Lịch sử hoạt động dự án |
| `ActivityLogTaskView` | GET | Lịch sử hoạt động task |
| `NotificationListView` | GET | Danh sách thông báo + số chưa đọc |
| `NotificationMarkAsReadView` | POST | Đánh dấu đã đọc 1 thông báo |
| `NotificationMarkAllAsReadView` | POST | Đánh dấu đã đọc tất cả |

### 2.4. URL Patterns — `API/urls.py`

```
# Authentication
POST   /api/signup/                                → Đăng ký
POST   /api/login/                                 → Đăng nhập
POST   /api/token/refresh/                         → Refresh JWT token
POST   /api/google-login/                          → Đăng nhập Google
POST   /api/set-password/                          → Đặt mật khẩu (Google user)
POST   /api/forgot-password/                       → Quên mật khẩu
POST   /api/reset-password/                        → Đặt lại mật khẩu

# Users
GET    /api/users/                                 → Danh sách user
GET    /api/users/me/                              → User hiện tại
GET    /api/users/<id>/                            → Chi tiết user

# Admin
GET    /api/admin/users/                           → Admin: danh sách user
GET/PUT/DELETE /api/admin/users/<id>/              → Admin: quản lý user

# Projects
GET/POST   /api/projects/                          → Danh sách/tạo dự án
GET/PUT/DELETE /api/projects/<id>/                 → Chi tiết dự án
POST   /api/projects/<id>/add_member/              → Thêm thành viên
POST   /api/projects/<id>/remove_member/           → Xóa thành viên

# Tasks
GET/POST   /api/projects/<id>/tasks/               → Task trong dự án
GET/POST   /api/my-tasks/                          → Task cá nhân
GET    /api/assigned-tasks/                        → Task được giao
GET/PUT/DELETE /api/tasks/<id>/                    → Chi tiết task

# Comments & Attachments
GET/POST   /api/tasks/<task_id>/comments/          → Bình luận
PUT/DELETE /api/tasks/<task_id>/comments/<id>/     → Sửa/xóa bình luận
GET/POST   /api/tasks/<task_id>/attachments/       → File đính kèm
DELETE /api/tasks/<task_id>/attachments/<id>/      → Xóa file

# Activity & Notifications
GET    /api/projects/<id>/activity/                → Lịch sử dự án
GET    /api/tasks/<id>/activity/                   → Lịch sử task
GET    /api/notifications/                         → Thông báo
POST   /api/notifications/<id>/read/               → Đánh dấu đã đọc
POST   /api/notifications/read-all/                → Đọc tất cả

# Documentation
GET    /api/docs/                                  → Swagger UI
GET    /api/schema/                                → OpenAPI Schema
```

### 2.5. Serializers — `API/serializers.py`

| Serializer | Chức năng |
|------------|-----------|
| `CustomTokenObtainPairSerializer` | Thêm is_staff vào JWT token |
| `SignupSerializer` | Validate đăng ký (username, email, password) |
| `UserSerializer` | Serialize user đầy đủ |
| `UserBasicSerializer` | Serialize user cơ bản (id, username, email) |
| `UserAdminSerializer` | Serialize user cho admin |
| `ProjectSerializer` | Serialize dự án + danh sách thành viên |
| `TaskSerializer` | Serialize task + gửi email khi assign |
| `CommentSerializer` | Serialize bình luận + thông tin tác giả |
| `AttachmentSerializer` | Serialize file đính kèm |
| `ActivityLogSerializer` | Serialize lịch sử hoạt động |
| `NotificationSerializer` | Serialize thông báo |
| `SetPasswordSerializer` | Validate đặt mật khẩu |
| `ForgotPasswordSerializer` | Validate email quên mật khẩu |
| `ResetPasswordSerializer` | Validate token + mật khẩu mới |
| `GoogleLoginSerializer` | Xử lý Google OAuth token |

### 2.6. Permissions — `API/permissions.py`

| Permission | Quy tắc |
|------------|---------|
| `CanViewProjectList` | User thấy project mình tham gia, admin thấy tất cả |
| `IsProjectOwnerOrMember` | Chỉ owner/member mới truy cập project |
| `CanViewTaskList` | Member/owner mới xem task trong project |
| `IsTaskPermission` | Task cá nhân: chỉ creator; Task dự án: owner/member/assignee |
| `IsCommentOrAttachmentOwner` | Tác giả hoặc project owner mới sửa/xóa |
| `CanCommentOnTask` | Task cá nhân: creator+assignee; Task dự án: tất cả member |
| `CanViewActivityLog` | User đã đăng nhập |
| `IsProjectOwnerOnly` | Chỉ project owner |

### 2.7. Filters — `API/filters.py`

| Filter | Trường lọc |
|--------|-----------|
| `TaskFilter` | status, priority, assignee (me/id), due_date range, search (title) |
| `ProjectFilter` | name (search), role (owner/member) |
| `UserFilter` | username, email |

### 2.8. Email Notifications — `API/email_utils.py`

| Hàm | Gửi khi |
|-----|---------|
| `send_task_assigned_notification()` | Task được giao cho ai đó |
| `send_project_invitation_notification()` | Thêm thành viên vào dự án |
| `send_task_due_date_changed_notification()` | Thay đổi deadline |
| `send_task_comment_notification()` | Có bình luận mới |
| `send_task_deleted_notification()` | Task bị xóa |
| `send_task_status_changed_notification()` | Thay đổi trạng thái task |
| `send_member_removed_notification()` | Xóa thành viên khỏi dự án |
| `send_overdue_task_notification()` | Task dự án quá hạn |
| `send_personal_task_overdue_notification()` | Task cá nhân quá hạn |

### 2.9. Celery Tasks — `API/tasks.py`

| Task | Chức năng |
|------|-----------|
| `check_overdue_tasks_periodic()` | Chạy mỗi giờ, kiểm tra task quá hạn và gửi email (tránh gửi trùng trong 24h) |

---

## 3. Frontend (Next.js 14 + TypeScript)

### 3.1. Cấu trúc thư mục

```
frontend/src/
├── middleware.ts                  ← Bảo vệ route (redirect nếu chưa login)
├── app/                           ← Các trang (Pages)
│   ├── page.tsx                   ← Trang chủ (Landing page)
│   ├── layout.tsx                 ← Root layout
│   ├── globals.css                ← CSS toàn cục
│   ├── (auth)/                    ← Nhóm trang authentication
│   │   ├── layout.tsx
│   │   ├── login/page.tsx         ← Trang đăng nhập
│   │   ├── signup/page.tsx        ← Trang đăng ký
│   │   ├── forgot-password/page.tsx  ← Trang quên mật khẩu
│   │   └── reset-password/page.tsx   ← Trang đặt lại mật khẩu
│   └── (main)/                    ← Nhóm trang chính (cần đăng nhập)
│       ├── layout.tsx
│       ├── dashboard/page.tsx     ← Dashboard
│       ├── my-projects/page.tsx   ← Dự án của tôi
│       ├── my-tasks/page.tsx      ← Task cá nhân
│       ├── projects/[id]/page.tsx ← Board dự án
│       ├── profile/page.tsx       ← Hồ sơ cá nhân
│       └── admin/users/page.tsx   ← Quản lý user (admin)
│
├── components/                    ← Các component UI
│   ├── ui/                        ← shadcn/ui components (Button, Input, Dialog...)
│   ├── layout/                    ← Layout components
│   │   ├── app-sidebar.tsx        ← Sidebar menu
│   │   ├── notification-bell.tsx  ← Chuông thông báo
│   │   └── recent-popover.tsx     ← Mục truy cập gần đây
│   ├── dashboard/
│   │   └── project-card.tsx       ← Card hiển thị dự án
│   ├── project/                   ← Components dự án/task
│   │   ├── kanban-board.tsx       ← Bảng Kanban kéo thả
│   │   ├── kanban-column.tsx      ← Cột Kanban (TODO/In Progress/Done)
│   │   ├── draggable-task-card.tsx ← Thẻ task kéo thả
│   │   ├── task-detail-modal.tsx  ← Modal chi tiết task
│   │   ├── create-task-dialog.tsx ← Dialog tạo task
│   │   ├── add-member-dialog.tsx  ← Dialog thêm thành viên
│   │   ├── project-settings-dialog.tsx ← Dialog cài đặt dự án
│   │   ├── project-activity-dialog.tsx ← Dialog lịch sử hoạt động
│   │   ├── task-filters.tsx       ← Bộ lọc task
│   │   ├── board-header.tsx       ← Header bảng dự án
│   │   ├── project-overview.tsx   ← Tổng quan dự án
│   │   ├── personal-tasks-overview.tsx ← Tổng quan task cá nhân
│   │   ├── member-tasks-board.tsx ← Board theo thành viên
│   │   └── jira-board/            ← Giao diện dạng Jira
│   │       ├── jira-project-header.tsx
│   │       ├── jira-task-card.tsx
│   │       ├── jira-column.tsx
│   │       ├── jira-member-column.tsx
│   │       ├── jira-list-view.tsx  ← Xem dạng danh sách
│   │       ├── jira-timeline-view.tsx ← Xem dạng timeline
│   │       └── my-tasks-header.tsx
│   ├── theme-provider.tsx         ← Provider dark/light mode
│   ├── theme-toggle.tsx           ← Nút đổi theme
│   └── language-toggle.tsx        ← Nút đổi ngôn ngữ
│
├── services/                      ← Gọi API
│   ├── auth.ts                    ← Login, signup, Google OAuth, reset password
│   ├── user.ts                    ← CRUD user, admin quản lý user
│   ├── project.ts                 ← CRUD dự án, thêm/xóa member
│   ├── task.ts                    ← CRUD task, comment, attachment
│   └── extra.ts                   ← Thông báo, activity log
│
├── types/                         ← TypeScript interfaces
│   ├── auth.ts                    ← User, LoginResponse...
│   ├── project.ts                 ← Project interface
│   ├── task.ts                    ← Task interface
│   └── extra.ts                   ← Notification, ActivityLog...
│
├── hooks/                         ← Custom React hooks
│   └── use-current-user.ts        ← Fetch + cache user hiện tại
│
└── lib/                           ← Utilities & config
    ├── api.ts                     ← Axios instance (tự gắn token, auto refresh)
    ├── i18n.tsx                   ← Đa ngôn ngữ (i18n)
    ├── recent-items.ts            ← Lưu mục truy cập gần đây (localStorage)
    ├── task-filters.ts            ← Quản lý state bộ lọc
    └── utils.ts                   ← Hàm tiện ích
```

### 3.2. Các Trang (Pages) — Muốn sửa giao diện trang nào, vào file nào?

| Trang | URL trên web | File |
|-------|-------------|------|
| Trang chủ (Landing) | `/` | `frontend/src/app/page.tsx` |
| Đăng nhập | `/login` | `frontend/src/app/(auth)/login/page.tsx` |
| Đăng ký | `/signup` | `frontend/src/app/(auth)/signup/page.tsx` |
| Quên mật khẩu | `/forgot-password` | `frontend/src/app/(auth)/forgot-password/page.tsx` |
| Đặt lại mật khẩu | `/reset-password` | `frontend/src/app/(auth)/reset-password/page.tsx` |
| Dashboard | `/dashboard` | `frontend/src/app/(main)/dashboard/page.tsx` |
| Dự án của tôi | `/my-projects` | `frontend/src/app/(main)/my-projects/page.tsx` |
| Task cá nhân | `/my-tasks` | `frontend/src/app/(main)/my-tasks/page.tsx` |
| Board dự án | `/projects/{id}` | `frontend/src/app/(main)/projects/[id]/page.tsx` |
| Hồ sơ cá nhân | `/profile` | `frontend/src/app/(main)/profile/page.tsx` |
| Quản lý user (Admin) | `/admin/users` | `frontend/src/app/(main)/admin/users/page.tsx` |

### 3.3. Components — Muốn sửa thành phần UI nào, vào file nào?

| Thành phần UI | File |
|---------------|------|
| **Sidebar (menu trái)** | `frontend/src/components/layout/app-sidebar.tsx` |
| **Chuông thông báo** | `frontend/src/components/layout/notification-bell.tsx` |
| **Mục gần đây** | `frontend/src/components/layout/recent-popover.tsx` |
| **Card dự án trên dashboard** | `frontend/src/components/dashboard/project-card.tsx` |
| **Bảng Kanban** | `frontend/src/components/project/kanban-board.tsx` |
| **Cột Kanban** | `frontend/src/components/project/kanban-column.tsx` |
| **Thẻ task kéo thả** | `frontend/src/components/project/draggable-task-card.tsx` |
| **Modal chi tiết task** | `frontend/src/components/project/task-detail-modal.tsx` |
| **Dialog tạo task** | `frontend/src/components/project/create-task-dialog.tsx` |
| **Dialog thêm thành viên** | `frontend/src/components/project/add-member-dialog.tsx` |
| **Dialog cài đặt dự án** | `frontend/src/components/project/project-settings-dialog.tsx` |
| **Dialog lịch sử hoạt động** | `frontend/src/components/project/project-activity-dialog.tsx` |
| **Bộ lọc task** | `frontend/src/components/project/task-filters.tsx` |
| **Header bảng dự án** | `frontend/src/components/project/board-header.tsx` |
| **Tổng quan dự án** | `frontend/src/components/project/project-overview.tsx` |
| **Tổng quan task cá nhân** | `frontend/src/components/project/personal-tasks-overview.tsx` |
| **Board theo thành viên** | `frontend/src/components/project/member-tasks-board.tsx` |
| **Jira header** | `frontend/src/components/project/jira-board/jira-project-header.tsx` |
| **Jira task card** | `frontend/src/components/project/jira-board/jira-task-card.tsx` |
| **Jira column** | `frontend/src/components/project/jira-board/jira-column.tsx` |
| **Jira member column** | `frontend/src/components/project/jira-board/jira-member-column.tsx` |
| **Xem dạng danh sách** | `frontend/src/components/project/jira-board/jira-list-view.tsx` |
| **Xem dạng timeline** | `frontend/src/components/project/jira-board/jira-timeline-view.tsx` |
| **Header task cá nhân** | `frontend/src/components/project/jira-board/my-tasks-header.tsx` |
| **Nút đổi theme** | `frontend/src/components/theme-toggle.tsx` |
| **Nút đổi ngôn ngữ** | `frontend/src/components/language-toggle.tsx` |

### 3.4. Services (Gọi API) — Muốn thay đổi cách giao tiếp với backend

| File | Các hàm |
|------|---------|
| `frontend/src/services/auth.ts` | login, signup, googleLogin, forgotPassword, resetPassword, setPassword |
| `frontend/src/services/user.ts` | getCurrentUser, updateProfile, getUsers, adminGetUsers, adminUpdateUser |
| `frontend/src/services/project.ts` | getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember |
| `frontend/src/services/task.ts` | getTasks, createTask, getTask, updateTask, deleteTask, getComments, createComment, deleteComment, getAttachments, uploadAttachment, deleteAttachment |
| `frontend/src/services/extra.ts` | getNotifications, markAsRead, markAllAsRead, getProjectActivity, getTaskActivity |

### 3.5. Middleware — `frontend/src/middleware.ts`

- Kiểm tra `access_token` trong cookies
- **Trang public** (không cần đăng nhập): `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`
- **Trang protected** (cần đăng nhập): tất cả trang khác
- User đã đăng nhập vào trang auth → redirect về `/dashboard`
- User chưa đăng nhập vào trang protected → redirect về `/login`

---

## 4. Chức năng chính của hệ thống

### 4.1. Xác thực (Authentication)
- Đăng ký/Đăng nhập bằng email + password
- Đăng nhập bằng Google OAuth2
- JWT token (access 30 phút, refresh 7 ngày)
- Quên/đặt lại mật khẩu qua email
- Admin quản lý user (khóa/mở khóa, phân quyền)

### 4.2. Quản lý Dự án (Project Management)
- Tạo/sửa/xóa dự án
- Thêm/xóa thành viên
- Phân quyền Owner/Member
- Xem lịch sử hoạt động dự án

### 4.3. Quản lý Task (Task Management)
- **Task dự án**: tạo trong project, giao cho member
- **Task cá nhân**: tạo riêng, không thuộc project
- Kéo thả trên Kanban board
- Lọc theo status, priority, assignee, deadline
- 3 trạng thái: TODO → IN_PROGRESS → DONE
- 3 mức ưu tiên: LOW, MEDIUM, HIGH
- Ngày bắt đầu và ngày hết hạn

### 4.4. Bình luận & File đính kèm
- Bình luận trên task
- Upload/xóa file đính kèm

### 4.5. Thông báo (Notifications)
- Thông báo trong app (chuông)
- Email thông báo khi: được giao task, thêm vào dự án, deadline thay đổi, có comment mới, task bị xóa, trạng thái thay đổi, bị xóa khỏi dự án
- Tự động kiểm tra task quá hạn mỗi giờ (Celery)

### 4.6. Giao diện
- Dark/Light mode
- Đa ngôn ngữ (i18n)
- Responsive design
- Nhiều chế độ xem: Kanban, List, Timeline, Member board

---

## 5. Hướng dẫn sửa đổi nhanh

### Muốn sửa Backend

| Mục đích | Sửa file | Ghi chú |
|----------|----------|---------|
| Thêm trường DB mới | `API/models.py` | Sau đó chạy `makemigrations` + `migrate` |
| Thay đổi logic xử lý | `API/views.py` | Tìm đúng View class cần sửa |
| Thay đổi data trả về | `API/serializers.py` | Thêm/bớt fields |
| Thêm endpoint mới | `API/urls.py` + `API/views.py` | Tạo view rồi đăng ký URL |
| Thay đổi phân quyền | `API/permissions.py` | Sửa permission class tương ứng |
| Sửa nội dung email | `API/templates/emails/*.html` | Sửa file HTML template |
| Sửa cài đặt hệ thống | `TaskManagementSystem/settings.py` | DB, JWT, CORS, Email... |

### Muốn sửa Frontend

| Mục đích | Sửa file | Ghi chú |
|----------|----------|---------|
| Sửa giao diện 1 trang | `frontend/src/app/.../page.tsx` | Xem bảng Pages ở mục 3.2 |
| Sửa 1 component UI | `frontend/src/components/...` | Xem bảng Components ở mục 3.3 |
| Sửa cách gọi API | `frontend/src/services/*.ts` | Xem bảng Services ở mục 3.4 |
| Thêm route mới | Tạo folder + page.tsx trong `app/` | Next.js file-based routing |
| Sửa logic auth/redirect | `frontend/src/middleware.ts` | Thêm/bớt public routes |
| Sửa cấu hình Axios | `frontend/src/lib/api.ts` | Base URL, interceptors |
| Thêm kiểu dữ liệu | `frontend/src/types/*.ts` | TypeScript interfaces |

---

## 6. Lệnh phát triển

```bash
# Backend
cd d:\TaskManagementSystem_DoAn
.\env\Scripts\Activate.ps1          # Kích hoạt virtual environment
python manage.py runserver           # Chạy backend (port 8000)
python manage.py makemigrations      # Tạo migration sau khi sửa models
python manage.py migrate             # Áp dụng migration vào DB
celery -A TaskManagementSystem worker -l info    # Chạy Celery worker
celery -A TaskManagementSystem beat -l info       # Chạy Celery beat (scheduler)

# Frontend
cd frontend
npm install                          # Cài dependencies
npm run dev                          # Chạy frontend (port 3000)
npm run build                        # Build production
```

---

## 7. API Documentation

Truy cập Swagger UI tại: `http://localhost:8000/api/docs/`
