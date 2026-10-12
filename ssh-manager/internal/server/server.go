package server

// Server stores the connection details for a managed server.
type Server struct {
	Name string `json:"name"`
	Host string `json:"host"`
	Port int    `json:"port"`
}
