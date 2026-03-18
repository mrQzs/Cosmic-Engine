package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"cosmic-engine/backend/graph/model"
	"cosmic-engine/backend/internal/database"
	db "cosmic-engine/backend/sqlc/generated"
)

type FriendLinkRepo struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func (r *FriendLinkRepo) ListActive(ctx context.Context) ([]db.FriendLink, error) {
	return r.q.ListActiveFriendLinks(ctx)
}

func (r *FriendLinkRepo) Create(ctx context.Context, input model.CreateFriendLinkInput) (*db.FriendLink, error) {
	sortOrder := int32(0)
	if input.SortOrder != nil {
		sortOrder = int32(*input.SortOrder)
	}
	fl, err := r.q.CreateFriendLink(ctx, db.CreateFriendLinkParams{
		ID:          database.NewID(),
		Name:        input.Name,
		Url:         input.URL,
		Description: pgtype.Text{String: ptrStr(input.Description), Valid: input.Description != nil},
		IconSeed:    pgtype.Text{String: ptrStr(input.AvatarURL), Valid: input.AvatarURL != nil},
		SortOrder:   sortOrder,
		IsActive:    true,
	})
	if err != nil {
		return nil, err
	}
	return &fl, nil
}

func (r *FriendLinkRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return r.q.DeleteFriendLink(ctx, id)
}

// FriendLinkToGraphQL converts a DB friend link to a GraphQL model.
func FriendLinkToGraphQL(fl *db.FriendLink) *model.FriendLink {
	var desc *string
	if fl.Description.Valid {
		desc = &fl.Description.String
	}
	return &model.FriendLink{
		ID:          fl.ID.String(),
		Name:        fl.Name,
		URL:         fl.Url,
		Description: desc,
		SortOrder:   int(fl.SortOrder),
		CreatedAt:   model.DateTime{Time: fl.CreatedAt},
	}
}
