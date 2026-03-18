package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"cosmic-engine/backend/internal/auth"
)

type contextKey string

const UserClaimsKey contextKey = "user_claims"

// BearerAuth extracts a JWT from the Authorization header and stores claims in context.
// It does NOT reject unauthenticated requests — that is the @auth directive's job.
func BearerAuth(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" {
			return c.Next()
		}

		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			return c.Next()
		}

		claims, err := auth.ValidateToken(jwtSecret, parts[1])
		if err != nil {
			// Invalid token — continue without claims; @auth will reject if needed
			return c.Next()
		}

		c.Locals(string(UserClaimsKey), claims)
		return c.Next()
	}
}
