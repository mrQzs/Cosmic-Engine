package api

import (
	"context"
	"net/http"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"

	"cosmic-engine/backend/graph"
	"cosmic-engine/backend/graph/generated"
	"cosmic-engine/backend/internal/auth"
	"cosmic-engine/backend/internal/cache"
	"cosmic-engine/backend/internal/config"
	mw "cosmic-engine/backend/internal/middleware"
	"cosmic-engine/backend/internal/repository"
)

func SetupRoutes(app *fiber.App, cfg *config.Config) {
	// CORS
	app.Use(mw.CORS(&cfg.CORS))

	// Bearer auth — extracts JWT claims into Fiber locals
	app.Use(mw.BearerAuth(cfg.Auth.JWTSecret))

	// Rate limiting — 60 req/min global
	app.Use(mw.RateLimit(60, time.Minute))

	// Health endpoints
	app.Get("/health", healthHandler)
	app.Get("/ready", readyHandler)

	// Root
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"name":    "CyberGeek API",
			"version": "0.1.0",
			"status":  "ok",
		})
	})

	// GraphQL
	var repos *repository.Repos
	if deps.PgPool != nil {
		repos = repository.New(deps.PgPool)
	}
	var appCache *cache.Cache
	if deps.RedisClient != nil {
		appCache = cache.New(deps.RedisClient)
	}
	resolver := &graph.Resolver{Config: cfg, Repos: repos, Cache: appCache}
	srv := newGraphQLServer(resolver, cfg)

	app.All("/graphql", func(c *fiber.Ctx) error {
		// Transfer Fiber locals to request context for GraphQL resolvers
		claims, _ := c.Locals(string(mw.UserClaimsKey)).(*auth.Claims)
		adaptor.HTTPHandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if claims != nil {
				ctx := context.WithValue(r.Context(), string(mw.UserClaimsKey), claims)
				r = r.WithContext(ctx)
			}
			srv.ServeHTTP(w, r)
		})(c)
		return nil
	})

	app.Get("/playground", adaptor.HTTPHandlerFunc(
		playground.Handler("CyberGeek GraphQL", "/graphql"),
	))
}

func newGraphQLServer(resolver *graph.Resolver, cfg *config.Config) *handler.Server {
	gqlCfg := generated.Config{Resolvers: resolver}
	gqlCfg.Directives.Auth = graph.AuthDirective

	srv := handler.New(generated.NewExecutableSchema(gqlCfg))
	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.Use(extension.Introspection{})

	return srv
}
