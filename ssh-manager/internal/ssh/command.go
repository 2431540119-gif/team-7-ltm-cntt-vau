package ssh

import (
	"fmt"
	"net"
	"time"

	"golang.org/x/crypto/ssh"
)

// commandTimeout bounds how long one remote command may run.
const commandTimeout = 30 * time.Second

// Command represents a command to run on a remote server.
type Command struct {
	Value string `json:"value"`
}

// Execute runs a command on a remote SSH server using password authentication.
func Execute(host string, port int, user, password, cmd string) (string, error) {
	if port <= 0 {
		port = 22
	}
	addr := net.JoinHostPort(host, fmt.Sprintf("%d", port))

	config := &ssh.ClientConfig{
		User: user,
		Auth: []ssh.AuthMethod{
			ssh.Password(password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}
	//thuc hien bat tay 3 buoc
	client, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return "", fmt.Errorf("không thể kết nối SSH tới %s: %w", addr, err)
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		return "", fmt.Errorf("không thể tạo SSH session: %w", err)
	}
	defer session.Close()

	type result struct {
		output []byte
		err    error
	}
	done := make(chan result, 1) // buffered so the goroutine can finish after a timeout
	go func() {
		out, err := session.CombinedOutput(cmd)
		done <- result{out, err}
	}()

	var output []byte
	select {
	case res := <-done:
		output, err = res.output, res.err
	case <-time.After(commandTimeout):
		// shortcut: closing the connection ends our wait, not necessarily the remote process; upgrade with a pty or session.Signal if that matters.
		return "", fmt.Errorf("lệnh chạy quá %s nên đã bị dừng", commandTimeout)
	}
	if err != nil {
		return string(output), fmt.Errorf("lỗi thực thi: %w (output: %s)", err, string(output))
	}

	return string(output), nil
}
