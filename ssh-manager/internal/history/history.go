package history

import (
	"sync"
	"time"
)

// Entry records a command executed through the SSH manager.
type Entry struct {
	Server    string    `json:"server"`
	Command   string    `json:"command"`
	Output    string    `json:"output"`
	Success   bool      `json:"success"`
	Timestamp time.Time `json:"timestamp"`
}

// Store holds the history of executed commands in memory.
type Store struct {
	mu      sync.RWMutex
	entries []Entry
}

// NewStore creates a new history Store.
func NewStore() *Store {
	return &Store{
		entries: make([]Entry, 0),
	}
}

// Add appends a new command execution entry to history.
func (s *Store) Add(server, command, output string, success bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.entries = append([]Entry{{
		Server:    server,
		Command:   command,
		Output:    output,
		Success:   success,
		Timestamp: time.Now(),
	}}, s.entries...) // newest first

	// Limit to last 50 entries
	if len(s.entries) > 50 {
		s.entries = s.entries[:50]
	}
}

// All returns all history entries.
func (s *Store) All() []Entry {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]Entry, len(s.entries))
	copy(result, s.entries)
	return result
}
