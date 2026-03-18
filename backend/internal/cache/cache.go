package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

// Cache provides generic get/set operations with JSON serialization.
type Cache struct {
	client *redis.Client
}

// New creates a Cache wrapper around a Redis client.
func New(client *redis.Client) *Cache {
	return &Cache{client: client}
}

// Get retrieves a cached value and unmarshals it into dest.
// Returns false if the key does not exist or on error.
func (c *Cache) Get(ctx context.Context, key string, dest interface{}) bool {
	if c == nil || c.client == nil {
		return false
	}
	val, err := c.client.Get(ctx, key).Result()
	if err != nil {
		return false
	}
	if err := json.Unmarshal([]byte(val), dest); err != nil {
		log.Warn().Err(err).Str("key", key).Msg("cache unmarshal error")
		return false
	}
	return true
}

// Set marshals value to JSON and stores it with the given TTL.
func (c *Cache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) {
	if c == nil || c.client == nil {
		return
	}
	data, err := json.Marshal(value)
	if err != nil {
		log.Warn().Err(err).Str("key", key).Msg("cache marshal error")
		return
	}
	if err := c.client.Set(ctx, key, data, ttl).Err(); err != nil {
		log.Warn().Err(err).Str("key", key).Msg("cache set error")
	}
}

// Del removes one or more keys.
func (c *Cache) Del(ctx context.Context, keys ...string) {
	if c == nil || c.client == nil {
		return
	}
	if err := c.client.Del(ctx, keys...).Err(); err != nil {
		log.Warn().Err(err).Strs("keys", keys).Msg("cache del error")
	}
}

// Client returns the underlying Redis client (for health checks).
func (c *Cache) Client() *redis.Client {
	if c == nil {
		return nil
	}
	return c.client
}
