package main

import (
	"net"
	"strings"
	"testing"
)

func TestSSH(t *testing.T) {
	cfg, fp := newServer("demo", "demo123")
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer l.Close()
	go serve(l, cfg)
	addr := l.Addr().String()

	out, err := dial(addr, "demo", "demo123", fp, "echo xin chao")
	if err != nil || out != "xin chao\n" {
		t.Fatalf("đăng nhập đúng: out=%q err=%v", out, err)
	}
	if _, err := dial(addr, "demo", "sai", fp, "date"); err == nil {
		t.Fatal("mật khẩu sai mà vẫn vào được")
	}
	if _, err := dial(addr, "demo", "demo123", "SHA256:gia", "date"); err == nil || !strings.Contains(err.Error(), "KHÔNG khớp") {
		t.Fatalf("host key sai phải bị chặn, err=%v", err)
	}
	if _, err := dial(addr, "demo", "demo123", fp, "rm -rf /"); err == nil {
		t.Fatal("lệnh lạ phải trả exit code khác 0")
	}
}
