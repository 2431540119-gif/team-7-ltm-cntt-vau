# Hướng Dẫn Sử Dụng Giao Diện Web (SSH Manager)

Thư mục này chứa toàn bộ mã nguồn giao diện Web Frontend của hệ thống **SSH Manager**.

---

## 1. Cấu trúc thư mục

```text
web/
├── index.html   # Cấu trúc trang Web (Danh sách server, Khung thực thi lệnh SSH, Terminal Console)
├── style.css    # Giao diện Dark-mode hiện đại, responsive
├── app.js       # Logic gọi API backend (/api/servers, /api/execute, /api/history)
└── README.md    # Tài liệu hướng dẫn này
```

---

## 2. Cách khởi động và sử dụng

### Bước 1: Khởi động Web Server (Backend Go)
Mở PowerShell hoặc Command Prompt tại thư mục `ssh-manager`:
```powershell
cd ssh-manager
go run ./cmd
```

Khi server khởi động thành công, terminal sẽ hiển thị:
```text
==================================================
  SSH MANAGER - WEB & API SERVER
==================================================
 Server dang chay tai:
   👉 http://localhost:8080
   👉 http://127.0.0.1:8080
--------------------------------------------------
 Nhan Ctrl+C de dung server...
==================================================
```

### Bước 2: Mở giao diện trên trình duyệt
Mở trình duyệt web bất kỳ (Chrome, Edge, Firefox...) và truy cập vào:
👉 **[http://localhost:8080](http://localhost:8080)**

---

## 3. Các tính năng chính trên Giao Diện Web

1. **Quản lý danh sách Server (`/api/servers`)**:
   - Bấm **+ Thêm Server** để lưu thông tin server (Tên, Host/IP, Port, Username).
   - Danh sách server được lưu tự động vào `data/servers.json`.
   - Bấm nút **Chọn** trên server bất kỳ để tự động điền Host, Port, Username vào form thực thi.
   - Bấm **Xóa** để xóa server khỏi danh sách.

2. **Thực thi lệnh SSH từ xa (`/api/execute`)**:
   - Điền thông tin kết nối SSH: Host, Port, User, Password.
   - Nhập lệnh (ví dụ: `date`, `hostname`, `whoami`, `uname -a`, `ls -la`) hoặc bấm vào các chip lệnh nhanh.
   - Bấm **Chạy Lệnh 🚀**.
   - Kết quả trả về sẽ xuất hiện ngay trên cửa sổ **Terminal Console Output**.

3. **Lịch sử thực thi (`/api/history`)**:
   - Ghi lại thời gian, server mục tiêu, câu lệnh và trạng thái (Thành công / Thất bại) của các lệnh đã chạy trong phiên.
