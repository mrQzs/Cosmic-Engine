package cache

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"

	"cosmic-engine/backend/internal/config"
)

// NewRedisClient creates a configured Redis client.
func NewRedisClient(ctx context.Context, cfg *config.RedisConfig) (*redis.Client, error) {
	opts, err := redis.ParseURL(cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("parse redis URL: %w", err)
	}

	opts.PoolSize = 20
	opts.MinIdleConns = 5

	client := redis.NewClient(opts)

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("ping redis: %w", err)
	}

	return client, nil
}
