package cache

import (
	"context"
	"testing"
	"time"
)

func TestCache_NilSafety(t *testing.T) {
	t.Parallel()

	ctx := context.Background()

	// Nil cache should not panic on any operation
	var c *Cache

	var dest string
	if c.Get(ctx, "key", &dest) {
		t.Error("nil cache Get should return false")
	}

	c.Set(ctx, "key", "value", time.Minute) // should not panic
	c.Del(ctx, "key")                        // should not panic
}

func TestCache_ClientAccessor(t *testing.T) {
	t.Parallel()

	var c *Cache
	if c.Client() != nil {
		t.Error("nil cache Client() should return nil")
	}
}

func TestCacheKeys(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		fn   func() string
		want string
	}{
		{"PlanetKey", func() string { return PlanetKey("my-post") }, "cache:planet:my-post"},
		{"GalaxyKey", func() string { return GalaxyKey("andromeda") }, "cache:galaxy:andromeda"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			if got := tt.fn(); got != tt.want {
				t.Errorf("got %q, want %q", got, tt.want)
			}
		})
	}
}

func TestTTLValues(t *testing.T) {
	t.Parallel()

	if TTLUniverse != 5*time.Minute {
		t.Errorf("TTLUniverse = %v, want 5m", TTLUniverse)
	}
	if TTLPlanet != 10*time.Minute {
		t.Errorf("TTLPlanet = %v, want 10m", TTLPlanet)
	}
	if TTLStats != 1*time.Minute {
		t.Errorf("TTLStats = %v, want 1m", TTLStats)
	}
}
