package graph

import (
	"context"
	"fmt"

	"github.com/99designs/gqlgen/graphql"

	"cosmic-engine/backend/internal/auth"
	"cosmic-engine/backend/internal/middleware"
)

// AuthDirective is the @auth directive — rejects unauthenticated requests.
func AuthDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
	claims := GetUserClaims(ctx)
	if claims == nil {
		return nil, fmt.Errorf("UNAUTHENTICATED: you must be logged in")
	}
	return next(ctx)
}

// GetUserClaims extracts auth claims from context (set by BearerAuth middleware via Fiber locals).
func GetUserClaims(ctx context.Context) *auth.Claims {
	claims, _ := ctx.Value(string(middleware.UserClaimsKey)).(*auth.Claims)
	return claims
}
