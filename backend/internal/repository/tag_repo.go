package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"cosmic-engine/backend/graph/model"
	db "cosmic-engine/backend/sqlc/generated"
)

type TagRepo struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func (r *TagRepo) List(ctx context.Context) ([]db.Tag, error) {
	return r.q.ListTags(ctx)
}

func (r *TagRepo) GetBySlug(ctx context.Context, slug string) (*db.Tag, error) {
	t, err := r.q.GetTagBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TagRepo) ListByBodyID(ctx context.Context, bodyID uuid.UUID) ([]db.Tag, error) {
	return r.q.ListTagsByBodyID(ctx, bodyID)
}

func (r *TagRepo) Count(ctx context.Context) (int64, error) {
	return r.q.CountTags(ctx)
}

// TagToGraphQL converts a DB tag to a GraphQL model.
func TagToGraphQL(t *db.Tag) *model.Tag {
	color := "#888888"
	if t.Color.Valid {
		color = t.Color.String
	}
	return &model.Tag{
		ID:        t.ID.String(),
		Name:      t.Name,
		Slug:      t.Slug,
		Color:     color,
		PostCount: int(t.PostCount),
	}
}
