// ssh-app: server + client SSH nhỏ (L7, chạy trên TCP) dùng golang.org/x/crypto/ssh.
//
//	go run . server                      # nghe 127.0.0.1:2222, in fingerprint host key
//	go run . client -fp SHA256:... date  # chạy lệnh qua kênh SSH đã mã hóa
package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/subtle"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"strings"
	"time"

	"golang.org/x/crypto/ssh"
)

// newServer tạo cấu hình server + host key ed25519 mới, trả về fingerprint để client ghim.
// ponytail: host key sinh lại mỗi lần chạy; muốn giữ cố định thì lưu bằng ssh.MarshalPrivateKey.
func newServer(user, pass string) (*ssh.ServerConfig, string) {
	_, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		log.Fatal(err)
	}
	signer, err := ssh.NewSignerFromKey(priv)
	if err != nil {
		log.Fatal(err)
	}
	cfg := &ssh.ServerConfig{
		PasswordCallback: func(c ssh.ConnMetadata, pw []byte) (*ssh.Permissions, error) {
			okUser := subtle.ConstantTimeCompare([]byte(c.User()), []byte(user))
			okPass := subtle.ConstantTimeCompare(pw, []byte(pass))
			if okUser&okPass == 1 {
				return nil, nil
			}
			return nil, errors.New("sai tài khoản hoặc mật khẩu")
		},
	}
	cfg.AddHostKey(signer)
	return cfg, ssh.FingerprintSHA256(signer.PublicKey())
}

func serve(l net.Listener, cfg *ssh.ServerConfig) {
	for {
		c, err := l.Accept()
		if err != nil {
			return
		}
		go handle(c, cfg)
	}
}

func handle(c net.Conn, cfg *ssh.ServerConfig) {
	defer c.Close()
	conn, chans, reqs, err := ssh.NewServerConn(c, cfg) // TCP -> trao đổi version -> KEX -> xác thực
	if err != nil {
		log.Println("handshake lỗi:", err)
		return
	}
	log.Printf("đăng nhập: %s từ %s (%s)", conn.User(), conn.RemoteAddr(), conn.ClientVersion())
	go ssh.DiscardRequests(reqs)
	for nc := range chans {
		if nc.ChannelType() != "session" {
			nc.Reject(ssh.UnknownChannelType, "chỉ hỗ trợ session")
			continue
		}
		ch, creqs, err := nc.Accept()
		if err != nil {
			continue
		}
		go func() {
			defer ch.Close()
			for r := range creqs {
				if r.Type != "exec" { // không pty/shell/env
					r.Reply(false, nil)
					continue
				}
				var p struct{ Cmd string }
				ssh.Unmarshal(r.Payload, &p)
				r.Reply(true, nil)
				out, code := run(p.Cmd)
				io.WriteString(ch, out)
				ch.SendRequest("exit-status", false, ssh.Marshal(struct{ Code uint32 }{code}))
				return
			}
		}()
	}
}

// run chỉ hỗ trợ vài lệnh dựng sẵn, KHÔNG gọi shell thật (tránh RCE khi demo).
func run(cmd string) (string, uint32) {
	f := strings.Fields(cmd)
	if len(f) == 0 {
		return "", 0
	}
	switch f[0] {
	case "echo":
		return strings.Join(f[1:], " ") + "\n", 0
	case "date":
		return time.Now().Format(time.RFC1123) + "\n", 0
	case "hostname":
		h, _ := os.Hostname()
		return h + "\n", 0
	}
	return "lệnh không hỗ trợ: " + f[0] + " (có: echo, date, hostname)\n", 127
}

// dial kết nối, kiểm tra host key theo fingerprint (fp rỗng = không kiểm tra, chỉ để thử), chạy 1 lệnh.
func dial(addr, user, pass, fp, cmd string) (string, error) {
	cfg := &ssh.ClientConfig{
		User: user,
		Auth: []ssh.AuthMethod{ssh.Password(pass)},
		HostKeyCallback: func(_ string, _ net.Addr, k ssh.PublicKey) error {
			got := ssh.FingerprintSHA256(k)
			fmt.Fprintln(os.Stderr, "host key:", k.Type(), got)
			if fp == "" {
				fmt.Fprintln(os.Stderr, "CẢNH BÁO: chưa kiểm tra host key, dùng -fp để chống MITM")
			} else if fp != got {
				return fmt.Errorf("host key KHÔNG khớp (mong đợi %s, nhận %s)", fp, got)
			}
			return nil
		},
		Timeout: 5 * time.Second,
	}
	c, err := ssh.Dial("tcp", addr, cfg)
	if err != nil {
		return "", err
	}
	defer c.Close()
	fmt.Fprintln(os.Stderr, "server:", string(c.ServerVersion()))
	s, err := c.NewSession()
	if err != nil {
		return "", err
	}
	defer s.Close()
	out, err := s.CombinedOutput(cmd)
	return string(out), err
}

func main() {
	if len(os.Args) < 2 || (os.Args[1] != "server" && os.Args[1] != "client") {
		fmt.Println("dùng: ssh-app server|client [-addr host:port] [-user u] [-pass p] [-fp SHA256:...] [lệnh]")
		os.Exit(2)
	}
	fs := flag.NewFlagSet(os.Args[1], flag.ExitOnError)
	addr := fs.String("addr", "127.0.0.1:2222", "địa chỉ host:port")
	user := fs.String("user", "demo", "tên đăng nhập")
	pass := fs.String("pass", "demo123", "mật khẩu")
	fp := fs.String("fp", "", "client: fingerprint SHA256 của host key do server in ra")
	fs.Parse(os.Args[2:])

	if os.Args[1] == "server" {
		cfg, fingerprint := newServer(*user, *pass)
		l, err := net.Listen("tcp", *addr)
		if err != nil {
			log.Fatal(err)
		}
		log.Printf("SSH server nghe %s | host key: %s", *addr, fingerprint)
		serve(l, cfg)
		return
	}
	out, err := dial(*addr, *user, *pass, *fp, strings.Join(fs.Args(), " "))
	fmt.Print(out)
	if err != nil {
		fmt.Fprintln(os.Stderr, "lỗi:", err)
		os.Exit(1)
	}
}
