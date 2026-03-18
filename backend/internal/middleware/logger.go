package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
)

func Logger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		err := c.Next()

		rid, _ := c.Locals("request_id").(string)
		latency := time.Since(start)

		log.Info().
			Str("request_id", rid).
			Str("method", c.Method()).
			Str("path", c.Path()).
			Int("status", c.Response().StatusCode()).
			Dur("latency_ms", latency).
			Str("ip", c.IP()).
			Msg("request")

		return err
	}
}
