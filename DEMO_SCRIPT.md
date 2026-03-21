# KỊCH BẢN DEMO SẢN PHẨM CHI TIẾT
# HỆ THỐNG QUẢN LÝ CÔNG VIỆC — TASK MANAGEMENT SYSTEM

> **Hướng dẫn đọc:** Mỗi bước demo gồm:
> - **[Thao tác]** — Hành động cụ thể trên màn hình
> - **[Nói]** — Lời thuyết trình kèm theo
> - **[Chỉ ra]** — Vị trí cụ thể trên giao diện cần chỉ cho hội đồng thấy

---

## 📋 CHUẨN BỊ TRƯỚC KHI DEMO

### Dữ liệu cần có sẵn:
- [ ] **Tài khoản Admin**: admin / admin123 (is_staff = True)
- [ ] **Tài khoản Owner**: trungcg / password123
- [ ] **Tài khoản Member**: member01 / password123
- [ ] **2 dự án** đã tạo sẵn, mỗi dự án có 5-8 task ở các trạng thái khác nhau
- [ ] **Task quá hạn** (due_date trước ngày hôm nay, status TODO hoặc IN_PROGRESS)
- [ ] **Vài bình luận** trên task
- [ ] **Vài file đính kèm** trên task
- [ ] **Task cá nhân** 3-5 cái ở các trạng thái khác nhau
- [ ] **Thông báo** chưa đọc (tạo bằng cách giao task, thêm member trước đó)

### Mở sẵn:
- [ ] Tab 1: http://localhost:3000 (chưa đăng nhập)
- [ ] Tab 2: Email inbox (để show email thông báo)
- [ ] Terminal: Backend + Frontend + Celery đang chạy
- [ ] Tab 3 (dự phòng): http://localhost:8000/api/docs/ (Swagger)

---

## PHẦN 1: TRANG CHỦ & ĐĂNG KÝ / ĐĂNG NHẬP
**⏱ Thời gian: 4-5 phút**

---

### Bước 1.1: Trang Landing Page

**[Thao tác]** Mở Tab 1 — trang http://localhost:3000

**[Nói]**
> "Đây là trang chủ của hệ thống Task Management. Khi người dùng chưa đăng nhập, họ sẽ thấy trang giới thiệu sản phẩm."

**[Chỉ ra]**
- Thanh navigation phía trên: Logo **"Task Manager"** bên trái, nút **"Đăng nhập"** và **"Đăng ký"** bên phải
- Phần Hero: tiêu đề lớn **"Quản lý công việc hiệu quả cho đội nhóm của bạn"**
- 3 feature cards phía dưới với các icon: ✅ Quản lý task, 👥 Làm việc nhóm, 📊 Theo dõi tiến độ
- Footer bản quyền

**[Nói]**
> "Trang được thiết kế responsive — nếu thu nhỏ trình duyệt, giao diện sẽ tự điều chỉnh phù hợp với mobile."

---

### Bước 1.2: Đăng ký tài khoản mới

**[Thao tác]** Nhấn nút **"Đăng ký"** trên thanh navigation

**[Nói]**
> "Hệ thống hỗ trợ đăng ký tài khoản mới. Giao diện chia làm 2 phần: bên trái là phần giới thiệu, bên phải là form đăng ký."

**[Chỉ ra]**
- Panel trái: logo **"CG SoftWare"**, tiêu đề *"Tạo tài khoản"*, 3 feature cards
- Panel phải: form đăng ký

**[Thao tác]** Điền form đăng ký:
- First name: `Demo`
- Last name: `User`
- Username: `demouser`
- Email: `demo@example.com`
- Password: `demo1234`
- Confirm password: `demo1234`

**[Nói]**
> "Form có validation ở cả Frontend và Backend. Password yêu cầu tối thiểu 8 ký tự. Nếu username hoặc email đã tồn tại, Backend sẽ trả lỗi."

**[Thao tác]** Thử nhập password ngắn (VD: `123`) → Chỉ ra thông báo lỗi validation

**[Nói]**
> "Như thầy/cô thấy, hệ thống validate ngay ở Frontend trước khi gửi lên server, giúp trải nghiệm người dùng mượt mà hơn."

**[Thao tác]** Sửa lại password đúng → Nhấn **"Đăng ký"**

**[Nói]**
> "Sau khi đăng ký thành công, hệ thống tự động đăng nhập và chuyển về Dashboard. Password được mã hóa bằng PBKDF2, không lưu dạng text thường."

---

### Bước 1.3: Đăng xuất và Đăng nhập lại

**[Thao tác]** Nhấn vào avatar/tên user ở sidebar → **Đăng xuất**

**[Thao tác]** Thử truy cập http://localhost:3000/dashboard

**[Nói]**
> "Hệ thống có Middleware bảo vệ route. Khi chưa đăng nhập mà truy cập trang cần xác thực, sẽ tự động chuyển về trang Login."

**[Chỉ ra]** URL đã chuyển về `/login`

**[Thao tác]** Đăng nhập bằng tài khoản Owner:
- Username: `trungcg`
- Password: `password123`
- Nhấn **"Đăng nhập"**

**[Nói]**
> "Hệ thống sử dụng JWT — JSON Web Token. Khi đăng nhập thành công, server trả về access token (hạn 30 phút) và refresh token (hạn 7 ngày). Khi access token hết hạn, hệ thống tự động dùng refresh token để lấy token mới mà không cần đăng nhập lại."

---

### Bước 1.4: Đăng nhập bằng Google

**[Thao tác]** Đăng xuất → Quay lại trang Login

**[Chỉ ra]** Nút **"Đăng nhập bằng Google"** phía dưới form

**[Nói]**
> "Hệ thống tích hợp Google OAuth2. Khi người dùng nhấn nút này, Google sẽ hiển thị popup chọn tài khoản. Sau khi chọn, Google trả về ID Token — backend sẽ verify token này với Google API, rồi tạo hoặc tìm tài khoản tương ứng, và trả JWT token cho frontend."

**[Thao tác]** Nhấn nút Google → Chọn tài khoản Google → Đăng nhập thành công

**[Nói]**
> "Nếu email Google đã có tài khoản trong hệ thống, sẽ link vào tài khoản cũ. Nếu chưa có, tạo tài khoản mới tự động. User đăng nhập bằng Google cũng có thể đặt mật khẩu riêng sau."

---

### Bước 1.5: Quên mật khẩu

**[Thao tác]** Đăng xuất → Quay lại trang Login → Nhấn link **"Quên mật khẩu?"**

**[Chỉ ra]** Trang "Khôi phục mật khẩu" với form nhập email

**[Thao tác]** Nhập email → Nhấn **"Gửi"**

**[Chỉ ra]** Màn hình thành công hiện icon ✉️, hiển thị email đã gửi, nút "Gửi lại email" và "Quay về đăng nhập"

**[Nói]**
> "Hệ thống tạo một token UUID4 duy nhất, có thời hạn sử dụng, và chỉ dùng được 1 lần. Email gửi dạng HTML đẹp mắt chứa link reset password. Hệ thống cũng không tiết lộ email có tồn tại hay không — đây là biện pháp chống tấn công enumeration."

**[Thao tác]** Mở Tab 2 (Email) → Show email reset password nhận được

**[Chỉ ra]** Email HTML template đẹp mắt với link reset

---

## PHẦN 2: DASHBOARD & QUẢN LÝ DỰ ÁN
**⏱ Thời gian: 5-6 phút**

---

### Bước 2.1: Tổng quan Dashboard

**[Thao tác]** Đăng nhập bằng tài khoản `trungcg` → Vào Dashboard

**[Nói]**
> "Sau khi đăng nhập, người dùng thấy Dashboard — tổng quan toàn bộ công việc và dự án."

**[Chỉ ra lần lượt]**

1. **Lời chào cá nhân hóa** phía trên: "Chào buổi sáng/chiều/tối, trungcg" (thay đổi theo thời gian thực)

2. **4 thẻ thống kê:**
   - Tỷ lệ hoàn thành task (thanh progress bar)
   - Số task TODO / IN PROGRESS / DONE
   - Số task độ ưu tiên cao (HIGH)

3. **Các section nhanh:**
   - **Task hôm nay** — danh sách task đến hạn hôm nay
   - **Task quá hạn** — icon ⚠️ cảnh báo đỏ, hiển thị các task đã trễ deadline
   - **Task sắp tới** — task trong 7 ngày tới
   - **Task ưu tiên cao** — task có priority HIGH

4. **Danh sách dự án** — grid các project card:
   - Tên dự án, mô tả
   - Số thành viên
   - Thanh tiến độ task (progress bar)

**[Nói]**
> "Dashboard giúp người dùng nhìn nhanh tình trạng công việc mà không cần vào từng dự án. Đặc biệt, task quá hạn được highlight màu đỏ để dễ nhận biết."

---

### Bước 2.2: Sidebar điều hướng

**[Chỉ ra]** Sidebar bên trái

**[Nói]**
> "Sidebar luôn hiển thị với các menu chính."

**[Chỉ ra từng mục]**
- **Logo** "CG SoftWare" phía trên
- **Avatar + tên user + email** — nhấn vào sẽ đi tới trang Profile
- **Dashboard** (icon bảng điều khiển)
- **Task cá nhân** (icon danh sách) — có **badge đếm số** task
- **Dự án của tôi** (icon thư mục) — có **badge đếm số** dự án
- **Task hôm nay** — section có thể thu gọn, hiển thị task đến hạn hôm nay với màu ưu tiên

**[Chỉ ra]** Góc trên phải:
- **Chuông thông báo** 🔔 — có badge đỏ hiển thị số thông báo chưa đọc
- **Nút đổi Dark/Light mode** 🌙/☀️
- **Nút đổi ngôn ngữ** 🌐 (VN ↔ EN)

---

### Bước 2.3: Trang "Dự án của tôi"

**[Thao tác]** Nhấn **"Dự án của tôi"** trên sidebar

**[Nói]**
> "Trang này hiển thị tất cả dự án mà người dùng tham gia, dù là Owner hay Member."

**[Chỉ ra]** Thanh công cụ phía trên:
- **Ô tìm kiếm** — tìm dự án theo tên
- **Nút "Tạo dự án"** (icon +)
- **Nút chuyển đổi Grid/List** — 2 chế độ xem
- **Dropdown sắp xếp**: theo tên, ngày tạo, ngày cập nhật, số thành viên
- **Bộ lọc vai trò**: Tất cả / Owner / Member

**[Thao tác]** Nhấn nút chuyển từ **Grid → List** và ngược lại

**[Nói]**
> "Người dùng có thể chuyển đổi giữa xem dạng lưới và dạng danh sách tùy theo sở thích."

**[Chỉ ra]** Một project card:
- Tên dự án (tiêu đề)
- Mô tả ngắn
- Thông tin ngày tạo
- **Thanh tiến độ** — VD: "3/10 tasks" với progress bar
- **Avatar thành viên** — hiển thị ảnh đại diện các member
- **Badge vai trò** — Owner hoặc Member

---

### Bước 2.4: Tạo dự án mới

**[Thao tác]** Nhấn nút **"Tạo dự án"** (icon +)

**[Chỉ ra]** Dialog modal hiện ra

**[Thao tác]** Điền thông tin:
- Tên dự án: `Dự án Demo Phản Biện`
- Mô tả: `Dự án demo cho buổi bảo vệ đồ án tốt nghiệp`
- Nhấn **"Lưu"**

**[Nói]**
> "Khi tạo dự án, người tạo tự động trở thành Owner và được thêm vào danh sách thành viên. Hệ thống cũng tự động ghi nhận vào nhật ký hoạt động."

**[Chỉ ra]** Dự án mới xuất hiện trong danh sách

---

### Bước 2.5: Thêm thành viên vào dự án

**[Thao tác]** Nhấn vào dự án vừa tạo → Vào trang Board dự án

**[Thao tác]** Nhấn nút **"Thêm thành viên"** trên header

**[Chỉ ra]** Dialog "Thêm thành viên vào dự án" hiện ra:
- **Ô tìm kiếm** dạng combobox: "Tìm kiếm người dùng..."
- Nhấn vào → hiện **command palette** với ô "Nhập tên hoặc email..."

**[Thao tác]** Gõ `member` → Danh sách user xuất hiện → Chọn `member01`

**[Chỉ ra]** User được chọn hiển thị dấu ✓

**[Thao tác]** Nhấn **"Thêm"**

**[Nói]**
> "Khi thêm thành viên, hệ thống thực hiện 3 việc:
> 1. Thêm user vào danh sách members của dự án
> 2. Gửi email thông báo lời mời tham gia dự án
> 3. Tạo thông báo in-app cho member mới"

**[Thao tác]** Mở Tab 2 (Email) → Show email thông báo mời tham gia dự án

**[Chỉ ra]** Email HTML template "Project Invitation" đẹp mắt

---

### Bước 2.6: Cài đặt dự án & Xóa thành viên

**[Thao tác]** Nhấn nút **Settings** (icon ⚙️) trên header dự án

**[Chỉ ra]** Dialog "Cài đặt dự án" gồm 3 phần:

1. **Thông tin dự án:**
   - Ô nhập tên dự án (có thể sửa)
   - Ô mô tả (có thể sửa)
   - Nút **"Lưu"**

2. **Danh sách thành viên:**
   - Số lượng thành viên
   - Danh sách scrollable: avatar + tên + vai trò
   - Nút **X** để xóa thành viên (chỉ Owner thấy)

3. **Vùng nguy hiểm (Danger Zone):**
   - Nút **"Xóa dự án"** màu đỏ
   - Có dialog confirm trước khi xóa

**[Thao tác]** Nhấn nút X bên cạnh `member01` → Hiện dialog xác nhận → Nhấn **"Xóa"**

**[Nói]**
> "Chỉ Owner mới có quyền xóa thành viên. Owner không thể tự xóa chính mình. Khi xóa, hệ thống gửi email thông báo cho người bị xóa, và task đang giao cho người đó sẽ reset về chưa giao."

**[Thao tác]** Thêm lại `member01` để tiếp tục demo

---

## PHẦN 3: QUẢN LÝ CÔNG VIỆC — KANBAN BOARD *(Phần quan trọng nhất)*
**⏱ Thời gian: 8-10 phút**

---

### Bước 3.1: Bảng Kanban — Tổng quan

**[Thao tác]** Vào dự án đã có sẵn data (dự án chuẩn bị trước)

**[Nói]**
> "Đây là tính năng cốt lõi của hệ thống — bảng Kanban tương tự Trello, cho phép quản lý công việc bằng kéo thả trực quan."

**[Chỉ ra]** Bảng Kanban gồm 3 cột:
- **TODO** (⚠️ icon, nền xám) — công việc chờ làm
- **IN PROGRESS** (🕐 icon, nền xanh dương) — đang thực hiện
- **DONE** (✅ icon, nền xanh lá) — đã hoàn thành
- Mỗi cột hiển thị **tên + số lượng task**

**[Chỉ ra]** Một task card trên board:
- Tiêu đề task
- Badge **độ ưu tiên** có màu: 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW
- Badge **trạng thái**
- **Avatar** người được giao
- **Ngày hết hạn** — đỏ nếu quá hạn

---

### Bước 3.2: Kéo thả Task (Drag & Drop)

**[Nói]**
> "Em sẽ demo tính năng kéo thả — thay đổi trạng thái task chỉ bằng cách kéo sang cột khác."

**[Thao tác]** Dùng chuột **kéo** 1 task từ cột **TODO** → thả vào cột **IN PROGRESS**

**[Chỉ ra]** Task đã chuyển sang cột IN PROGRESS, trạng thái tự động cập nhật

**[Nói]**
> "Khi kéo thả, Frontend gọi API update task với status mới. Đồng thời:
> - Gửi email thông báo thay đổi trạng thái cho người được giao
> - Ghi nhận vào nhật ký hoạt động
> - Tạo thông báo in-app"

**[Thao tác]** Kéo task từ **IN PROGRESS** → **DONE**

**[Nói]**
> "Hệ thống sử dụng thư viện @dnd-kit — thư viện kéo thả hiện đại cho React, hỗ trợ cả touch trên mobile và keyboard cho accessibility."

---

### Bước 3.3: Tạo Task mới

**[Thao tác]** Nhấn nút **"Thêm công việc mới"** (hoặc nút + trên cột)

**[Chỉ ra]** Dialog "Thêm công việc mới" hiện ra với các trường:

**[Thao tác]** Điền form:
- **Tiêu đề**: `Thiết kế giao diện trang chủ` (placeholder gợi ý "Code frontend...")
- **Mô tả**: `Thiết kế responsive cho desktop và mobile`
- **Độ ưu tiên**: Chọn dropdown → **HIGH** (Cao)
- **Ngày hết hạn**: Nhấn nút chọn ngày → Chọn trên **calendar popover** → chọn ngày mai

**[Thao tác]** Nhấn **"Lưu"**

**[Chỉ ra]** Task mới xuất hiện ở cột **TODO** với badge đỏ HIGH

**[Nói]**
> "Task vừa tạo mặc định ở trạng thái TODO. Tiếp theo em sẽ giao task này cho thành viên."

---

### Bước 3.4: Xem chi tiết Task & Giao việc

**[Thao tác]** **Click** vào task vừa tạo → Mở **Task Detail Modal**

**[Nói]**
> "Đây là modal chi tiết task — hiển thị tất cả thông tin và cho phép chỉnh sửa."

**[Chỉ ra]** Modal chi tiết gồm:

**Phần trên:**
- **Tiêu đề task** (có thể sửa trực tiếp)
- Nút đóng modal

**Phần thông tin chính:**
- **Status dropdown**: TODO / IN PROGRESS / DONE — chọn để thay đổi trạng thái
- **Priority dropdown**: LOW / MEDIUM / HIGH — có màu sắc tương ứng
- **Assignee selector**: combobox chọn người được giao từ danh sách thành viên
- **Due date picker**: chọn ngày trên lịch
- **Description**: textarea mô tả chi tiết
- **Notes**: ghi chú bổ sung

**[Thao tác]** Nhấn vào **Assignee selector** → Chọn `member01`

**[Nói]**
> "Khi giao task cho thành viên, hệ thống tự động:
> 1. Gửi email thông báo 'Task Assigned' cho member01
> 2. Tạo thông báo in-app
> 3. Ghi vào Activity Log: 'trungcg đã giao task cho member01'"

**[Thao tác]** Mở Tab email → Show email "Task Assigned" mà member01 nhận được

**[Chỉ ra]** Email HTML đẹp mắt với tên task, dự án, deadline

---

### Bước 3.5: Tab Bình luận (Comments)

**[Thao tác]** Trong Task Detail Modal → Nhấn tab **"Comments"**

**[Chỉ ra]** Phần bình luận:
- **Ô nhập bình luận** phía dưới
- **Danh sách comment** đã có (nếu có): avatar + tên + thời gian + nội dung

**[Thao tác]** Gõ bình luận: `Nhớ thiết kế cho cả mobile nhé!` → Nhấn **"Gửi"**

**[Chỉ ra]** Comment mới xuất hiện với avatar, tên user, thời gian "vừa xong"

**[Nói]**
> "Khi có comment mới, hệ thống gửi email thông báo cho người được giao task và owner dự án. Chỉ tác giả comment hoặc Owner dự án mới có quyền sửa/xóa comment."

**[Thao tác]** Hover vào comment → Chỉ ra nút **Sửa** và **Xóa**

---

### Bước 3.6: Tab File đính kèm (Attachments)

**[Thao tác]** Trong Task Detail Modal → Chỉ ra phần **Attachments**

**[Chỉ ra]** Khu vực file đính kèm:
- Danh sách file đã upload (nếu có): tên file, nút tải về, nút xóa
- Khu vực upload file (kéo thả hoặc chọn file)

**[Thao tác]** Kéo thả 1 file vào khu vực upload (hoặc nhấn chọn file)

**[Chỉ ra]** File đã được upload — hiển thị tên file, người upload, thời gian

**[Nói]**
> "Hệ thống hỗ trợ đính kèm nhiều loại file: hình ảnh, document, PDF... File lưu trên server trong thư mục attachments/. Chỉ người upload hoặc Owner dự án mới được xóa file."

---

### Bước 3.7: Tab Lịch sử hoạt động (Activity)

**[Thao tác]** Trong Task Detail Modal → Nhấn tab **"Activity"**

**[Chỉ ra]** Danh sách lịch sử:
- Mỗi dòng ghi nhận: **ai** làm **gì** vào **lúc nào**
- VD: "trungcg đã tạo task" — 5 phút trước
- VD: "trungcg đã giao task cho member01" — 3 phút trước
- VD: "trungcg đã thay đổi trạng thái từ TODO sang IN PROGRESS" — 2 phút trước
- VD: "trungcg đã bình luận" — 1 phút trước

**[Nói]**
> "Mỗi hành động trên task đều được ghi nhận tự động. Điều này giúp truy vết được ai đã làm gì, khi nào — rất quan trọng trong quản lý dự án thực tế."

---

### Bước 3.8: Xóa Task

**[Thao tác]** Trong Task Detail Modal → Nhấn nút **"Xóa task"** (icon thùng rác)

**[Chỉ ra]** Dialog xác nhận: "Bạn có chắc chắn muốn xóa task này?"

**[Nói]**
> "Khi xóa task, hệ thống gửi email thông báo cho người được giao (nếu có). Chỉ Owner dự án mới có quyền xóa task."

**[Thao tác]** Nhấn **"Hủy"** (không xóa thật để giữ data demo)

---

## PHẦN 4: CÁC CHẾ ĐỘ XEM (VIEW MODES)
**⏱ Thời gian: 4-5 phút**

---

### Bước 4.1: Chuyển đổi chế độ xem

**[Chỉ ra]** Tabs trên header dự án: **Board** | **List** | **Calendar** | **Timeline** | **Summary**

**[Nói]**
> "Hệ thống hỗ trợ 5 chế độ xem khác nhau, mỗi chế độ phù hợp với một nhu cầu quản lý riêng."

---

### Bước 4.2: Xem dạng Danh sách (List View)

**[Thao tác]** Nhấn tab **"List"**

**[Chỉ ra]** Giao diện dạng bảng:
- **Thanh công cụ**: ô tìm kiếm, nút lọc (với badge đếm filter đang áp dụng), nút chuyển Table/Split, nút refresh, nút cấu hình cột
- **Bảng dữ liệu** với các cột:
  - ☑️ Checkbox chọn nhiều
  - **ID** (VD: PROJECT-001)
  - **Tiêu đề** task (click để mở chi tiết)
  - **Độ ưu tiên** (badge có màu)
  - **Trạng thái** (badge)
  - **Người được giao** (avatar)
  - **Ngày hết hạn**
  - **Ngày tạo**
  - **Actions** (menu ⋮)

**[Thao tác]** Nhấn vào tiêu đề cột → Sắp xếp tăng/giảm dần (↑↓)

**[Nói]**
> "Dạng danh sách cho phép xem tổng quát nhiều task, sắp xếp theo cột, và tìm kiếm nhanh."

**[Thao tác]** Nhấn nút **"Split View"**

**[Chỉ ra]** Giao diện chia đôi:
- **Bên trái**: Bảng danh sách task
- **Bên phải**: Chi tiết task đang chọn — comment + activity log
- **Ô nhập comment** trực tiếp bên phải

**[Nói]**
> "Chế độ Split View cho phép xem chi tiết task và bình luận mà không cần mở modal, tương tự giao diện Jira."

---

### Bước 4.3: Xem dạng Timeline

**[Thao tác]** Nhấn tab **"Timeline"**

**[Chỉ ra]** Giao diện timeline/Gantt:
- **Thanh công cụ**: tìm kiếm, lọc, nút chuyển **Tuần/Tháng/Quý**, mũi tên điều hướng ◀ ▶
- **Header timeline**: nhãn tuần/tháng với ngày tháng
- **Đường kẻ ngày hiện tại** — highlight
- **Các thanh task** nằm ngang trên timeline:
  - Màu xanh lá = DONE
  - Màu xanh dương = IN PROGRESS
  - Màu xám = TODO
  - Chiều dài thanh = thời gian từ start_date đến due_date

**[Thao tác]** Chuyển đổi **Tuần → Tháng → Quý**

**[Nói]**
> "Timeline View giúp theo dõi lịch trình tổng thể. Người dùng có thể kéo thanh task để thay đổi ngày bắt đầu/kết thúc trực tiếp trên timeline."

**[Thao tác]** **Kéo** thanh task để thay đổi ngày (nếu có) → Chỉ ra ngày cập nhật

---

### Bước 4.4: Xem dạng Summary (Tổng quan)

**[Thao tác]** Nhấn tab **"Summary"**

**[Chỉ ra]** Giao diện tổng quan gồm:
- **Thẻ thống kê**: Tổng task, Tỷ lệ hoàn thành %, Số quá hạn, Đến hạn hôm nay
- **Biểu đồ tròn phân bố theo trạng thái** (TODO / IN PROGRESS / DONE) — có legend số lượng + %
- **Biểu đồ tròn phân bố theo ưu tiên** (HIGH / MEDIUM / LOW) — có legend
- **Thống kê deadline**: quá hạn / hôm nay / tuần này

**[Nói]**
> "Summary View cho Owner/Manager cái nhìn tổng quan nhanh về tình trạng dự án mà không cần xem từng task."

---

## PHẦN 5: BỘ LỌC & TÌM KIẾM
**⏱ Thời gian: 2-3 phút**

---

### Bước 5.1: Sử dụng bộ lọc

**[Thao tác]** Quay lại tab **Board** → Nhìn vào thanh lọc phía trên board

**[Chỉ ra]** Các thành phần bộ lọc:
- **Ô tìm kiếm** (icon 🔍) — tìm theo tiêu đề task, có nút X xóa
- **Filter dropdowns:**
  - **Status**: badge TODO / IN PROGRESS / DONE — nhấn để chọn/bỏ chọn (multi-select)
  - **Priority**: badge HIGH / MED / LOW — multi-select có màu
  - **Khoảng thời gian**: Tất cả / Hôm nay / Tuần này / Tháng này / Quá hạn
  - **Người được giao**: chọn user cụ thể
- **Badge đếm số filter** đang áp dụng
- **Nút "Xóa tất cả filter"**

**[Thao tác]** Demo từng filter:
1. Gõ từ khóa vào ô tìm kiếm → Task được lọc theo tiêu đề
2. Nhấn badge **HIGH** → Chỉ hiện task ưu tiên cao
3. Nhấn badge **TODO** → Chỉ hiện task chưa làm
4. Chọn **"Quá hạn"** → Hiện task đã trễ deadline

**[Nói]**
> "Backend sử dụng django-filter — query được tối ưu hóa tại database, không lọc ở Frontend. Kết hợp nhiều filter cùng lúc để tìm chính xác task cần tìm."

**[Thao tác]** Nhấn **"Xóa tất cả filter"** → Trở về hiển thị đầy đủ

---

## PHẦN 6: TASK CÁ NHÂN
**⏱ Thời gian: 3-4 phút**

---

### Bước 6.1: Trang Task cá nhân

**[Thao tác]** Nhấn **"Task cá nhân"** trên sidebar

**[Nói]**
> "Ngoài task trong dự án, hệ thống còn hỗ trợ task cá nhân — công việc riêng tư không thuộc dự án nào."

**[Chỉ ra]** Tabs: **Board** | **List** | **Calendar** | **Timeline** | **Summary**

**[Nói]**
> "Task cá nhân có đầy đủ các chế độ xem giống task dự án."

---

### Bước 6.2: Tạo Task cá nhân

**[Thao tác]** Nhấn **"Thêm công việc"** → Điền form:
- Tiêu đề: `Ôn thi cuối kỳ`
- Mô tả: `Ôn tập chương 5-8`
- Ưu tiên: HIGH
- Ngày hết hạn: chọn ngày
- Nhấn **"Lưu"**

**[Chỉ ra]** Task mới xuất hiện trên board cá nhân

**[Nói]**
> "Task cá nhân chỉ người tạo mới thấy và quản lý. Trong database, task cá nhân sử dụng cùng model Task nhưng có cờ is_personal = true và project = null."

---

### Bước 6.3: Kanban Board cá nhân

**[Thao tác]** **Kéo thả** task cá nhân giữa các cột TODO → IN PROGRESS → DONE

**[Nói]**
> "Kéo thả hoạt động tương tự như task dự án. Task cá nhân cũng được hệ thống kiểm tra quá hạn tự động."

---

### Bước 6.4: Tổng quan Task cá nhân (Summary)

**[Thao tác]** Nhấn tab **"Summary"**

**[Chỉ ra]**
- **4 thẻ thống kê**: Tổng task (icon 📋), Tỷ lệ hoàn thành % (icon ✅), Quá hạn (icon ⚠️), Đến hạn hôm nay (icon 🕐)
- **Biểu đồ tròn trạng thái**: dạng donut — TODO/IN PROGRESS/DONE với legend số + %
- **Biểu đồ tròn ưu tiên**: dạng donut — HIGH/MEDIUM/LOW với legend

**[Nói]**
> "Trang Summary giúp người dùng nhìn nhanh tình trạng công việc cá nhân với biểu đồ trực quan."

---

## PHẦN 7: HỆ THỐNG THÔNG BÁO
**⏱ Thời gian: 3-4 phút**

---

### Bước 7.1: Thông báo In-App

**[Thao tác]** Nhấn **chuông thông báo** 🔔 ở góc trên phải

**[Chỉ ra]** Popover thông báo hiện ra:
- **Header**: "Thông báo" + nút **"Đánh dấu tất cả đã đọc"**
- **Danh sách thông báo** (scroll được):
  - Avatar người gửi
  - **Tiêu đề** và **nội dung** thông báo
  - **Thời gian** tương đối (VD: "2 giờ trước")
  - Indicator **đọc/chưa đọc** (thông báo chưa đọc có nền khác)

**[Chỉ ra]** Badge đỏ trên chuông hiện số chưa đọc (VD: "5", nếu >9 hiện "9+")

**[Thao tác]** Click vào 1 thông báo → Tự động chuyển đến task/dự án liên quan + đánh dấu đã đọc

**[Nói]**
> "Hệ thống tạo thông báo in-app cho 8 loại sự kiện: được giao task, mời vào dự án, thay đổi deadline, comment mới, task bị xóa, thay đổi trạng thái, bị xóa khỏi dự án, và task quá hạn."

**[Thao tác]** Nhấn **"Đánh dấu tất cả đã đọc"** → Badge số biến mất

---

### Bước 7.2: Email thông báo tự động

**[Thao tác]** Mở Tab 2 (Email inbox)

**[Chỉ ra]** Các email đã nhận được trong quá trình demo:

1. **Email "Task Assigned"** — khi giao task cho member01
2. **Email "Project Invitation"** — khi thêm member01 vào dự án
3. **Email "Task Status Changed"** — khi kéo thả thay đổi trạng thái
4. **Email "Task Comment"** — khi có bình luận mới

**[Thao tác]** Mở 1-2 email → Chỉ ra template HTML đẹp

**[Nói]**
> "Hệ thống có 9 template email HTML riêng biệt cho 9 loại sự kiện. Email gửi qua Gmail SMTP. Mỗi template được thiết kế chuyên nghiệp với đầy đủ thông tin: tên task, dự án, deadline, người thực hiện."

---

### Bước 7.3: Kiểm tra Task quá hạn tự động (Celery)

**[Nói]**
> "Ngoài thông báo khi có sự kiện, hệ thống còn có cơ chế kiểm tra task quá hạn tự động."

**[Giải thích — không cần demo thực tế]**
> "Celery Beat — một scheduler — chạy mỗi 1 giờ, kiểm tra tất cả task có ngày hết hạn trước thời điểm hiện tại mà trạng thái vẫn là TODO hoặc IN PROGRESS. Với mỗi task quá hạn, hệ thống:
> - Kiểm tra đã gửi thông báo trong 24 giờ qua chưa (tránh spam)
> - Nếu chưa → gửi email cảnh báo + tạo notification in-app
> - Xử lý cả task dự án (gửi cho toàn bộ thành viên) và task cá nhân (gửi cho người tạo)"

**[Chỉ ra]** (Nếu có) Email cảnh báo task quá hạn trong inbox

---

## PHẦN 8: NHẬT KÝ HOẠT ĐỘNG DỰ ÁN
**⏱ Thời gian: 2 phút**

---

### Bước 8.1: Xem lịch sử hoạt động dự án

**[Thao tác]** Vào dự án → Nhấn nút **"Lịch sử hoạt động"** (hoặc icon 📋)

**[Chỉ ra]** Dialog lịch sử hoạt động:
- Danh sách sắp xếp theo thời gian giảm dần (mới nhất lên đầu)
- Mỗi dòng: **[Avatar] [Tên user] [hành động] — [thời gian]**

**[Chỉ ra]** Các sự kiện đã được ghi nhận trong quá trình demo:
- "trungcg đã tạo dự án"
- "trungcg đã thêm member01 vào dự án"
- "trungcg đã tạo task 'Thiết kế giao diện trang chủ'"
- "trungcg đã giao task cho member01"
- "trungcg đã thay đổi trạng thái task từ TODO sang IN PROGRESS"
- "trungcg đã bình luận trên task"

**[Nói]**
> "Mọi hành động quan trọng đều được ghi nhận tự động. Điều này giúp Owner theo dõi hoạt động dự án và truy vết khi có vấn đề."

---

## PHẦN 9: PHÂN QUYỀN
**⏱ Thời gian: 3-4 phút**

---

### Bước 9.1: Demo phân quyền Member

**[Thao tác]** Đăng xuất → Đăng nhập bằng tài khoản **member01**

**[Thao tác]** Vào dự án mà member01 là thành viên

**[Chỉ ra]** Những gì **KHÁC** so với Owner:
- ❌ **Không thấy** nút Settings (⚙️) — chỉ Owner mới thấy
- ❌ **Không có quyền** xóa task (nút xóa ẩn hoặc disable)
- ❌ **Không có quyền** giao task (assignee selector bị khóa)
- ✅ **CÓ quyền** xem tất cả task trong dự án
- ✅ **CÓ quyền** tạo task mới
- ✅ **CÓ quyền** sửa task (thay đổi status, priority)
- ✅ **CÓ quyền** bình luận
- ✅ **CÓ quyền** upload file

**[Nói]**
> "Phân quyền được kiểm tra tại Backend bằng Permission classes. Dù có bypass frontend, backend vẫn chặn các hành động không được phép. Chỉ Owner mới có quyền sửa/xóa dự án, xóa task, giao task, và quản lý thành viên."

---

### Bước 9.2: Demo phân quyền với dự án không phải thành viên

**[Thao tác]** (Vẫn đăng nhập member01) Thử truy cập URL dự án mà member01 không tham gia

**[Chỉ ra]** Hệ thống trả về lỗi **403 Forbidden** hoặc redirect

**[Nói]**
> "Người dùng không phải thành viên không thể truy cập dữ liệu dự án. Đây là bảo mật ở tầng Backend — không phụ thuộc vào việc ẩn UI ở Frontend."

---

## PHẦN 10: QUẢN LÝ HỒ SƠ & ADMIN
**⏱ Thời gian: 3-4 phút**

---

### Bước 10.1: Trang Hồ sơ cá nhân

**[Thao tác]** Nhấn vào **tên user** trên sidebar → Chuyển đến trang Profile

**[Chỉ ra]** Trang Hồ sơ gồm:
- Nút **"Quay lại Dashboard"** phía trên
- **Card Thông tin tài khoản:**
  - Username (chỉ đọc)
  - Email (chỉ đọc)
  - Ghi chú: liên hệ admin để thay đổi
- **Card Đổi mật khẩu:**
  - Ô nhập mật khẩu mới
  - Ô xác nhận mật khẩu
  - Nút **"Đổi mật khẩu"** / **"Hủy"**

**[Thao tác]** Thử nhập mật khẩu mới → Chỉ ra validation

---

### Bước 10.2: Trang Admin quản lý User

**[Thao tác]** Đăng xuất → Đăng nhập bằng tài khoản **admin**

**[Chỉ ra]** Sidebar có thêm menu **"Quản lý người dùng"** (icon UserCog) — chỉ hiện khi is_staff = True

**[Thao tác]** Nhấn vào **"Quản lý người dùng"**

**[Chỉ ra]** Trang admin:
- **Ô tìm kiếm** — lọc theo username/email/tên
- **Bảng danh sách user** với các cột:
  - Avatar + Username
  - Email
  - Họ tên
  - **Badge trạng thái**: "Active" (xanh) / "Inactive" (đỏ)
  - **Badge quyền**: "Admin" / "User"
  - **Menu Actions** (⋮)

**[Thao tác]** Nhấn menu ⋮ của 1 user → Chỉ ra các tùy chọn:
- 🛡️ **Thay đổi quyền Admin** (Toggle staff status)
- ✅/❌ **Khóa/Mở khóa tài khoản** (Toggle active)
- 🗑️ **Xóa tài khoản** (có dialog xác nhận)

**[Thao tác]** Demo **khóa tài khoản** 1 user → Badge chuyển từ "Active" sang "Inactive"

**[Nói]**
> "Admin có thể khóa tài khoản vi phạm — user bị khóa sẽ không đăng nhập được. Admin cũng có thể phân quyền admin cho user khác."

**[Thao tác]** Mở khóa lại user vừa khóa

---

## PHẦN 11: GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG
**⏱ Thời gian: 2-3 phút**

---

### Bước 11.1: Dark Mode / Light Mode

**[Thao tác]** Nhấn nút **đổi theme** 🌙 ở góc trên phải

**[Chỉ ra]** Toàn bộ giao diện chuyển từ Light → Dark mode:
- Nền trắng → nền tối
- Chữ đen → chữ sáng
- Card, button, badge đều thay đổi màu

**[Thao tác]** Nhấn lại → Chuyển về Light mode

**[Nói]**
> "Dark mode sử dụng next-themes kết hợp Tailwind CSS. Preference được lưu vào localStorage — lần truy cập sau sẽ giữ nguyên theme đã chọn."

---

### Bước 11.2: Đa ngôn ngữ (i18n)

**[Thao tác]** Nhấn nút **đổi ngôn ngữ** 🌐

**[Chỉ ra]** Toàn bộ text trên giao diện chuyển từ **Tiếng Việt → Tiếng Anh** (hoặc ngược lại):
- Menu sidebar
- Tiêu đề trang
- Label form
- Button text
- Placeholder

**[Thao tác]** Nhấn lại → Về Tiếng Việt

**[Nói]**
> "Hệ thống hỗ trợ 2 ngôn ngữ: Tiếng Việt và Tiếng Anh. Sử dụng hệ thống i18n custom nhẹ, không phụ thuộc thư viện nặng."

---

### Bước 11.3: Responsive Design

**[Thao tác]** Nhấn **F12** → Mở DevTools → Nhấn icon **📱 Toggle device** → Chọn iPhone/iPad

**[Chỉ ra]** Giao diện tự điều chỉnh:
- Sidebar **ẩn tự động** trên mobile
- Kanban board **cuộn ngang**
- Card/Form **xếp dọc** thay vì ngang
- Button/Input phóng to phù hợp touch

**[Thao tác]** Tắt DevTools → Quay lại desktop

**[Nói]**
> "Giao diện được thiết kế responsive với Tailwind CSS, hoạt động tốt trên Desktop, Tablet và Mobile."

---

## PHẦN 12: API DOCUMENTATION (Tùy chọn — nếu hội đồng hỏi)
**⏱ Thời gian: 1-2 phút**

---

### Bước 12.1: Swagger UI

**[Thao tác]** Mở Tab 3: http://localhost:8000/api/docs/

**[Chỉ ra]** Trang Swagger UI:
- Danh sách tất cả **40+ API endpoints**
- Nhóm theo: Authentication, Users, Projects, Tasks, Comments, Attachments, Notifications, Activity
- Mỗi endpoint hiển thị: Method (GET/POST/PUT/DELETE), URL, mô tả

**[Thao tác]** Mở 1 endpoint (VD: `POST /api/projects/`) → Chỉ ra:
- Request body schema
- Response format
- Các status code có thể trả về

**[Nói]**
> "API documentation được tự động generate bằng drf-spectacular theo chuẩn OpenAPI 3.0. Đây là tài liệu sống — luôn cập nhật theo code."

---

## KẾT THÚC DEMO

**[Nói]**
> "Trên đây là toàn bộ các chức năng chính của hệ thống Task Management System. Tóm tắt, hệ thống bao gồm:
> - Xác thực đa dạng: đăng ký, đăng nhập JWT, Google OAuth2, quên mật khẩu
> - Quản lý dự án đầy đủ: CRUD, thêm/xóa thành viên, phân quyền Owner/Member
> - Quản lý công việc với Kanban Board kéo thả, hỗ trợ task dự án và task cá nhân
> - 5 chế độ xem: Board, List, Calendar, Timeline, Summary
> - Bộ lọc và tìm kiếm mạnh mẽ
> - Hệ thống thông báo in-app + 9 template email HTML
> - Kiểm tra task quá hạn tự động bằng Celery
> - Nhật ký hoạt động chi tiết
> - Phân quyền chặt chẽ tại Backend
> - Dark/Light mode, đa ngôn ngữ, responsive design
>
> Em xin kết thúc phần demo. Em sẵn sàng trả lời câu hỏi của quý thầy/cô."

---

## 📝 GHI CHÚ CHO NGƯỜI THUYẾT TRÌNH

### Thứ tự demo tối ưu (nếu thiếu thời gian):
1. **Bắt buộc demo**: Landing → Đăng nhập → Dashboard → Kanban Board (kéo thả) → Tạo task → Chi tiết task → Bình luận → Thông báo (chuông)
2. **Nên demo**: Các chế độ xem (List/Timeline) → Bộ lọc → Task cá nhân → Email thông báo
3. **Demo nếu có thời gian**: Phân quyền (đổi account) → Admin → Dark mode → Responsive → Swagger

### Tips:
- **Nói trước, làm sau**: Giải thích sẽ làm gì trước khi click
- **Chậm rãi khi kéo thả**: Để hội đồng thấy rõ hiệu ứng
- **Mở sẵn email**: Để show email thông báo nhanh, không chờ
- **Nếu lỗi xảy ra**: Bình tĩnh, nói "Đây là môi trường development" và chuyển sang tính năng khác
- **Nếu hội đồng hỏi về code**: Mở Swagger hoặc mở VSCode chỉ file cụ thể
