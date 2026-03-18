package cache

import (
	"fmt"
	"time"
)

// Cache key prefixes and TTLs
const (
	PrefixUniverse = "cache:universe"
	PrefixPlanet   = "cache:planet:"
	PrefixTags     = "cache:tags"
	PrefixStats    = "cache:stats"
	PrefixGalaxy   = "cache:galaxy:"
	PrefixPopular  = "cache:popular"
	PrefixFriends  = "cache:friends"

	TTLUniverse = 5 * time.Minute
	TTLPlanet   = 10 * time.Minute
	TTLTags     = 10 * time.Minute
	TTLStats    = 1 * time.Minute
	TTLGalaxy   = 5 * time.Minute
	TTLPopular  = 5 * time.Minute
	TTLFriends  = 10 * time.Minute
)

func PlanetKey(slug string) string {
	return fmt.Sprintf("%s%s", PrefixPlanet, slug)
}

func GalaxyKey(slug string) string {
	return fmt.Sprintf("%s%s", PrefixGalaxy, slug)
}
