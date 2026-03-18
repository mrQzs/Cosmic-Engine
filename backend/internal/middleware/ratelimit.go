package middleware

import (
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"

	apperr "cosmic-engine/backend/internal/errors"
)

type rateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	rate     int
	window   time.Duration
	done     chan struct{}
}

type visitor struct {
	count   int
	resetAt time.Time
}

func newRateLimiter(rate int, window time.Duration) *rateLimiter {
	rl := &rateLimiter{
		visitors: make(map[string]*visitor),
		rate:     rate,
		window:   window,
		done:     make(chan struct{}),
	}
	go func() {
		ticker := time.NewTicker(time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-rl.done:
				return
			case <-ticker.C:
				rl.mu.Lock()
				now := time.Now()
				for k, v := range rl.visitors {
					if now.After(v.resetAt) {
						delete(rl.visitors, k)
					}
				}
				rl.mu.Unlock()
			}
		}
	}()
	return rl
}

func (rl *rateLimiter) Stop() {
	close(rl.done)
}

func (rl *rateLimiter) allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	v, exists := rl.visitors[key]
	if !exists || now.After(v.resetAt) {
		rl.visitors[key] = &visitor{count: 1, resetAt: now.Add(rl.window)}
		return true
	}

	v.count++
	return v.count <= rl.rate
}

// RateLimit returns a middleware that limits requests per IP.
func RateLimit(rate int, window time.Duration) fiber.Handler {
	rl := newRateLimiter(rate, window)
	return func(c *fiber.Ctx) error {
		if !rl.allow(c.IP()) {
			return apperr.SendError(c, apperr.NewRateLimited())
		}
		return c.Next()
	}
}
