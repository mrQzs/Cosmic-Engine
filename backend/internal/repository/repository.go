package repository

import (
	"github.com/jackc/pgx/v5/pgxpool"

	db "cosmic-engine/backend/sqlc/generated"
)

// Repos aggregates all repository instances.
type Repos struct {
	User       *UserRepo
	Galaxy     *GalaxyRepo
	Body       *BodyRepo
	Comment    *CommentRepo
	Tag        *TagRepo
	FriendLink *FriendLinkRepo
	Settings   *SettingsRepo
}

// New creates all repositories from a connection pool.
func New(pool *pgxpool.Pool) *Repos {
	q := db.New(pool)
	return &Repos{
		User:       &UserRepo{q: q, pool: pool},
		Galaxy:     &GalaxyRepo{q: q, pool: pool},
		Body:       &BodyRepo{q: q, pool: pool},
		Comment:    &CommentRepo{q: q, pool: pool},
		Tag:        &TagRepo{q: q, pool: pool},
		FriendLink: &FriendLinkRepo{q: q, pool: pool},
		Settings:   &SettingsRepo{q: q, pool: pool},
	}
}
