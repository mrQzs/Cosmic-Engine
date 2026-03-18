-- name: CreateArticleVersion :one
INSERT INTO article_versions (id, body_id, content, physics_params, version_num, change_summary)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListVersionsByBody :many
SELECT * FROM article_versions
WHERE body_id = $1
ORDER BY version_num DESC;

-- name: GetLatestVersionNum :one
SELECT COALESCE(MAX(version_num), 0)::int FROM article_versions WHERE body_id = $1;
