package api

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// Dependencies holds external service connections for health checks.
type Dependencies struct {
	PgPool      *pgxpool.Pool
	RedisClient *redis.Client
}

var deps Dependencies

// SetDependencies sets the shared dependencies for health checks.
func SetDependencies(d Dependencies) {
	deps = d
}

func healthHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "ok"})
}

func readyHandler(c *fiber.Ctx) error {
	checks := fiber.Map{}
	allOK := true

	if deps.PgPool != nil {
		ctx, cancel := context.WithTimeout(c.Context(), 2*time.Second)
		defer cancel()
		if err := deps.PgPool.Ping(ctx); err != nil {
			checks["postgres"] = "error"
			allOK = false
		} else {
			checks["postgres"] = "ok"
		}
	}

	if deps.RedisClient != nil {
		ctx2, cancel2 := context.WithTimeout(c.Context(), 2*time.Second)
		defer cancel2()
		if err := deps.RedisClient.Ping(ctx2).Err(); err != nil {
			checks["redis"] = "error"
			allOK = false
		} else {
			checks["redis"] = "ok"
		}
	}

	if !allOK {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"status": "degraded",
			"checks": checks,
		})
	}

	if len(checks) == 0 {
		checks["note"] = "no backends configured"
	}

	return c.JSON(fiber.Map{
		"status": "ok",
		"checks": checks,
	})
}
