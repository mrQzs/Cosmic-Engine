package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"cosmic-engine/backend/graph/model"
	"cosmic-engine/backend/internal/database"
	db "cosmic-engine/backend/sqlc/generated"
)

type GalaxyRepo struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func (r *GalaxyRepo) GetBySlug(ctx context.Context, slug string) (*db.Galaxy, error) {
	g, err := r.q.GetGalaxyBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func (r *GalaxyRepo) GetByID(ctx context.Context, id uuid.UUID) (*db.Galaxy, error) {
	g, err := r.q.GetGalaxyByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func (r *GalaxyRepo) ListGalaxies(ctx context.Context) ([]db.Galaxy, error) {
	return r.q.ListGalaxies(ctx)
}

func (r *GalaxyRepo) ListStars(ctx context.Context, parentID uuid.UUID) ([]db.Galaxy, error) {
	return r.q.ListStarsByGalaxy(ctx, pgtype.UUID{Bytes: parentID, Valid: true})
}

func (r *GalaxyRepo) Create(ctx context.Context, input model.CreateGalaxyInput) (*db.Galaxy, error) {
	var parentID pgtype.UUID
	if input.ParentID != nil {
		uid, err := uuid.Parse(*input.ParentID)
		if err != nil {
			return nil, fmt.Errorf("invalid parent ID: %w", err)
		}
		parentID = pgtype.UUID{Bytes: uid, Valid: true}
	}
	var posJSON, csJSON json.RawMessage
	if input.Position != nil {
		var err error
		posJSON, err = json.Marshal(input.Position)
		if err != nil {
			return nil, fmt.Errorf("marshal position: %w", err)
		}
	}
	if input.ColorScheme != nil {
		var err error
		csJSON, err = json.Marshal(input.ColorScheme)
		if err != nil {
			return nil, fmt.Errorf("marshal color scheme: %w", err)
		}
	}

	g, err := r.q.CreateGalaxy(ctx, db.CreateGalaxyParams{
		ID:          database.NewID(),
		ParentID:    parentID,
		Name:        input.Name,
		Slug:        input.Slug,
		Description: pgtype.Text{String: ptrStr(input.Description), Valid: input.Description != nil},
		ColorScheme: csJSON,
		Position:    posJSON,
		SortOrder:   0,
	})
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func (r *GalaxyRepo) IncrementArticleCount(ctx context.Context, galaxyID uuid.UUID) error {
	return r.q.IncrementGalaxyArticleCount(ctx, galaxyID)
}

func (r *GalaxyRepo) Update(ctx context.Context, id uuid.UUID, input model.UpdateGalaxyInput) (*db.Galaxy, error) {
	g, err := r.q.UpdateGalaxy(ctx, db.UpdateGalaxyParams{
		ID:          id,
		Name:        pgtype.Text{String: ptrStr(input.Name), Valid: input.Name != nil},
		Slug:        pgtype.Text{String: ptrStr(input.Slug), Valid: input.Slug != nil},
		Description: pgtype.Text{String: ptrStr(input.Description), Valid: input.Description != nil},
	})
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// GalaxyToGraphQL converts a DB galaxy to a GraphQL model.
func GalaxyToGraphQL(g *db.Galaxy) *model.Galaxy {
	pos := &model.BaseCoordinates{}
	if g.Position != nil {
		_ = json.Unmarshal(g.Position, pos)
	}
	cs := &model.GalaxyColorScheme{Primary: "#38bdf8", Secondary: "#6b21a8"}
	if g.ColorScheme != nil {
		_ = json.Unmarshal(g.ColorScheme, cs)
	}
	var desc *string
	if g.Description.Valid {
		desc = &g.Description.String
	}

	var starPhase *model.StarPhase
	if g.ParentID.Valid {
		phase := starPhaseFromCount(int(g.ArticleCount))
		starPhase = &phase
	}

	return &model.Galaxy{
		ID:           g.ID.String(),
		Name:         g.Name,
		Slug:         g.Slug,
		Description:  desc,
		Position:     pos,
		ColorScheme:  cs,
		Children:     []*model.Galaxy{},
		Bodies:       []model.CelestialBody{},
		ArticleCount: int(g.ArticleCount),
		StarPhase:    starPhase,
		CreatedAt:    model.DateTime{Time: g.CreatedAt},
		UpdatedAt:    model.DateTime{Time: g.UpdatedAt},
	}
}

func starPhaseFromCount(count int) model.StarPhase {
	switch {
	case count >= 100:
		return model.StarPhaseRedGiant
	case count >= 50:
		return model.StarPhaseGiant
	case count >= 10:
		return model.StarPhaseMainSequence
	default:
		return model.StarPhaseProtostar
	}
}

func ptrStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
