# ssh-app: SSH server + client nhỏ (Go)

Nhóm: Truy cập từ xa / bảo mật kênh · OSI: L7 (giao thức phiên), chạy trên TCP (L4)

Dùng `golang.org/x/crypto/ssh` (thư viện SSH chính thức của Go). Tham khảo thêm:
[openssh-portable](https://github.com/openssh/openssh-portable), [go-crypto/ssh](https://github.com/go-crypto/ssh).

## Chạy

```
cd ssh-app
go mod tidy          # tải golang.org/x/crypto, tạo go.sum (cần Go >= 1.23)
go test ./...        # kiểm tra tự động

# Terminal 1
go run . server      # in ra: host key: SHA256:xxxx

# Terminal 2 (dán fingerprint từ server vào -fp)
go run . client -fp SHA256:xxxx date
go run . client -fp SHA256:xxxx echo xin chao
go run . client -fp SHA256:sai date      # bị chặn: host key không khớp
```

Mặc định: `127.0.0.1:2222`, tài khoản `demo` / `demo123` (đổi bằng `-addr -user -pass`).

## Luồng của một phiên SSH

1. TCP 3-way handshake (L4)
2. Trao đổi chuỗi phiên bản (`SSH-2.0-...`)
3. KEX: thỏa thuận thuật toán, tạo khóa phiên chung
4. Server ký bằng host key, client đối chiếu fingerprint (chống MITM)
5. Từ đây dữ liệu được mã hóa + toàn vẹn (MAC)
6. Xác thực người dùng (mật khẩu)
7. Mở channel `session`, gửi yêu cầu `exec`, nhận output + `exit-status`

## Giới hạn có chủ đích

- Server chỉ chạy `echo`, `date`, `hostname`, không có shell/pty (tránh thực thi lệnh tùy ý).
- Host key sinh mới mỗi lần chạy server, nên phải lấy lại fingerprint.
- Chỉ xác thực mật khẩu. Cần public key thì thêm `PublicKeyCallback`.
- Không `-fp` thì client chỉ cảnh báo và vẫn kết nối (để thử nhanh, không an toàn).
