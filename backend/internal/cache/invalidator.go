package cache

import "context"

// InvalidateOnPlanetWrite clears caches affected by planet create/update/delete.
func (c *Cache) InvalidateOnPlanetWrite(ctx context.Context, slug string) {
	c.Del(ctx,
		PlanetKey(slug),
		PrefixUniverse,
		PrefixStats,
		PrefixPopular,
	)
}

// InvalidateOnGalaxyWrite clears caches affected by galaxy mutations.
func (c *Cache) InvalidateOnGalaxyWrite(ctx context.Context, slug string) {
	c.Del(ctx,
		GalaxyKey(slug),
		PrefixUniverse,
	)
}

// InvalidateOnCommentWrite clears caches affected by comment mutations.
func (c *Cache) InvalidateOnCommentWrite(ctx context.Context, planetSlug string) {
	c.Del(ctx,
		PlanetKey(planetSlug),
		PrefixStats,
	)
}

// InvalidateOnTagWrite clears the tags cache.
func (c *Cache) InvalidateOnTagWrite(ctx context.Context) {
	c.Del(ctx, PrefixTags)
}

// InvalidateOnFriendLinkWrite clears the friend links cache.
func (c *Cache) InvalidateOnFriendLinkWrite(ctx context.Context) {
	c.Del(ctx, PrefixFriends)
}
