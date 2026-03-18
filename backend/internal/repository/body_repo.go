package repository

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"fmt"

	"cosmic-engine/backend/graph/model"
	"cosmic-engine/backend/internal/database"
	db "cosmic-engine/backend/sqlc/generated"
)

type BodyRepo struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func (r *BodyRepo) GetBySlug(ctx context.Context, slug string) (*db.CelestialBody, error) {
	b, err := r.q.GetBodyBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BodyRepo) GetByID(ctx context.Context, id uuid.UUID) (*db.CelestialBody, error) {
	b, err := r.q.GetBodyByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BodyRepo) ListPublished(ctx context.Context, limit, offset int32) ([]db.CelestialBody, error) {
	return r.q.ListPublishedBodies(ctx, db.ListPublishedBodiesParams{Limit: limit, Offset: offset})
}

func (r *BodyRepo) ListByGalaxy(ctx context.Context, galaxyID uuid.UUID) ([]db.CelestialBody, error) {
	return r.q.ListBodiesByGalaxy(ctx, galaxyID)
}

func (r *BodyRepo) Search(ctx context.Context, query string, limit, offset int32) ([]db.CelestialBody, int64, error) {
	bodies, err := r.q.SearchBodies(ctx, db.SearchBodiesParams{
		PlaintoTsquery: query, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, err
	}
	count, err := r.q.CountSearchBodies(ctx, query)
	if err != nil {
		return nil, 0, err
	}
	return bodies, count, nil
}

func (r *BodyRepo) Archive(ctx context.Context, year int) ([]db.CelestialBody, error) {
	return r.q.ArchiveBodies(ctx, int32(year))
}

func (r *BodyRepo) Popular(ctx context.Context, limit int32) ([]db.CelestialBody, error) {
	return r.q.PopularBodies(ctx, limit)
}

func (r *BodyRepo) Create(ctx context.Context, input model.CreatePlanetInput, authorID uuid.UUID) (*db.CelestialBody, error) {
	id := database.NewID()
	bodyType := "ASTEROID"
	status := "draft"
	if input.Publish != nil && *input.Publish {
		bodyType = "PLANET"
		status = "published"
	}

	if input.GalaxyID == nil {
		return nil, fmt.Errorf("galaxyId is required")
	}
	galaxyID, err := uuid.Parse(*input.GalaxyID)
	if err != nil {
		return nil, fmt.Errorf("invalid galaxy ID: %w", err)
	}
	var starID pgtype.UUID
	if input.StarID != nil {
		uid, err := uuid.Parse(*input.StarID)
		if err != nil {
			return nil, fmt.Errorf("invalid star ID: %w", err)
		}
		starID = pgtype.UUID{Bytes: uid, Valid: true}
	}

	var physicsJSON, aestheticsJSON json.RawMessage
	if input.PhysicsParams != nil {
		var err error
		physicsJSON, err = json.Marshal(input.PhysicsParams)
		if err != nil {
			return nil, fmt.Errorf("marshal physics params: %w", err)
		}
	}
	if input.AestheticsParams != nil {
		var err error
		aestheticsJSON, err = json.Marshal(input.AestheticsParams)
		if err != nil {
			return nil, fmt.Errorf("marshal aesthetics params: %w", err)
		}
	}

	excerpt := ""
	if input.Excerpt != nil {
		excerpt = *input.Excerpt
	}

	wordCount := int32(len([]rune(input.Content)))

	b, err := r.q.CreateBody(ctx, db.CreateBodyParams{
		ID:               id,
		Type:             bodyType,
		GalaxyID:         galaxyID,
		StarID:           starID,
		AuthorID:         authorID,
		Title:            input.Title,
		Slug:             input.Slug,
		Content:          pgtype.Text{String: input.Content, Valid: true},
		Summary:          pgtype.Text{String: excerpt, Valid: excerpt != ""},
		PhysicsParams:    physicsJSON,
		AestheticsParams: aestheticsJSON,
		Tags:             []string{},
		Locale:           "zh",
		WordCount:        wordCount,
		Status:           status,
	})
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BodyRepo) Update(ctx context.Context, id uuid.UUID, input model.UpdatePlanetInput) (*db.CelestialBody, error) {
	params := db.UpdateBodyParams{ID: id}
	if input.Title != nil {
		params.Title = pgtype.Text{String: *input.Title, Valid: true}
	}
	if input.Content != nil {
		params.Content = pgtype.Text{String: *input.Content, Valid: true}
		wc := int32(len([]rune(*input.Content)))
		params.WordCount = pgtype.Int4{Int32: wc, Valid: true}
	}
	if input.Excerpt != nil {
		params.Summary = pgtype.Text{String: *input.Excerpt, Valid: true}
	}
	if input.GalaxyID != nil {
		uid, err := uuid.Parse(*input.GalaxyID)
		if err == nil {
			params.GalaxyID = pgtype.UUID{Bytes: uid, Valid: true}
		}
	}
	b, err := r.q.UpdateBody(ctx, params)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BodyRepo) Publish(ctx context.Context, id uuid.UUID) (*db.CelestialBody, error) {
	b, err := r.q.PublishBody(ctx, id)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BodyRepo) SoftDelete(ctx context.Context, id uuid.UUID) error {
	return r.q.SoftDeleteBody(ctx, id)
}

func (r *BodyRepo) IncrementCommentCount(ctx context.Context, id uuid.UUID) error {
	return r.q.IncrementCommentCount(ctx, id)
}

func (r *BodyRepo) DecrementCommentCount(ctx context.Context, id uuid.UUID) error {
	return r.q.DecrementCommentCount(ctx, id)
}

func (r *BodyRepo) CountPublished(ctx context.Context) (int64, error) {
	return r.q.CountPublishedBodies(ctx)
}

func (r *BodyRepo) SumViews(ctx context.Context) (int64, error) {
	return r.q.SumViewCounts(ctx)
}

// BodyToGraphQLPlanet converts a DB celestial body to a GraphQL Planet.
func BodyToGraphQLPlanet(b *db.CelestialBody) *model.Planet {
	pp := parsePhysicsParams(b.PhysicsParams)
	ap := parseAestheticsParams(b.AestheticsParams)

	var content string
	if b.Content.Valid {
		content = b.Content.String
	}
	var excerpt *string
	if b.Summary.Valid {
		excerpt = &b.Summary.String
	}
	var publishedAt *model.DateTime
	if b.PublishedAt.Valid {
		publishedAt = &model.DateTime{Time: b.PublishedAt.Time}
	}

	readingTime := int(b.WordCount) / 300
	if readingTime < 1 {
		readingTime = 1
	}

	return &model.Planet{
		ID:               b.ID.String(),
		Title:            b.Title,
		Slug:             b.Slug,
		Excerpt:          excerpt,
		PhysicsParams:    pp,
		CreatedAt:        model.DateTime{Time: b.CreatedAt},
		UpdatedAt:        model.DateTime{Time: b.UpdatedAt},
		Content:          content,
		ReadingTime:      readingTime,
		PublishedAt:      publishedAt,
		Tags:             []*model.Tag{},
		Comments:         []*model.Comment{},
		RelatedPlanets:   []*model.Planet{},
		AestheticsParams: ap,
		ViewCount:        int(b.ViewCount),
		CommentCount:     int(b.CommentCount),
	}
}

func parsePhysicsParams(data []byte) *model.PhysicsParams {
	if len(data) == 0 {
		return nil
	}
	var pp model.PhysicsParams
	if err := json.Unmarshal(data, &pp); err != nil {
		return nil
	}
	return &pp
}

func parseAestheticsParams(data []byte) *model.AestheticsParams {
	if len(data) == 0 {
		return &model.AestheticsParams{
			PlanetType:       "terrestrial",
			BaseColorHsl:     &model.HSLColor{H: 210, S: 0.7, L: 0.5},
			SurfaceRoughness: 0.5,
			GlowIntensity:    0.3,
			NoiseType:        "perlin",
		}
	}
	var ap model.AestheticsParams
	if err := json.Unmarshal(data, &ap); err != nil {
		return nil
	}
	return &ap
}
