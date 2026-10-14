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
	historyStore = history.NewStore()
	dataPath     = "data/servers.json"
	webDir       = "web"
)

func resolvePaths() {
	// If executed from repo root instead of ssh-manager directory
	if _, err := os.Stat("data"); os.IsNotExist(err) {
		if _, err := os.Stat("ssh-manager/data"); err == nil {
			dataPath = "ssh-manager/data/servers.json"
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

	servers, _ := server.Load(dataPath)
	servers = append(servers, newServer)
	if err := server.Save(dataPath, servers); err != nil {
		http.Error(w, fmt.Sprintf("Không thể lưu server: %v", err), http.StatusInternalServerError)
		return
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(filtered)
}

func handleExecute(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ExecuteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu JSON không hợp lệ", http.StatusBadRequest)
		return
	}

	output, err := ssh.Execute(req.Host, req.Port, req.User, req.Password, req.Command)
	res := ExecuteResponse{
		Success: err == nil,
		Output:  output,
	}

	target := fmt.Sprintf("%s@%s:%d", req.User, req.Host, req.Port)
	if err != nil {
		res.Error = err.Error()
		historyStore.Add(target, req.Command, err.Error(), false)
	} else {
		historyStore.Add(target, req.Command, output, true)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
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
