package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"ssh-manager/internal/history"
	"ssh-manager/internal/server"
	"ssh-manager/internal/ssh"
)

var (
	historyStore    = history.NewStore()
	dataPath        = "data/servers.json"
	credentialsPath = "data/credentials.json"
	webDir          = "web"
)

func resolvePaths() {
	// If executed from repo root instead of ssh-manager directory
	if _, err := os.Stat("data"); os.IsNotExist(err) {
		if _, err := os.Stat("ssh-manager/data"); err == nil {
			dataPath = "ssh-manager/data/servers.json"
			credentialsPath = "ssh-manager/data/credentials.json"
			webDir = "ssh-manager/web"
		}
	}
}

type ExecuteRequest struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Password string `json:"password"`
	Command  string `json:"command"`
}

type ExecuteResponse struct {
	Success bool   `json:"success"`
	Output  string `json:"output"`
	Error   string `json:"error,omitempty"`
}

func handleGetServers(w http.ResponseWriter, r *http.Request) {
	servers, err := server.Load(dataPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Không thể đọc danh sách server: %v", err), http.StatusInternalServerError)
		return
	}
	credentials, err := server.LoadCredentials(credentialsPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Không thể đọc mật khẩu server: %v", err), http.StatusInternalServerError)
		return
	}
	for i := range servers {
		servers[i].Password = credentials[servers[i].Name]
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(servers)
}

func handleAddServer(w http.ResponseWriter, r *http.Request) {
	var newServer server.Server
	if err := json.NewDecoder(r.Body).Decode(&newServer); err != nil {
		http.Error(w, "Dữ liệu JSON không hợp lệ", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(newServer.Host) == "" {
		http.Error(w, "Host không được để trống", http.StatusBadRequest)
		return
	}
	if newServer.Port <= 0 {
		newServer.Port = 22
	}
	if strings.TrimSpace(newServer.Name) == "" {
		newServer.Name = fmt.Sprintf("%s:%d", newServer.Host, newServer.Port)
	}

	servers, err := server.Load(dataPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Không thể đọc danh sách server: %v", err), http.StatusInternalServerError)
		return
	}
	servers = append(servers, newServer)
	if err := server.Save(dataPath, servers); err != nil {
		http.Error(w, fmt.Sprintf("Không thể lưu server: %v", err), http.StatusInternalServerError)
		return
	}
	credentials, err := server.LoadCredentials(credentialsPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Không thể đọc mật khẩu server: %v", err), http.StatusInternalServerError)
		return
	}
	if newServer.Password != "" {
		credentials[newServer.Name] = newServer.Password
	}
	if err := server.SaveCredentials(credentialsPath, credentials); err != nil {
		http.Error(w, fmt.Sprintf("Không thể lưu mật khẩu server: %v", err), http.StatusInternalServerError)
		return
	}
	for i := range servers {
		servers[i].Password = credentials[servers[i].Name]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(servers)
}

func handleDeleteServer(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "Thiếu tham số name", http.StatusBadRequest)
		return
	}

	servers, err := server.Load(dataPath)
	if err != nil {
		http.Error(w, "Lỗi đọc file", http.StatusInternalServerError)
		return
	}

	filtered := make([]server.Server, 0)
	for _, s := range servers {
		if s.Name != name {
			filtered = append(filtered, s)
		}
	}

	if err := server.Save(dataPath, filtered); err != nil {
		http.Error(w, "Lỗi lưu file", http.StatusInternalServerError)
		return
	}
	credentials, err := server.LoadCredentials(credentialsPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Không thể đọc mật khẩu server: %v", err), http.StatusInternalServerError)
		return
	}
	delete(credentials, name)
	if err := server.SaveCredentials(credentialsPath, credentials); err != nil {
		http.Error(w, fmt.Sprintf("Không thể cập nhật mật khẩu server: %v", err), http.StatusInternalServerError)
		return
	}
	for i := range filtered {
		filtered[i].Password = credentials[filtered[i].Name]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(filtered)
}

func writeExecuteError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ExecuteResponse{Success: false, Error: message})
}

func handleExecute(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeExecuteError(w, http.StatusMethodNotAllowed, "Phương thức không được hỗ trợ")
		return
	}

	var req ExecuteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeExecuteError(w, http.StatusBadRequest, fmt.Sprintf("Dữ liệu JSON không hợp lệ: %v", err))
		return
	}
	if strings.TrimSpace(req.Host) == "" || strings.TrimSpace(req.User) == "" || strings.TrimSpace(req.Command) == "" {
		writeExecuteError(w, http.StatusBadRequest, "Cần nhập Host, User và Lệnh thực thi")
		return
	}
	if req.Password == "" {
		writeExecuteError(w, http.StatusBadRequest, "Chưa nhập mật khẩu SSH")
		return
	}

	output, err := ssh.Execute(req.Host, req.Port, req.User, req.Password, req.Command)
	if err != nil {
		target := fmt.Sprintf("%s@%s:%d", req.User, req.Host, req.Port)
		historyStore.Add(target, req.Command, err.Error(), false)
		writeExecuteError(w, http.StatusBadGateway, err.Error())
		return
	}
	res := ExecuteResponse{
		Success: true,
		Output:  output,
	}

	target := fmt.Sprintf("%s@%s:%d", req.User, req.Host, req.Port)
	historyStore.Add(target, req.Command, output, true)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func handleTestConnection(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeExecuteError(w, http.StatusMethodNotAllowed, "Phương thức không được hỗ trợ")
		return
	}

	var req ExecuteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeExecuteError(w, http.StatusBadRequest, fmt.Sprintf("Dữ liệu JSON không hợp lệ: %v", err))
		return
	}
	if strings.TrimSpace(req.Host) == "" || strings.TrimSpace(req.User) == "" {
		writeExecuteError(w, http.StatusBadRequest, "Cần nhập Host và User")
		return
	}
	if req.Password == "" {
		writeExecuteError(w, http.StatusBadRequest, "Server chưa có mật khẩu đã lưu. Hãy chọn server, nhập mật khẩu rồi chạy lệnh.")
		return
	}

	output, err := ssh.Execute(req.Host, req.Port, req.User, req.Password, "whoami")
	if err != nil {
		writeExecuteError(w, http.StatusBadGateway, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ExecuteResponse{
		Success: true,
		Output:  strings.TrimSpace(output),
	})
}

func handleHistory(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(historyStore.All())
}

func main() {
	resolvePaths()

	// Ensure data directory exists
	dir := filepath.Dir(dataPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Printf("Cảnh báo tạo thư mục data: %v", err)
	}
	if err := os.MkdirAll(filepath.Dir(credentialsPath), 0755); err != nil {
		log.Printf("Cảnh báo tạo thư mục lưu mật khẩu: %v", err)
	}

	// API Routes
	http.HandleFunc("/api/servers", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handleGetServers(w, r)
		case http.MethodPost:
			handleAddServer(w, r)
		case http.MethodDelete:
			handleDeleteServer(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/execute", handleExecute)
	http.HandleFunc("/api/test-connection", handleTestConnection)
	http.HandleFunc("/api/history", handleHistory)

	// Static Web UI File Server
	fs := http.FileServer(http.Dir(webDir))
	http.Handle("/", fs)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := ":" + port

	fmt.Println("==================================================")
	fmt.Println("  SSH MANAGER - WEB & API SERVER")
	fmt.Println("==================================================")
	fmt.Printf(" Server dang chay tai:\n")
	fmt.Printf("   👉 http://localhost:%s\n", port)
	fmt.Printf("   👉 http://127.0.0.1:%s\n", port)
	fmt.Println("--------------------------------------------------")
	fmt.Println(" Nhan Ctrl+C de dung server...")
	fmt.Println("==================================================")

	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("Khong the khoi dong server: %v", err)
	}
}
