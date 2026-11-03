# SSH Manager

Hệ thống quản lý và thực thi lệnh SSH qua Giao diện Web (Web UI) và Backend Go.

---

## 1. Cấu trúc dự án

```text
ssh-manager/
├── cmd/
│   └── main.go              # Entrypoint khởi động HTTP Server và định tuyến API
├── data/
│   └── servers.json         # Cơ sở dữ liệu JSON lưu danh sách các SSH servers
├── internal/
│   ├── server/server.go     # Đọc/ghi cấu hình server
│   ├── ssh/command.go       # Kết nối và thực thi lệnh SSH từ xa
│   └── history/history.go   # Bộ nhớ lưu lại lịch sử lệnh thực thi
├── web/                     # Giao diện Web Frontend
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── README.md            # Chi tiết hướng dẫn Frontend
└── go.mod                   # Quản lý module Go
```

---

## 2. Cách chạy ứng dụng

1. Mở terminal và chuyển vào thư mục `ssh-manager`:
   ```bash
   cd ssh-manager
   ```

2. Khởi chạy server:
   ```bash
   go run ./cmd
   ```

3. Mở trình duyệt web và truy cập vào:
   👉 **http://localhost:8080**

## 3. Kết nối tới SSH server

- Các địa chỉ có sẵn trong danh sách chỉ là cấu hình mẫu; chúng không tự tạo hay khởi động SSH server.
- Bấm **Kiểm tra SSH** trên một mục để kiểm tra đăng nhập. Kết quả sẽ nêu rõ lỗi kết nối, xác thực, hoặc thành công.
- `127.0.0.1` và các địa chỉ `127.x.x.x` trỏ về chính máy đang chạy SSH Manager, không phải máy ảo Linux. Hãy thay bằng IP thật của máy đích.
- Trên máy Linux đích, cần bật SSH server (ví dụ `sudo systemctl enable --now ssh`) và cho phép truy cập cổng SSH, thường là `22`.
- Từ Windows, kiểm tra IP/cổng trước bằng `Test-NetConnection <IP-máy-Linux> -Port 22`. Nếu `TcpTestSucceeded` là `False`, hãy kiểm tra IP và chế độ mạng máy ảo (bridge hoặc NAT kèm port forwarding) trước khi chạy lệnh.
- Chọn **Nạp thông tin** chỉ điền Host/Port/User/Mật khẩu; nó không tự kết nối. Có thể lưu mật khẩu khi thêm server để nút kiểm tra sử dụng.
