package database

import "github.com/google/uuid"

// NewID generates a new UUIDv7 (time-ordered, B-tree friendly).
func NewID() uuid.UUID {
	return uuid.Must(uuid.NewV7())
}
