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
