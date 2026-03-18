package middleware

import (
	"testing"
	"time"
)

func TestRateLimiter_AllowsUnderLimit(t *testing.T) {
	t.Parallel()

	rl := newRateLimiter(5, time.Minute)
	defer rl.Stop()

	for i := 0; i < 5; i++ {
		if !rl.allow("client-1") {
			t.Errorf("request %d should be allowed", i+1)
		}
	}
}

func TestRateLimiter_BlocksOverLimit(t *testing.T) {
	t.Parallel()

	rl := newRateLimiter(3, time.Minute)
	defer rl.Stop()

	for i := 0; i < 3; i++ {
		rl.allow("client-1")
	}

	if rl.allow("client-1") {
		t.Error("4th request should be blocked")
	}
	if rl.allow("client-1") {
		t.Error("5th request should also be blocked")
	}
}

func TestRateLimiter_SeparateClients(t *testing.T) {
	t.Parallel()

	rl := newRateLimiter(2, time.Minute)
	defer rl.Stop()

	rl.allow("client-a")
	rl.allow("client-a")

	if rl.allow("client-a") {
		t.Error("client-a 3rd request should be blocked")
	}

	// client-b should still be allowed
	if !rl.allow("client-b") {
		t.Error("client-b should be allowed (separate limit)")
	}
}

func TestRateLimiter_ResetsAfterWindow(t *testing.T) {
	t.Parallel()

	rl := newRateLimiter(2, 50*time.Millisecond)
	defer rl.Stop()

	rl.allow("client-1")
	rl.allow("client-1")
	if rl.allow("client-1") {
		t.Error("3rd request should be blocked")
	}

	time.Sleep(60 * time.Millisecond)

	if !rl.allow("client-1") {
		t.Error("request after window reset should be allowed")
	}
}

func TestRateLimiter_Stop(t *testing.T) {
	t.Parallel()

	rl := newRateLimiter(10, time.Minute)
	rl.Stop()
	// Should not panic or block
}
