package ssh

import (
	"fmt"
	"time"

	"golang.org/x/crypto/ssh"
)

// Command represents a command to run on a remote server.
type Command struct {
	Value string `json:"value"`
}

// Execute runs a command on a remote SSH server using password authentication.
func Execute(host string, port int, user, password, cmd string) (string, error) {
	if port <= 0 {
		port = 22
	}
	addr := fmt.Sprintf("%s:%d", host, port)

	config := &ssh.ClientConfig{
		User: user,
		Auth: []ssh.AuthMethod{
			ssh.Password(password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

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

	output, err := session.CombinedOutput(cmd)
	if err != nil {
		return string(output), fmt.Errorf("lỗi thực thi: %w (output: %s)", err, string(output))
	}

	return string(output), nil
}
