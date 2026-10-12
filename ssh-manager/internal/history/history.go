package history

// Entry records a command executed through the SSH manager.
type Entry struct {
	Command string `json:"command"`
}
