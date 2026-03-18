-- name: GetBodyBySlug :one
SELECT * FROM celestial_bodies WHERE slug = $1 AND deleted_at IS NULL;

-- name: GetBodyByID :one
SELECT * FROM celestial_bodies WHERE id = $1 AND deleted_at IS NULL;

-- name: ListPublishedBodies :many
SELECT * FROM celestial_bodies
WHERE status = 'published' AND deleted_at IS NULL
ORDER BY published_at DESC NULLS LAST
LIMIT $1 OFFSET $2;

-- name: ListBodiesByGalaxy :many
SELECT * FROM celestial_bodies
WHERE galaxy_id = $1 AND deleted_at IS NULL
ORDER BY published_at DESC NULLS LAST;

-- name: ListBodiesByType :many
SELECT * FROM celestial_bodies
WHERE type = $1 AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: SearchBodies :many
SELECT * FROM celestial_bodies
WHERE tsv @@ plainto_tsquery('simple', $1)
  AND status = 'published'
  AND deleted_at IS NULL
ORDER BY ts_rank(tsv, plainto_tsquery('simple', $1)) DESC
LIMIT $2 OFFSET $3;

-- name: CountSearchBodies :one
SELECT count(*) FROM celestial_bodies
WHERE tsv @@ plainto_tsquery('simple', $1)
  AND status = 'published'
  AND deleted_at IS NULL;

-- name: ArchiveBodies :many
SELECT * FROM celestial_bodies
WHERE published_at >= make_date(sqlc.arg(year)::int, 1, 1)::timestamptz
  AND published_at < make_date(sqlc.arg(year)::int + 1, 1, 1)::timestamptz
  AND status = 'published'
  AND deleted_at IS NULL
ORDER BY published_at DESC;

-- name: CreateBody :one
INSERT INTO celestial_bodies (
    id, type, galaxy_id, star_id, author_id, title, slug,
    content, summary, physics_params, aesthetics_params,
    base_coordinates, tags, locale, word_count, status
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
RETURNING *;

-- name: UpdateBody :one
UPDATE celestial_bodies
SET title = COALESCE(sqlc.narg('title'), title),
    content = COALESCE(sqlc.narg('content'), content),
    summary = COALESCE(sqlc.narg('summary'), summary),
    physics_params = COALESCE(sqlc.narg('physics_params'), physics_params),
    aesthetics_params = COALESCE(sqlc.narg('aesthetics_params'), aesthetics_params),
    tags = COALESCE(sqlc.narg('tags'), tags),
    word_count = COALESCE(sqlc.narg('word_count'), word_count),
    galaxy_id = COALESCE(sqlc.narg('galaxy_id'), galaxy_id)
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: PublishBody :one
UPDATE celestial_bodies
SET status = 'published',
    type = 'PLANET',
    published_at = COALESCE(published_at, now())
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: SoftDeleteBody :exec
UPDATE celestial_bodies SET deleted_at = now() WHERE id = $1;

-- name: IncrementViewCount :exec
UPDATE celestial_bodies SET view_count = view_count + $2 WHERE id = $1;

-- name: IncrementCommentCount :exec
UPDATE celestial_bodies SET comment_count = comment_count + 1 WHERE id = $1;

-- name: DecrementCommentCount :exec
UPDATE celestial_bodies SET comment_count = comment_count - 1 WHERE id = $1 AND comment_count > 0;

-- name: CountPublishedBodies :one
SELECT count(*) FROM celestial_bodies WHERE status = 'published' AND deleted_at IS NULL;

-- name: SumViewCounts :one
SELECT COALESCE(sum(view_count), 0)::bigint FROM celestial_bodies WHERE status = 'published' AND deleted_at IS NULL;

-- name: PopularBodies :many
SELECT * FROM celestial_bodies
WHERE status = 'published' AND deleted_at IS NULL
ORDER BY view_count DESC
LIMIT $1;
