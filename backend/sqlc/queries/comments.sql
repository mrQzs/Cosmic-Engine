-- name: ListCommentsByBody :many
SELECT c.* FROM comments c
JOIN celestial_bodies cb ON cb.id = c.body_id
WHERE cb.slug = $1 AND c.deleted_at IS NULL
ORDER BY c.is_pinned DESC, c.created_at ASC
LIMIT $2 OFFSET $3;

-- name: CountCommentsByBody :one
SELECT count(*) FROM comments c
JOIN celestial_bodies cb ON cb.id = c.body_id
WHERE cb.slug = $1 AND c.deleted_at IS NULL;

-- name: GetCommentByID :one
SELECT * FROM comments WHERE id = $1 AND deleted_at IS NULL;

-- name: CreateComment :one
INSERT INTO comments (id, body_id, parent_comment_id, author_name, author_email, author_url, avatar_seed, content, content_html, orbital_params, is_pinned)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
RETURNING *;

-- name: SoftDeleteComment :exec
UPDATE comments SET deleted_at = now() WHERE id = $1;

-- name: PinComment :one
UPDATE comments SET is_pinned = $2 WHERE id = $1
RETURNING *;

-- name: CountAllComments :one
SELECT count(*) FROM comments WHERE deleted_at IS NULL;
