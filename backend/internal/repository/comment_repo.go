package repository

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"html"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"cosmic-engine/backend/graph/model"
	"cosmic-engine/backend/internal/database"
	db "cosmic-engine/backend/sqlc/generated"
)

type CommentRepo struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func (r *CommentRepo) ListByBody(ctx context.Context, bodySlug string, limit, offset int32) ([]db.Comment, int64, error) {
	comments, err := r.q.ListCommentsByBody(ctx, db.ListCommentsByBodyParams{
		Slug: bodySlug, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, err
	}
	count, err := r.q.CountCommentsByBody(ctx, bodySlug)
	if err != nil {
		return nil, 0, err
	}
	return comments, count, nil
}

func (r *CommentRepo) GetByID(ctx context.Context, id uuid.UUID) (*db.Comment, error) {
	c, err := r.q.GetCommentByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CommentRepo) Create(ctx context.Context, bodyID uuid.UUID, input model.CreateCommentInput, orbitalParams json.RawMessage) (*db.Comment, error) {
	id := database.NewID()

	avatarSeed := generateAvatarSeed(input.AuthorName, input.AuthorEmail)

	// Escape HTML to prevent XSS, then wrap in paragraph
	// TODO: replace with proper Markdown→HTML + bluemonday sanitizer
	contentHTML := "<p>" + html.EscapeString(input.Content) + "</p>"

	var parentID pgtype.UUID
	if input.ParentID != nil {
		uid, _ := uuid.Parse(*input.ParentID)
		parentID = pgtype.UUID{Bytes: uid, Valid: true}
	}

	c, err := r.q.CreateComment(ctx, db.CreateCommentParams{
		ID:              id,
		BodyID:          bodyID,
		ParentCommentID: parentID,
		AuthorName:      input.AuthorName,
		AuthorEmail:     pgtype.Text{String: input.AuthorEmail, Valid: true},
		AuthorUrl:       pgtype.Text{String: ptrStr(input.AuthorURL), Valid: input.AuthorURL != nil},
		AvatarSeed:      pgtype.Text{String: avatarSeed, Valid: true},
		Content:         input.Content,
		ContentHtml:     pgtype.Text{String: contentHTML, Valid: true},
		OrbitalParams:   orbitalParams,
	})
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CommentRepo) SoftDelete(ctx context.Context, id uuid.UUID) error {
	return r.q.SoftDeleteComment(ctx, id)
}

func (r *CommentRepo) Pin(ctx context.Context, id uuid.UUID, pinned bool) (*db.Comment, error) {
	c, err := r.q.PinComment(ctx, db.PinCommentParams{ID: id, IsPinned: pinned})
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CommentRepo) CountAll(ctx context.Context) (int64, error) {
	return r.q.CountAllComments(ctx)
}

// CommentToGraphQL converts a DB comment to a GraphQL model.
func CommentToGraphQL(c *db.Comment) *model.Comment {
	var parentID *string
	if c.ParentCommentID.Valid {
		uid := uuid.UUID(c.ParentCommentID.Bytes)
		s := uid.String()
		parentID = &s
	}
	var email *string
	if c.AuthorEmail.Valid {
		email = &c.AuthorEmail.String
	}
	var authorURL *string
	if c.AuthorUrl.Valid {
		authorURL = &c.AuthorUrl.String
	}
	avatarSeed := ""
	if c.AvatarSeed.Valid {
		avatarSeed = c.AvatarSeed.String
	}
	contentHTML := ""
	if c.ContentHtml.Valid {
		contentHTML = c.ContentHtml.String
	}

	op := &model.OrbitalParams{}
	if c.OrbitalParams != nil {
		_ = json.Unmarshal(c.OrbitalParams, op)
	}

	return &model.Comment{
		ID:            c.ID.String(),
		AuthorName:    c.AuthorName,
		AuthorEmail:   email,
		AuthorURL:     authorURL,
		AvatarSeed:    avatarSeed,
		ContentHTML:   contentHTML,
		OrbitalParams: op,
		ParentID:      parentID,
		Replies:       []*model.Comment{},
		Reactions:     []*model.Reaction{},
		Pinned:        c.IsPinned,
		CreatedAt:     model.DateTime{Time: c.CreatedAt},
	}
}

func generateAvatarSeed(name, email string) string {
	h := sha256.Sum256([]byte(name + ":" + email))
	return fmt.Sprintf("%x", h[:8])
}
