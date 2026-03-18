package middleware

import (
	"fmt"
	"runtime/debug"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
)

func Recovery() fiber.Handler {
	return func(c *fiber.Ctx) (err error) {
		defer func() {
			if r := recover(); r != nil {
				rid, _ := c.Locals("request_id").(string)
				log.Error().
					Str("request_id", rid).
					Str("panic", fmt.Sprintf("%v", r)).
					Str("stack", string(debug.Stack())).
					Msg("panic recovered")

				err = c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": fiber.Map{
						"code":    50000,
						"message": "Internal Server Error",
					},
				})
			}
		}()
		return c.Next()
	}
}
