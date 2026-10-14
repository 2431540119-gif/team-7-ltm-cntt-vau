package server

import (
	"encoding/json"
	"os"
)

// Server stores the connection details for a managed server.
type Server struct {
	Name string `json:"name"`
	Host string `json:"host"`
	Port int    `json:"port"`
	User string `json:"user,omitempty"`
}

// Load reads the server list from a JSON file.
func Load(path string) ([]Server, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return []Server{}, nil
		}
		return nil, err
	}
	if len(data) == 0 {
		return []Server{}, nil
	}
	var servers []Server
	if err := json.Unmarshal(data, &servers); err != nil {
		return nil, err
	}
	return servers, nil
}

// Save writes the server list to a JSON file.
func Save(path string, servers []Server) error {
	data, err := json.MarshalIndent(servers, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}
