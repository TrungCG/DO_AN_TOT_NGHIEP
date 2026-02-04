# CONTINUITY.md (Schema v1)
Last updated: 2026-02-04 11:03 (local)

## Goal (incl. success criteria)
- Hoàn tất phát triển frontend cho hệ thống quản lý task.
- Kết nối đầy đủ với backend API.
- Cung cấp UI/UX chuyên nghiệp, chức năng đầy đủ.
- Đang xác minh: Frontend đã phản ánh hết backend API chưa?

## Non-goals
- Phát triển thêm backend (Backend đã hoàn tất)
- Triển khai sản phẩm
- Cấu hình CI/CD
- Bổ sung tính năng mới chưa yêu cầu

## Constraints / Assumptions
- Backend: Django + DRF (đã hoàn tất)
- Frontend: Next.js 15, TypeScript, Tailwind CSS v4, Shadcn UI
- Database: PostgreSQL (đang chạy qua Docker)
- Auth: JWT (SimpleJWT)

## Key decisions
- (2026-01-29 15:04) Decision: Frontend hoàn tất - chuyển sang trạng thái vận hành | Rationale: Ứng dụng đã đầy đủ tính năng theo yêu cầu | Trade-off: Không phát triển thêm tính năng chưa yêu cầu
- (2026-01-29 15:15) Decision: Triển khai Dark Mode | Rationale: Cải thiện UX, giảm mỏi mắt khi dùng ban đêm | Trade-off: Thêm state management cho theme, không cần backend hỗ trợ
- (2026-02-04 10:41) Decision: Thực hiện audit backend vs frontend | Rationale: Kiểm tra xem frontend đã kết nối đủ API chưa | Trade-off: Phải đọc toàn bộ code backend/frontend (bootstrap limits)
- (2026-02-04 10:45) Decision: Triển khai toàn bộ missing features | Rationale: Hoàn thiện 100% frontend phản ánh backend API | Trade-off: Tăng scope công việc, nhưng đảm bảo hệ thống đầy đủ chức năng

## Known issues / Fixes (anti-repeat)
- Keep max 10 items. Older details: ARCHIVE.md#Known-issues
- (2026-01-25 09:48) Symptom: Django connection refused to localhost:5432.
  - Cause: PostgreSQL not running locally.
  - Fix: User runs 'docker compose up -d' manually.

## Risks / Watchouts
- Docker credential helper issues on host machine (GPG error).

## State
### Done
- Khám phá kiến trúc backend
- Phân tích API, models, permissions
- Tạo docker-compose.yml và cấu hình database
- Triển khai Next.js frontend đầy đủ tính năng
- Kết nối frontend với backend API
- Triển khai giao diện Kanban board
- Triển khai hệ thống authentication/authorization
- Triển khai quản lý tasks, projects, comments
- Triển khai drag-and-drop và file attachments
- Triển khai Dark Mode (3 chế độ: Sáng, Tối, Hệ thống)
- Sửa tất cả lỗi TypeScript và warnings nghiêm trọng
- Audit backend vs frontend coverage
- Quyết định triển khai toàn bộ missing features
- ✅ Hoàn tất triển khai tất cả missing features:
  1. ✅ Notifications System (service + UI với NotificationBell component)
  2. ✅ Token Refresh mechanism (improved với queue handling)
  3. ✅ Password Management (Forgot/Reset/Set Password pages)
  4. ✅ Comment Update (Edit + Delete trong task detail modal)
  5. ✅ Google Login (UI placeholder - cần Google Client ID để activate)
  6. ✅ User Profile page (account info + change password)
- ✅ Fix tất cả TypeScript errors (any types, unused imports)
- ✅ Code review hoàn tất - sửa các lỗi:
  - activityService: xóa unused projectId param
  - notification-bell: xóa unused Separator import
  - app-sidebar: xóa unused Settings import
  - task-detail-modal: fix projectId param (prefix underscore)
  - reset-password: wrap useSearchParams với Suspense (Next.js 14+ requirement)
### Now
- ✅ Frontend đã hoàn tất 100% coverage với backend API
- ✅ Code review passed - 0 TypeScript errors
- Chỉ còn warnings về CSS class naming (không ảnh hưởng logic)
### Next
- Test toàn bộ features mới với backend
- Verify notifications polling hoạt động
- Test password reset flow end-to-end
- Cấu hình Google OAuth (nếu cần)

## Open questions
- CONFIRMED: Google Login UI ready, cần GOOGLE_CLIENT_ID để activate
- CONFIRMED: Notifications polling interval 30s (có thể điều chỉnh)
- UNCONFIRMED: Có cần thêm unit tests cho features mới không?
- UNCONFIRMED: User profile có cần thêm avatar upload không?

## Working set (files / commands / links)
- Entry points: manage.py (backend), package.json (frontend)
- Key files: API models/views (backend), app/ routes (frontend), theme-provider.tsx (Dark Mode)
- Commands: docker compose up -d, npm run dev, python manage.py runserver
- Theme toggle: Click icon ☀️/🌙 ở sidebar góc trên bên phải
- Audit findings (HOÀN TẤT):
  - ✅ Projects, Tasks, Comments (full CRUD), Attachments, Activity Logs, Users
  - ✅ Password Management (Forgot/Reset/Set)
  - ✅ Google Login (UI ready, cần config)
  - ✅ Notifications (service + UI + polling)
  - ✅ Comment Update/Delete
  - ✅ Token Refresh (auto-refresh với queue)
  - ✅ User Profile (info + change password)
- New files created:
  - frontend/src/components/layout/notification-bell.tsx
  - frontend/src/app/(auth)/forgot-password/page.tsx
  - frontend/src/app/(auth)/reset-password/page.tsx
  - frontend/src/app/(main)/profile/page.tsx
- Updated files:
  - frontend/src/services/extra.ts (notification + comment update)
  - frontend/src/lib/api.ts (improved token refresh)
  - frontend/src/types/extra.ts (Notification type)
  - frontend/src/components/layout/app-sidebar.tsx (Notification bell + Profile link)
  - frontend/src/components/project/task-detail-modal.tsx (Comment edit/delete)
  - frontend/src/app/(auth)/login/page.tsx (Forgot password link + Google login button)
- Code review fixes:
  - frontend/src/services/extra.ts (removed unused projectId param)
  - frontend/src/components/layout/notification-bell.tsx (removed unused import)
  - frontend/src/components/layout/app-sidebar.tsx (removed unused import)
  - frontend/src/app/(auth)/reset-password/page.tsx (added Suspense wrapper)
