package repository

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"

	"cosmic-engine/backend/graph/model"
	db "cosmic-engine/backend/sqlc/generated"
)

type SettingsRepo struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func (r *SettingsRepo) List(ctx context.Context) ([]db.SiteSetting, error) {
	return r.q.ListSiteSettings(ctx)
}

func (r *SettingsRepo) Get(ctx context.Context, key string) (*db.SiteSetting, error) {
	s, err := r.q.GetSiteSetting(ctx, key)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SettingsRepo) Upsert(ctx context.Context, key string, value json.RawMessage) (*db.SiteSetting, error) {
	s, err := r.q.UpsertSiteSetting(ctx, db.UpsertSiteSettingParams{
		Key:   key,
		Value: value,
	})
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// SettingToGraphQL converts a DB site setting to a GraphQL model.
func SettingToGraphQL(s *db.SiteSetting) *model.SiteSetting {
	var jsonMap model.JSON
	_ = json.Unmarshal(s.Value, &jsonMap)
	return &model.SiteSetting{
		Key:       s.Key,
		Value:     jsonMap,
		UpdatedAt: model.DateTime{Time: s.UpdatedAt},
	}
}
