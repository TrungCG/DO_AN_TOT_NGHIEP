# 🗂️ Task Management System API  
**Hệ thống Quản lý Công việc & Giao tiếp trên nền tảng Web (RESTful API)**

Task Management System API là một RESTful API được xây dựng bằng **Django** và **Django REST Framework**, mô phỏng các chức năng cốt lõi của các hệ thống quản lý công việc và làm việc nhóm chuyên nghiệp như **Trello**, **Asana**, **Jira**, hay **Slack**.

Dự án tập trung vào việc xây dựng backend có kiến trúc rõ ràng, phân quyền chặt chẽ, hỗ trợ quản lý công việc, giao tiếp nhóm và có khả năng mở rộng trong thực tế.

---

## 📑 Mục lục
1. [Giới thiệu & Mục tiêu](#1-giới-thiệu--mục-tiêu)
2. [Các tính năng chính](#2-các-tính-năng-chính)
3. [Công nghệ sử dụng](#3-công-nghệ-sử-dụng)
4. [Thiết kế hệ thống & ERD](#4-thiết-kế-hệ-thống--erd)
5. [Tài liệu API](#5-tài-liệu-api)
6. [Xác thực nâng cao](#6-xác-thực-nâng-cao)
7. [Chat & Giao tiếp thời gian thực](#7-chat--giao-tiếp-thời-gian-thực)
8. [Hướng dẫn cài đặt & chạy dự án](#8-hướng-dẫn-cài-đặt--chạy-dự-án)
9. [Triển khai (Deployment)](#9-triển-khai-deployment)
10. [Hướng phát triển](#10-hướng-phát-triển)

---

## 1. Giới thiệu & Mục tiêu

### 🎯 Mục tiêu dự án
- Xây dựng một RESTful API hoàn chỉnh cho hệ thống quản lý công việc
- Áp dụng JWT Authentication và phân quyền người dùng
- Mô phỏng nghiệp vụ thực tế của hệ thống làm việc nhóm
- Làm nền tảng backend cho web app hoặc mobile app

---

## 2. Các tính năng chính

### 🔐 Xác thực người dùng
- Đăng ký tài khoản
- Đăng nhập bằng JWT
- Phân biệt người dùng đã xác thực và chưa xác thực

### 📁 Quản lý dự án
- Tạo, cập nhật, xóa dự án
- Phân quyền **Owner** và **Member**
- Thêm / xóa thành viên dự án
- Chỉ Owner mới có quyền quản lý dự án

### ✅ Quản lý công việc
- Công việc theo dự án
- Công việc cá nhân (Personal Tasks)
- Giao việc cho thành viên
- Trạng thái: To Do / In Progress / Done
- Độ ưu tiên và thời hạn hoàn thành

### 💬 Tương tác & cộng tác
- Bình luận trong công việc
- Đính kèm tệp tin
- Phân quyền sửa / xóa bình luận và tệp đính kèm

### 🕒 Nhật ký hoạt động
- Ghi nhận các hoạt động quan trọng
- Theo dõi lịch sử theo dự án và công việc

### 🔎 Tìm kiếm & lọc
- Lọc theo trạng thái, độ ưu tiên, người được giao
- Tìm kiếm theo tiêu đề công việc

---

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ |
|----------|----------|
| Backend | Python, Django |
| API Framework | Django REST Framework |
| Database | SQLite (dev), PostgreSQL (prod) |
| Authentication | JWT (SimpleJWT) |
| Filtering | django-filter |
| API Docs | drf-spectacular |
| File Upload | Pillow |

---

## 4. Thiết kế hệ thống & ERD

### 📊 Tổng quan thực thể
- User
- Project
- Task (Project Task & Personal Task)
- Comment
- Attachment
- ActivityLog
- ChatRoom
- Message

---

## 5. Tài liệu API

Dự án tích hợp **Swagger UI** thông qua `drf-spectacular`.

📌 Truy cập: http://127.0.0.1:8000/api/docs/

🔑 Tất cả endpoint (trừ `/signup/`, `/login/`) đều yêu cầu:


---

## 6. Xác thực nâng cao

### 6.1. Đăng nhập bằng Google (Social Login)

Hệ thống được thiết kế sẵn sàng tích hợp đăng nhập bằng Google thông qua **OAuth 2.0**.

**Luồng nghiệp vụ:**
1. Người dùng chọn “Đăng nhập bằng Google”
2. Xác thực với Google
3. Backend nhận email đã xác thực
4. Tạo mới hoặc đăng nhập người dùng
5. Trả về JWT token

📌 *Chức năng hiện được mô tả ở mức nghiệp vụ, sẵn sàng triển khai trong giai đoạn phát triển tiếp theo.*

---

### 6.2. Quên mật khẩu (Forgot Password)

Chức năng hỗ trợ người dùng khôi phục mật khẩu thông qua email.

**Luồng nghiệp vụ:**
1. Người dùng nhập email
2. Hệ thống tạo token khôi phục có thời hạn
3. Gửi email chứa link reset mật khẩu
4. Người dùng đặt lại mật khẩu mới

📌 *Giải pháp đảm bảo an toàn và không tiết lộ thông tin người dùng.*

---

## 7. Chat & Giao tiếp thời gian thực

Hệ thống Chat hỗ trợ **giao tiếp nội bộ**, bao gồm **chat theo dự án** và **chat riêng lẻ (Direct Message)**.

---

### 7.1. Chat theo Project
- Mỗi dự án có một phòng chat riêng
- Chỉ Owner và Member của dự án được tham gia
- Phục vụ trao đổi công việc chung
- Lưu trữ lịch sử chat theo dự án

**Luồng:**
1. User truy cập dự án
2. Hệ thống kiểm tra quyền thành viên
3. User tham gia phòng chat
4. Gửi / nhận tin nhắn realtime

---

### 7.2. Chat riêng lẻ (Direct Message)
- Chat 1–1 giữa hai người dùng
- Không phụ thuộc dự án
- Phòng chat được tạo tự động khi bắt đầu trò chuyện
- Chỉ hai người tham gia mới truy cập được

---

### 7.3. Phân quyền & Bảo mật
- Chat Project: chỉ thành viên dự án
- Chat riêng: chỉ hai người tham gia
- Tin nhắn gắn với người gửi và thời gian
- Xác thực bằng JWT

---

### 7.4. Công nghệ đề xuất
- WebSocket
- Django Channels
- Redis
- PostgreSQL

📌 *Chức năng Chat được thiết kế ở mức kiến trúc, sẵn sàng triển khai trong giai đoạn tiếp theo.*

---

## 8. Hướng dẫn cài đặt & chạy dự án

```bash
git clone https://github.com/TrungCG/TaskManagementSystem.git
cd TaskManagementSystem
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
---

## 9. Triển khai (Deployment)
- Client → Nginx → Gunicorn → Django → PostgreSQL
- DEBUG = False
- Sử dụng biến môi trường (.env)
- Collect static files
- Reverse proxy bằng Nginx

---

## 10. Hướng phát triển
- Đăng nhập mạng xã hội (Google, GitHub)
- Chat realtime hoàn chỉnh
- Gửi file trong chat
- Trạng thái online / offline
- Thông báo realtime
- Phân quyền nâng cao
- Tích hợp frontend (React / Vue)
- Mobile App (Flutter / React Native)