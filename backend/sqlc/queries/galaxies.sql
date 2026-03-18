-- name: GetGalaxyBySlug :one
SELECT * FROM galaxies WHERE slug = $1;

-- name: GetGalaxyByID :one
SELECT * FROM galaxies WHERE id = $1;

-- name: ListGalaxies :many
SELECT * FROM galaxies WHERE parent_id IS NULL ORDER BY sort_order, name;

-- name: ListStarsByGalaxy :many
SELECT * FROM galaxies WHERE parent_id = $1 ORDER BY sort_order, name;

-- name: CreateGalaxy :one
INSERT INTO galaxies (id, parent_id, name, slug, description, color_scheme, position, sort_order)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateGalaxy :one
UPDATE galaxies
SET name = COALESCE(sqlc.narg('name'), name),
    slug = COALESCE(sqlc.narg('slug'), slug),
    description = COALESCE(sqlc.narg('description'), description),
    color_scheme = COALESCE(sqlc.narg('color_scheme'), color_scheme),
    position = COALESCE(sqlc.narg('position'), position)
WHERE id = $1
RETURNING *;

-- name: IncrementGalaxyArticleCount :exec
UPDATE galaxies SET article_count = article_count + 1 WHERE id = $1;

-- name: DecrementGalaxyArticleCount :exec
UPDATE galaxies SET article_count = article_count - 1 WHERE id = $1 AND article_count > 0;
