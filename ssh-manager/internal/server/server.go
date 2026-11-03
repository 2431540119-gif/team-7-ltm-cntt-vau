package server

import (
	"encoding/json"
	"os"
)

// Server stores the connection details for a managed server.
type Server struct {
	Name     string `json:"name"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user,omitempty"`
	Password string `json:"password,omitempty"`
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
	configuredServers := make([]Server, len(servers))
	copy(configuredServers, servers)
	for i := range configuredServers {
		configuredServers[i].Password = ""
	}

	data, err := json.MarshalIndent(configuredServers, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

// LoadCredentials reads locally stored passwords, separate from the server list.
func LoadCredentials(path string) (map[string]string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return map[string]string{}, nil
		}
		return nil, err
	}
	if len(data) == 0 {
		return map[string]string{}, nil
	}

	var credentials map[string]string
	if err := json.Unmarshal(data, &credentials); err != nil {
		return nil, err
	}
	return credentials, nil
}

// SaveCredentials writes passwords to a local file with owner-only permissions.
func SaveCredentials(path string, credentials map[string]string) error {
	data, err := json.MarshalIndent(credentials, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(path, data, 0600); err != nil {
		return err
	}
	return os.Chmod(path, 0600)
}
