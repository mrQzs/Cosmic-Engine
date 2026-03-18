-- name: ListTags :many
SELECT * FROM tags ORDER BY post_count DESC, name;

-- name: GetTagBySlug :one
SELECT * FROM tags WHERE slug = $1;

-- name: GetTagByID :one
SELECT * FROM tags WHERE id = $1;

-- name: CreateTag :one
INSERT INTO tags (id, name, slug, color)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListTagsByBodyID :many
SELECT t.* FROM tags t
JOIN body_tags bt ON bt.tag_id = t.id
WHERE bt.body_id = $1
ORDER BY t.name;

-- name: CountTags :one
SELECT count(*) FROM tags;
