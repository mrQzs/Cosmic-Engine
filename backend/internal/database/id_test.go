package database

import (
	"testing"

	"github.com/google/uuid"
)

func TestNewID_IsV7(t *testing.T) {
	t.Parallel()

	id := NewID()
	if id.Version() != 7 {
		t.Errorf("NewID version = %d, want 7", id.Version())
	}
}

func TestNewID_IsUnique(t *testing.T) {
	t.Parallel()

	seen := make(map[uuid.UUID]bool)
	for i := 0; i < 1000; i++ {
		id := NewID()
		if seen[id] {
			t.Fatalf("duplicate ID after %d generations: %s", i, id)
		}
		seen[id] = true
	}
}

func TestNewID_IsMonotonic(t *testing.T) {
	t.Parallel()

	prev := NewID()
	for i := 0; i < 100; i++ {
		curr := NewID()
		// UUIDv7 is time-ordered: lexicographic comparison should be ascending
		if curr.String() <= prev.String() {
			t.Errorf("IDs not monotonically increasing: %s <= %s", curr, prev)
		}
		prev = curr
	}
}
