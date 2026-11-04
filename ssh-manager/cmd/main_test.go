package main

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"ssh-manager/internal/server"
)

// useTempData points the handlers at a temp dir holding one saved server "lab"
// that has a saved password.
func useTempData(t *testing.T) {
	t.Helper()
	oldData, oldCreds := dataPath, credentialsPath
	t.Cleanup(func() { dataPath, credentialsPath = oldData, oldCreds })

	dir := t.TempDir()
	dataPath = filepath.Join(dir, "servers.json")
	credentialsPath = filepath.Join(dir, "credentials.json")
	if err := server.Save(dataPath, []server.Server{{Name: "lab", Host: "10.0.0.5", Port: 22, User: "root"}}); err != nil {
		t.Fatal(err)
	}
	if err := server.SaveCredentials(credentialsPath, map[string]string{"lab": "s3cret"}); err != nil {
		t.Fatal(err)
	}
}

func TestGetServersHidesPassword(t *testing.T) {
	useTempData(t)
	rec := httptest.NewRecorder()
	handleGetServers(rec, httptest.NewRequest(http.MethodGet, "/api/servers", nil))
	body := rec.Body.String()
	if strings.Contains(body, "s3cret") {
		t.Fatalf("password leaked to the browser: %s", body)
	}
	if !strings.Contains(body, `"hasPassword":true`) {
		t.Fatalf("hasPassword missing: %s", body)
	}
}

func TestResolveTargetUsesSavedServer(t *testing.T) {
	useTempData(t)
	// Host and user in the request are ignored so a saved password cannot be sent elsewhere.
	req := ExecuteRequest{ServerName: "lab", Host: "evil.example", Port: 2222, User: "x"}
	if err := resolveTarget(&req); err != nil {
		t.Fatal(err)
	}
	if req.Host != "10.0.0.5" || req.Port != 22 || req.User != "root" || req.Password != "s3cret" {
		t.Fatalf("unexpected target: %+v", req)
	}
}

func TestResolveTargetErrors(t *testing.T) {
	useTempData(t)
	req := ExecuteRequest{ServerName: "nope"}
	if err := resolveTarget(&req); err == nil {
		t.Fatal("unknown server should fail")
	}
	// A typed password wins and leaves the request untouched.
	req = ExecuteRequest{ServerName: "lab", Host: "h", Password: "typed"}
	if err := resolveTarget(&req); err != nil || req.Host != "h" || req.Password != "typed" {
		t.Fatalf("typed password should be left alone: %+v, %v", req, err)
	}
}

func TestAddServerRejectsDuplicateName(t *testing.T) {
	useTempData(t)
	rec := httptest.NewRecorder()
	body := strings.NewReader(`{"name":"lab","host":"1.2.3.4"}`)
	handleAddServer(rec, httptest.NewRequest(http.MethodPost, "/api/servers", body))
	if rec.Code != http.StatusConflict {
		t.Fatalf("want 409, got %d", rec.Code)
	}
}
