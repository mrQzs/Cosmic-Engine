package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"cosmic-engine/backend/graph/model"
	"cosmic-engine/backend/internal/database"
	db "cosmic-engine/backend/sqlc/generated"
)

type UserRepo struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*db.User, error) {
	u, err := r.q.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) GetByID(ctx context.Context, id uuid.UUID) (*db.User, error) {
	u, err := r.q.GetUserByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) Create(ctx context.Context, params db.CreateUserParams) (*db.User, error) {
	params.ID = database.NewID()
	u, err := r.q.CreateUser(ctx, params)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// ToGraphQL converts a DB user to a GraphQL User model.
func UserToGraphQL(u *db.User) *model.User {
	var role model.UserRole
	switch u.Role {
	case db.UserRoleAdmin:
		role = model.UserRoleAdmin
	default:
		role = model.UserRoleEditor
	}
	var avatarURL *string
	if u.AvatarUrl.Valid {
		avatarURL = &u.AvatarUrl.String
	}
	return &model.User{
		ID:          u.ID.String(),
		Username:    u.Email,
		Email:       u.Email,
		DisplayName: u.DisplayName,
		AvatarURL:   avatarURL,
		Role:        role,
		CreatedAt:   model.DateTime{Time: u.CreatedAt},
	}
}
