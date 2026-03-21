package graph

import (
	"cosmic-engine/backend/internal/antispam"
	"cosmic-engine/backend/internal/cache"
	"cosmic-engine/backend/internal/config"
	"cosmic-engine/backend/internal/repository"
)

// Resolver is the root resolver. Add dependencies here.
type Resolver struct {
	Config   *config.Config
	Repos    *repository.Repos
	Cache    *cache.Cache
	AntiSpam *antispam.PowService
}
