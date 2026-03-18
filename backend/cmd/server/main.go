package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"cosmic-engine/backend/internal/api"
	"cosmic-engine/backend/internal/cache"
	"cosmic-engine/backend/internal/config"
	"cosmic-engine/backend/internal/database"
	apperr "cosmic-engine/backend/internal/errors"
	"cosmic-engine/backend/internal/middleware"
)

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnixMs
	if os.Getenv("LOG_PRETTY") == "true" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to load config")
	}

	ctx := context.Background()
	deps := api.Dependencies{}

	// PostgreSQL
	pgPool, err := database.NewPostgresPool(ctx, &cfg.Database)
	if err != nil {
		log.Warn().Err(err).Msg("PostgreSQL unavailable — running in mock mode")
	} else {
		deps.PgPool = pgPool
		log.Info().Msg("PostgreSQL connected")
	}

	// Redis
	redisClient, err := cache.NewRedisClient(ctx, &cfg.Redis)
	if err != nil {
		log.Warn().Err(err).Msg("Redis unavailable — caching disabled")
	} else {
		deps.RedisClient = redisClient
		log.Info().Msg("Redis connected")
	}

	api.SetDependencies(deps)

	app := fiber.New(fiber.Config{
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
		ErrorHandler: apperr.FiberErrorHandler,
	})

	// Global middleware
	app.Use(middleware.Recovery())
	app.Use(middleware.RequestID())
	app.Use(middleware.Logger())

	// Routes
	api.SetupRoutes(app, cfg)

	// Graceful shutdown
	addr := cfg.Server.Host + ":" + cfg.Server.Port
	go func() {
		if err := app.Listen(addr); err != nil {
			log.Fatal().Err(err).Msg("server failed")
		}
	}()

	log.Info().Str("addr", addr).Msg("server started")

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("shutting down server...")

	if err := app.ShutdownWithTimeout(30 * time.Second); err != nil {
		log.Error().Err(err).Msg("server shutdown error")
	}

	if redisClient != nil {
		_ = redisClient.Close()
		log.Info().Msg("Redis connection closed")
	}
	if pgPool != nil {
		pgPool.Close()
		log.Info().Msg("PostgreSQL pool closed")
	}

	log.Info().Msg("server stopped")
}
